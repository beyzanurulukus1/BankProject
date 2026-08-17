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
    public class HistoricalPriceDto
    {
        public DateTime Date { get; set; }

        public decimal? Open { get; set; }

        public decimal? High { get; set; }

        public decimal? Low { get; set; }

        public decimal? Close { get; set; }

        public long? Volume { get; set; }
    }

    public class InvestmentAccountDto
    {
        public int Id { get; set; }

        public int UserId { get; set; }

        public decimal CashBalance { get; set; }

        public DateTime CreatedAt { get; set; }
    }
    public class InvestmentDepositRequest
    {
        public int SourceAccountId { get; set; }
        public decimal Amount { get; set; }
    }
    public class BuyStockRequest
    {
        public string Symbol { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
    }
    public class InvestmentBuyResultDto
    {
        public int InvestmentAccountId { get; set; }

        public string Symbol { get; set; } = string.Empty;

        public decimal BoughtQuantity { get; set; }

        public decimal Price { get; set; }

        public decimal TotalAmount { get; set; }

        public decimal NewCashBalance { get; set; }

        public decimal PortfolioQuantity { get; set; }

        public decimal AverageCost { get; set; }

        public string Message { get; set; } = string.Empty;
    }
    public class PortfolioPositionDto
    {
        public string Symbol { get; set; } = string.Empty;

        public decimal Quantity { get; set; }

        public decimal AverageCost { get; set; }

        public decimal CurrentPrice { get; set; }

        public decimal TotalCost { get; set; }

        public decimal CurrentValue { get; set; }

        public decimal ProfitLoss { get; set; }
        public decimal ProfitLossPercent { get; set; }
    }
    public class PortfolioDto
    {
        public int InvestmentAccountId { get; set; }

        public decimal CashBalance { get; set; }
        public decimal TotalCost { get; set; }
        public decimal TotalValue { get; set; }
        public decimal TotalProfitLoss { get; set; }
        public decimal TotalProfitLossPercent { get; set; }

        public List<PortfolioPositionDto> Positions { get; set; } = new();
    }
    public class SellStockRequest
    {
        public string Symbol { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
    }
    public class InvestmentSellResultDto
    {
        public int InvestmentAccountId { get; set; }

        public string Symbol { get; set; } = string.Empty;

        public decimal SoldQuantity { get; set; }

        public decimal Price { get; set; }

        public decimal TotalAmount { get; set; }

        public decimal RealizedProfitLoss { get; set; }

        public decimal NewCashBalance { get; set; }

        public decimal RemainingQuantity { get; set; }

        public decimal AverageCost { get; set; }

        public string Message { get; set; } = string.Empty;
    }
    public class InvestmentTransactionDto
{
    public int Id { get; set; }

    public string Symbol { get; set; } = string.Empty;

    public string TransactionType { get; set; } = string.Empty;

    public decimal Quantity { get; set; }

    public decimal Price { get; set; }

    public decimal TotalAmount { get; set; }

    public decimal? RealizedProfitLoss { get; set; }

    public DateTime CreatedAt { get; set; }
}


public class InvestmentTransactionSummaryDto
{
    public decimal TotalRealizedProfitLoss { get; set; }

    public List<InvestmentTransactionDto> Transactions { get; set; } = new();
}
}