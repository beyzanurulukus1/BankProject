using System.Globalization;
using System.Xml.Linq;
using BankApi.Dtos;
using Npgsql;

namespace BankApi.Services
{
    public class ExchangeRateService
    {
        private const string TcmbUrl =
            "https://www.tcmb.gov.tr/kurlar/today.xml";

        private readonly string _connectionString;
        private readonly IHttpClientFactory _httpClientFactory;

        public ExchangeRateService(
            IConfiguration configuration,
            IHttpClientFactory httpClientFactory)
        {
            _connectionString =
                configuration.GetConnectionString("DefaultConnection")!;

            _httpClientFactory = httpClientFactory;
        }

        public async Task<List<ExchangeRateDto>> UpdateRatesAsync()
        {
            var client = _httpClientFactory.CreateClient();

            var xml = await client.GetStringAsync(TcmbUrl);
            var document = XDocument.Parse(xml);

            using var conn = new NpgsqlConnection(_connectionString);
            await conn.OpenAsync();

            // --------------------------------------------------
            // 1. Para birimlerinin ID'lerini al
            // --------------------------------------------------

            var tryCurrencyId =
                await GetCurrencyIdAsync(conn, "TRY");

            var usdCurrencyId =
                await GetCurrencyIdAsync(conn, "USD");

            var eurCurrencyId =
                await GetCurrencyIdAsync(conn, "EUR");

            // --------------------------------------------------
            // 2. TCMB'den USD ve EUR kurlarını al
            // --------------------------------------------------

            var usd = GetTcmbRate(document, "USD");
            var eur = GetTcmbRate(document, "EUR");

            // --------------------------------------------------
            // 3. TCMB kurlarını DB'ye yaz
            //
            // USD -> TRY
            // EUR -> TRY
            // --------------------------------------------------

            await UpsertRateAsync(
                conn,
                usdCurrencyId,
                tryCurrencyId,
                usd.BuyingRate,
                usd.SellingRate,
                usd.Rate
            );

            await UpsertRateAsync(
                conn,
                eurCurrencyId,
                tryCurrencyId,
                eur.BuyingRate,
                eur.SellingRate,
                eur.Rate
            );

            // --------------------------------------------------
            // 4. TRY -> USD
            //
            // Banka USD sattığı için SELLING kullanılır.
            // --------------------------------------------------

            var tryToUsdRate =
                1m / usd.SellingRate;

            await UpsertRateAsync(
                conn,
                tryCurrencyId,
                usdCurrencyId,
                tryToUsdRate,
                tryToUsdRate,
                tryToUsdRate
            );

            // --------------------------------------------------
            // 5. TRY -> EUR
            //
            // Banka EUR sattığı için SELLING kullanılır.
            // --------------------------------------------------

            var tryToEurRate =
                1m / eur.SellingRate;

            await UpsertRateAsync(
                conn,
                tryCurrencyId,
                eurCurrencyId,
                tryToEurRate,
                tryToEurRate,
                tryToEurRate
            );

            // --------------------------------------------------
            // 6. USD -> EUR
            //
            // USD önce bankaya satılıyor:
            // USD buying
            //
            // Sonra EUR bankadan alınıyor:
            // EUR selling
            //
            // USD -> EUR =
            // USD buying / EUR selling
            // --------------------------------------------------

            var usdToEurRate =
                usd.BuyingRate / eur.SellingRate;

            await UpsertRateAsync(
                conn,
                usdCurrencyId,
                eurCurrencyId,
                usdToEurRate,
                usdToEurRate,
                usdToEurRate
            );

            // --------------------------------------------------
            // 7. EUR -> USD
            //
            // EUR buying / USD selling
            // --------------------------------------------------

            var eurToUsdRate =
                eur.BuyingRate / usd.SellingRate;

            await UpsertRateAsync(
                conn,
                eurCurrencyId,
                usdCurrencyId,
                eurToUsdRate,
                eurToUsdRate,
                eurToUsdRate
            );

            // --------------------------------------------------
            // 8. Güncel kurları DB'den tekrar oku
            // --------------------------------------------------

            return await GetRatesAsync();
        }

        // ======================================================
        // TCMB'den tek bir para biriminin kurunu okur
        // ======================================================

        private static TcmbRate GetTcmbRate(
            XDocument document,
            string currencyCode)
        {
            var currency = document
                .Descendants("Currency")
                .FirstOrDefault(x =>
                    (string?)x.Attribute("CurrencyCode") == currencyCode);

            if (currency == null)
            {
                throw new InvalidOperationException(
                    $"TCMB'de {currencyCode} kuru bulunamadı.");
            }

            var buyingText =
                currency.Element("ForexBuying")?.Value;

            var sellingText =
                currency.Element("ForexSelling")?.Value;

            if (!decimal.TryParse(
                    buyingText,
                    NumberStyles.Any,
                    CultureInfo.InvariantCulture,
                    out var buyingRate))
            {
                throw new InvalidOperationException(
                    $"{currencyCode} alış kuru okunamadı.");
            }

            if (!decimal.TryParse(
                    sellingText,
                    NumberStyles.Any,
                    CultureInfo.InvariantCulture,
                    out var sellingRate))
            {
                throw new InvalidOperationException(
                    $"{currencyCode} satış kuru okunamadı.");
            }

            var rate =
                (buyingRate + sellingRate) / 2m;

            return new TcmbRate
            {
                BuyingRate = buyingRate,
                SellingRate = sellingRate,
                Rate = rate
            };
        }

        // ======================================================
        // DB'deki güncel kurları getirir
        // ======================================================

        public async Task<List<ExchangeRateDto>> GetRatesAsync()
        {
            var rates = new List<ExchangeRateDto>();

            using var conn =
                new NpgsqlConnection(_connectionString);

            await conn.OpenAsync();

            const string sql = @"
                SELECT
                    fc.code,
                    tc.code,
                    er.buying_rate,
                    er.selling_rate,
                    er.rate,
                    er.updated_at
                FROM exchange_rates er
                INNER JOIN currencies fc
                    ON fc.id = er.from_currency_id
                INNER JOIN currencies tc
                    ON tc.id = er.to_currency_id
                ORDER BY fc.code, tc.code;
            ";

            using var cmd =
                new NpgsqlCommand(sql, conn);

            using var reader =
                await cmd.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                rates.Add(new ExchangeRateDto
                {
                    FromCurrency = reader.GetString(0),
                    ToCurrency = reader.GetString(1),
                    BuyingRate = reader.GetDecimal(2),
                    SellingRate = reader.GetDecimal(3),
                    Rate = reader.GetDecimal(4),
                    UpdatedAt = reader.GetDateTime(5)
                });
            }

            return rates;
        }

        // ======================================================
        // Currency ID getirir
        // ======================================================

        private static async Task<int> GetCurrencyIdAsync(
            NpgsqlConnection conn,
            string code)
        {
            const string sql = @"
                SELECT id
                FROM currencies
                WHERE code = @code;
            ";

            using var cmd =
                new NpgsqlCommand(sql, conn);

            cmd.Parameters.AddWithValue(
                "code",
                code);

            var result =
                await cmd.ExecuteScalarAsync();

            if (result == null)
            {
                throw new InvalidOperationException(
                    $"Para birimi bulunamadı: {code}");
            }

            return Convert.ToInt32(result);
        }

        // ======================================================
        // Exchange rate INSERT / UPDATE
        // ======================================================

        private static async Task UpsertRateAsync(
            NpgsqlConnection conn,
            int fromCurrencyId,
            int toCurrencyId,
            decimal buyingRate,
            decimal sellingRate,
            decimal rate)
        {
            const string sql = @"
                INSERT INTO exchange_rates
                (
                    from_currency_id,
                    to_currency_id,
                    buying_rate,
                    selling_rate,
                    rate,
                    updated_at
                )
                VALUES
                (
                    @from_currency_id,
                    @to_currency_id,
                    @buying_rate,
                    @selling_rate,
                    @rate,
                    CURRENT_TIMESTAMP
                )
                ON CONFLICT (from_currency_id, to_currency_id)
                DO UPDATE SET
                    buying_rate = EXCLUDED.buying_rate,
                    selling_rate = EXCLUDED.selling_rate,
                    rate = EXCLUDED.rate,
                    updated_at = CURRENT_TIMESTAMP;
            ";

            using var cmd =
                new NpgsqlCommand(sql, conn);

            cmd.Parameters.AddWithValue(
                "from_currency_id",
                fromCurrencyId);

            cmd.Parameters.AddWithValue(
                "to_currency_id",
                toCurrencyId);

            cmd.Parameters.AddWithValue(
                "buying_rate",
                buyingRate);

            cmd.Parameters.AddWithValue(
                "selling_rate",
                sellingRate);

            cmd.Parameters.AddWithValue(
                "rate",
                rate);

            await cmd.ExecuteNonQueryAsync();
        }

        // ======================================================
        // TCMB kur modeli
        // ======================================================

        private class TcmbRate
        {
            public decimal BuyingRate { get; set; }
            public decimal SellingRate { get; set; }
            public decimal Rate { get; set; }
        }
    }
}