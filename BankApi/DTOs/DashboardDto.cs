namespace BankApi.Dtos
{
    public class DashboardDto
    {
        public string CustomerName { get; set; } = string.Empty;
        public  List<CurrencyBalanceDto> Balances { get; set; }= new();
        public int AccountCount { get; set; }
        public int ActiveAccountCount { get; set; }
        public List<TransactionHistoryDto> RecentTransactions { get; set; } = new();
    }
    public class CurrencyBalanceDto
    {
        public string CurrencyCode { get; set; } = string.Empty;
        public decimal Balance { get; set; }
        public string CurrencySymbol {get; set; } = string.Empty;
    }
}