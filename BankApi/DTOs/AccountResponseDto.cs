namespace BankApi.Dtos.Account;

public class AccountResponseDto
{
    public int AccountId { get; set; }

    public string Iban { get; set; } = string.Empty;

    public decimal Balance { get; set; }

    public string CurrencyCode { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;
    public string Nickname { get; set; } = string.Empty;
}