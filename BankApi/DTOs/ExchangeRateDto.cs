namespace BankApi.Dtos
{
    public class ExchangeRateDto
    {
        public string FromCurrency { get; set; } = string.Empty;
        public string ToCurrency { get; set; } = string.Empty;

        public decimal BuyingRate { get; set; }
        public decimal SellingRate { get; set; }
        public decimal Rate { get; set; }

        public DateTime UpdatedAt { get; set; }
    }
}