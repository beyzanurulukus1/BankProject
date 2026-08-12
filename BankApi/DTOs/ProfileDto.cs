namespace BankApi.DTOs
{
    public class ProfileDto
    {
        public string FirstName { get; set; } = string.Empty;

        public string LastName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string PhoneNumber { get; set; } = string.Empty;

        public string Tckn { get; set; } = string.Empty;

        public DateTime BirthDate { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}