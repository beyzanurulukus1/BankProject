namespace BankApi.Dtos
{
   
    public class DepositDto
    {
        public int AccountId { get; set; }
        public decimal Amount { get; set; }
        public string? Description { get; set; }
    }
}