namespace BankApi.Dtos
{
    public class CreateAccountDto
    {
        public int CurrencyId { get; set; }
        public string Nickname { get; set; } = string.Empty;
    }
}