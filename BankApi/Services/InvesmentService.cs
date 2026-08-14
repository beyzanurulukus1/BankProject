using System.Text.Json;
using BankApi.Dtos;
using Npgsql;

namespace BankApi.Services
{
    public class InvestmentService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly string _connectionString;

        public InvestmentService(
            IConfiguration configuration,
            IHttpClientFactory httpClientFactory)
        {
            _httpClientFactory = httpClientFactory;

            _connectionString =
                configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException(
                    "DefaultConnection bulunamadı.");
        }

        public async Task<StockDto?> GetStockAsync(string symbol)
        {
            var client = _httpClientFactory.CreateClient();

            var url =
                $"http://localhost:3001/api/market/stock/{symbol}";

            var response = await client.GetAsync(url);

            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();

            var result =
                JsonSerializer.Deserialize<MarketResponse<StockDto>>(
                    json,
                    new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

            return result?.Data;
        }

        public async Task<IndexDto?> GetIndexAsync(string symbol)
        {
            var client = _httpClientFactory.CreateClient();

            var url =
                $"http://localhost:3001/api/market/index/{symbol}";

            var response = await client.GetAsync(url);

            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();

            var result =
                JsonSerializer.Deserialize<MarketResponse<IndexDto>>(
                    json,
                    new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

            return result?.Data;
        }

        public async Task<List<HistoricalPriceDto>> GetHistoricalDataAsync(
            string symbol,
            string period = "1mo",
            string interval = "1d")
        {
            var client = _httpClientFactory.CreateClient();

            var url =
                $"http://localhost:3001/api/market/history/{symbol}" +
                $"?period={period}&interval={interval}";

            var response = await client.GetAsync(url);

            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();

            var result =
                JsonSerializer.Deserialize<
                    MarketResponse<HistoricalResponse>>(
                        json,
                        new JsonSerializerOptions
                        {
                            PropertyNameCaseInsensitive = true
                        });

            if (result?.Data?.Quotes == null)
            {
                return new List<HistoricalPriceDto>();
            }

            return result.Data.Quotes
                .Where(x => x.Close.HasValue)
                .Select(x => new HistoricalPriceDto
                {
                    Date = x.Date,
                    Open = x.Open,
                    High = x.High,
                    Low = x.Low,
                    Close = x.Close,
                    Volume = x.Volume
                })
                .ToList();
        }

        public async Task<InvestmentAccountDto?>
            GetOrCreateInvestmentAccountAsync(int userId)
        {
            const string sql = @"
                SELECT
                    id,
                    user_id,
                    cash_balance,
                    created_at
                FROM fn_get_or_create_investment_account(@user_id);
            ";

            using var conn =
                new NpgsqlConnection(_connectionString);

            await conn.OpenAsync();

            using var cmd =
                new NpgsqlCommand(sql, conn);

            cmd.Parameters.AddWithValue(
                "user_id",
                userId);

            using var reader =
                await cmd.ExecuteReaderAsync();

            if (!await reader.ReadAsync())
            {
                return null;
            }

            return new InvestmentAccountDto
            {
                Id = reader.GetInt32(0),
                UserId = reader.GetInt32(1),
                CashBalance = reader.GetDecimal(2),
                CreatedAt = reader.GetDateTime(3)
            };
        }
        public async Task<InvestmentAccountDto?> TransferToInvestmentAccountAsync(
    int userId,
    int sourceAccountId,
    decimal amount)
        {
            const string sql = @"
        SELECT
            investment_account_id,
            source_account_id,
            new_source_balance,
            new_investment_balance,
            message
        FROM fn_transfer_to_investment_account(
            @user_id,
            @source_account_id,
            @amount
        );
    ";

            using var conn = new NpgsqlConnection(_connectionString);
            await conn.OpenAsync();

            using var cmd = new NpgsqlCommand(sql, conn);

            cmd.Parameters.AddWithValue("user_id", userId);
            cmd.Parameters.AddWithValue("source_account_id", sourceAccountId);
            cmd.Parameters.AddWithValue("amount", amount);

            using var reader = await cmd.ExecuteReaderAsync();

            if (!await reader.ReadAsync())
            {
                return null;
            }

            return new InvestmentAccountDto
            {
                Id = reader.GetInt32(0),
                UserId = userId,
                CashBalance = reader.GetDecimal(3)
            };
        }

        public class MarketResponse<T>
        {
            public bool IsSuccess { get; set; }

            public T? Data { get; set; }

            public string? Message { get; set; }
        }

        public class HistoricalResponse
        {
            public List<HistoricalQuoteDto> Quotes { get; set; } = new();
        }

        public class HistoricalQuoteDto
        {
            public DateTime Date { get; set; }

            public decimal? Open { get; set; }

            public decimal? High { get; set; }

            public decimal? Low { get; set; }

            public decimal? Close { get; set; }

            public long? Volume { get; set; }
        }
        public async Task<InvestmentBuyResultDto?> BuyStockAsync(
        int userId,
        string symbol,
        decimal quantity)
        {
            if (quantity <= 0)
            {
                throw new InvalidOperationException(
                    "Hisse adedi sıfırdan büyük olmalıdır.");
            }

            // 1. Güncel fiyatı market servisinden al
            var stock = await GetStockAsync(symbol);

            if (stock == null || stock.Price <= 0)
            {
                throw new InvalidOperationException(
                    "Hissenin güncel fiyatı alınamadı.");
            }

            // 2. Güncel fiyatla PostgreSQL function'ını çağır
            const string sql = @"
        SELECT
            investment_account_id,
            symbol,
            bought_quantity,
            price,
            total_amount,
            new_cash_balance,
            portfolio_quantity,
            average_cost,
            message
        FROM fn_buy_stock(
            @user_id,
            @symbol,
            @quantity,
            @price
        );
    ";

            using var conn =
                new NpgsqlConnection(_connectionString);

            await conn.OpenAsync();

            using var cmd =
                new NpgsqlCommand(sql, conn);

            cmd.Parameters.AddWithValue("user_id", userId);
            cmd.Parameters.AddWithValue("symbol", symbol.ToUpper());
            cmd.Parameters.AddWithValue("quantity", quantity);
            cmd.Parameters.AddWithValue("price", stock.Price);

            using var reader =
                await cmd.ExecuteReaderAsync();

            if (!await reader.ReadAsync())
            {
                return null;
            }

            return new InvestmentBuyResultDto
            {
                InvestmentAccountId = reader.GetInt32(0),
                Symbol = reader.GetString(1),
                BoughtQuantity = reader.GetDecimal(2),
                Price = reader.GetDecimal(3),
                TotalAmount = reader.GetDecimal(4),
                NewCashBalance = reader.GetDecimal(5),
                PortfolioQuantity = reader.GetDecimal(6),
                AverageCost = reader.GetDecimal(7),
                Message = reader.GetString(8)
            };
        }
        public async Task<PortfolioDto?> GetPortfolioAsync(int userId)
{
    const string sql = @"
        SELECT
            ia.id,
            ia.cash_balance,
            pp.symbol,
            pp.quantity,
            pp.average_cost
        FROM investment_accounts AS ia
        LEFT JOIN portfolio_positions AS pp
            ON pp.investment_account_id = ia.id
        WHERE ia.user_id = @user_id
        ORDER BY pp.symbol;
    ";

    using var conn = new NpgsqlConnection(_connectionString);
    await conn.OpenAsync();

    using var cmd = new NpgsqlCommand(sql, conn);

    cmd.Parameters.AddWithValue("user_id", userId);

    using var reader = await cmd.ExecuteReaderAsync();

    PortfolioDto? portfolio = null;

    while (await reader.ReadAsync())
    {
        if (portfolio == null)
        {
            portfolio = new PortfolioDto
            {
                InvestmentAccountId = reader.GetInt32(0),
                CashBalance = reader.GetDecimal(1)
            };
        }

        if (reader.IsDBNull(2))
        {
            continue;
        }

        portfolio.Positions.Add(
            new PortfolioPositionDto
            {
                Symbol = reader.GetString(2),
                Quantity = reader.GetDecimal(3),
                AverageCost = reader.GetDecimal(4)
            }
        );
    }

    if (portfolio == null)
    {
        return null;
    }

    foreach (var position in portfolio.Positions)
    {
        var stock = await GetStockAsync(position.Symbol);

        if (stock == null || stock.Price <= 0)
        {
            continue;
        }

        position.CurrentPrice = stock.Price;

        position.TotalCost =
            position.Quantity *
            position.AverageCost;

        position.CurrentValue =
            position.Quantity *
            position.CurrentPrice;

        position.ProfitLoss =
            position.CurrentValue -
            position.TotalCost;

        position.ProfitLossPercent =
            position.TotalCost == 0
                ? 0
                : (
                    position.ProfitLoss /
                    position.TotalCost
                  ) * 100;

        portfolio.TotalCost +=
            position.TotalCost;

        portfolio.TotalValue +=
            position.CurrentValue;
    }

    portfolio.TotalProfitLoss =
        portfolio.TotalValue -
        portfolio.TotalCost;

    portfolio.TotalProfitLossPercent =
        portfolio.TotalCost == 0
            ? 0
            : (
                portfolio.TotalProfitLoss /
                portfolio.TotalCost
              ) * 100;

    return portfolio;
}
    }
}