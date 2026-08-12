namespace BankApi.Dtos
{
    public class TransferDto
    {
        public int SourceAccountId { get; set; }
        public string TargetIban { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string? Description { get; set; }
    }
}