namespace BankApi.Dtos
{
    public class TransactionHistoryDto
    {
        public int TransactionId { get; set; }
        public string ReferenceNo { get; set; } = string.Empty;
        public string? SourceIban { get; set; }
        public string? TargetIban { get; set; }
        public decimal Amount { get; set; }
        public string TransactionType { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime TransactionTime { get; set; }
        public string CurrencyCode { get; set; } = string.Empty;
        public string CurrencySymbol { get; set; } = string.Empty;
        public bool IsOutgoing { get; set; } // true: Para Çıkışı (-), false: Para Girişi (+)
    }
}