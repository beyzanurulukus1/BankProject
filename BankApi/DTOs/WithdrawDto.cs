namespace BankApi.Dtos.Account;

public class WithdrawDto
{
    public int AccountId { get; set; }
    public decimal Amount { get; set; }
    public string? Description { get; set; } = string.Empty;
}