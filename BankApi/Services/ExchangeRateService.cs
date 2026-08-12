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

            var targetCurrencies = new[] { "USD", "EUR" };

            var rates = new List<ExchangeRateDto>();

            using var conn = new NpgsqlConnection(_connectionString);
            await conn.OpenAsync();

            var tryCurrencyId = await GetCurrencyIdAsync(conn, "TRY");

            foreach (var code in targetCurrencies)
            {
                var currency = document
                    .Descendants("Currency")
                    .FirstOrDefault(x =>
                        (string?)x.Attribute("CurrencyCode") == code);

                if (currency == null)
                    continue;

                var buyingText = currency.Element("ForexBuying")?.Value;
                var sellingText = currency.Element("ForexSelling")?.Value;

                if (!decimal.TryParse(
                        buyingText,
                        NumberStyles.Any,
                        CultureInfo.InvariantCulture,
                        out var buyingRate))
                {
                    continue;
                }

                if (!decimal.TryParse(
                        sellingText,
                        NumberStyles.Any,
                        CultureInfo.InvariantCulture,
                        out var sellingRate))
                {
                    continue;
                }

                var rate = (buyingRate + sellingRate) / 2m;

                var fromCurrencyId =
                    await GetCurrencyIdAsync(conn, code);

                await UpsertRateAsync(
                    conn,
                    fromCurrencyId,
                    tryCurrencyId,
                    buyingRate,
                    sellingRate,
                    rate
                );

                rates.Add(new ExchangeRateDto
                {
                    FromCurrency = code,
                    ToCurrency = "TRY",
                    BuyingRate = buyingRate,
                    SellingRate = sellingRate,
                    Rate = rate,
                    UpdatedAt = DateTime.Now
                });
            }

            return rates;
        }

        public async Task<List<ExchangeRateDto>> GetRatesAsync()
        {
            var rates = new List<ExchangeRateDto>();

            using var conn = new NpgsqlConnection(_connectionString);
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
                ORDER BY fc.code;
            ";

            using var cmd = new NpgsqlCommand(sql, conn);
            using var reader = await cmd.ExecuteReaderAsync();

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

        private static async Task<int> GetCurrencyIdAsync(
            NpgsqlConnection conn,
            string code)
        {
            const string sql = @"
                SELECT id
                FROM currencies
                WHERE code = @code;
            ";

            using var cmd = new NpgsqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("code", code);

            var result = await cmd.ExecuteScalarAsync();

            if (result == null)
            {
                throw new InvalidOperationException(
                    $"Para birimi bulunamadı: {code}");
            }

            return Convert.ToInt32(result);
        }

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

            using var cmd = new NpgsqlCommand(sql, conn);

            cmd.Parameters.AddWithValue(
                "from_currency_id", fromCurrencyId);

            cmd.Parameters.AddWithValue(
                "to_currency_id", toCurrencyId);

            cmd.Parameters.AddWithValue(
                "buying_rate", buyingRate);

            cmd.Parameters.AddWithValue(
                "selling_rate", sellingRate);

            cmd.Parameters.AddWithValue(
                "rate", rate);

            await cmd.ExecuteNonQueryAsync();
        }
    }
}