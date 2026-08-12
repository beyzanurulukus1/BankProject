namespace BankApi.Dtos.Account
{
    public class ExchangeCurrencyDto
    {
        public int SourceAccountId { get; set; }

        public int TargetAccountId { get; set; }

        public decimal Amount { get; set; }

        public string? Description { get; set; }
    }
}