using System.Text.Json;
using BankApi.Dtos;

namespace BankApi.Services
{
    public class InvestmentService
    {
        private readonly IHttpClientFactory _httpClientFactory;

        public InvestmentService(
            IHttpClientFactory httpClientFactory)
        {
            _httpClientFactory = httpClientFactory;
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
    }

    public class MarketResponse<T>
    {
        public bool IsSuccess { get; set; }

        public T? Data { get; set; }

        public string? Message { get; set; }
    }
}