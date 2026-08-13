namespace BankApi.Dtos
{
    public class StockDto
    {
        public string Symbol { get; set; } = string.Empty;

        public string Name { get; set; } = string.Empty;

        public decimal Price { get; set; }

        public decimal Change { get; set; }

        public decimal ChangePercent { get; set; }

        public decimal High { get; set; }

        public decimal Low { get; set; }

        public decimal Open { get; set; }

        public decimal Close { get; set; }

        public long Volume { get; set; }

        public DateTime Timestamp { get; set; }
    }

    public class IndexDto
    {
        public string Symbol { get; set; } = string.Empty;

        public string Name { get; set; } = string.Empty;

        public decimal Value { get; set; }

        public decimal Change { get; set; }

        public decimal ChangePercent { get; set; }

        public decimal High { get; set; }

        public decimal Low { get; set; }

        public long Volume { get; set; }

        public DateTime Timestamp { get; set; }
    }
}