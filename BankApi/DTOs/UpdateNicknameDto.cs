namespace BankApi.Dtos.Account;

public class UpdateNicknameDto
{
    public int AccountId { get; set; }

    public string Nickname { get; set; } = string.Empty;
}