using BankApi.Dtos;
using Npgsql;
using BankApi.Dtos.Account;

namespace BankApi.Services
{
    public class AccountService
    {
        private readonly string _connectionString;

        public AccountService(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")!;
        }

        public async Task<(bool isSuccess, string message, string? iban, int? accountId)> CreateAccountAsync(int userId, CreateAccountDto dto)
        {
            using var conn = new NpgsqlConnection(_connectionString);
            await conn.OpenAsync();

            // 💡 PostgreSQL Fonksiyonunu çağırmanın en kolay yolu standard SQL sorgusudur:
            string sql = "SELECT account_id, iban FROM fn_create_account(@p_user_id, @p_currency_id, @p_nickname)";

            using var cmd = new NpgsqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("p_user_id", userId);
            cmd.Parameters.AddWithValue("p_currency_id", dto.CurrencyId);
            cmd.Parameters.AddWithValue("p_nickname", dto.Nickname);
            try
            {
                using var reader = await cmd.ExecuteReaderAsync();
                if (await reader.ReadAsync())
                {
                    int createdAccountId = reader.GetInt32(0);
                    string createdIban = reader.GetString(1);

                    return (true, "Banka hesabınız başarıyla oluşturuldu!", createdIban, createdAccountId);
                }

                return (false, "Hesap oluşturulamadı.", null, null);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ HESAP OLUŞTURMA HATASI: {ex.Message}");
                return (false, $"Hesap oluşturulurken hata: {ex.Message}", null, null);
            }
        }
        public async Task<List<AccountResponseDto>> GetMyAccountsAsync(int userId)
        {
            using var conn = new NpgsqlConnection(_connectionString);
            await conn.OpenAsync();

            string sql = "SELECT * FROM fn_get_my_accounts(@p_user_id)";

            using var cmd = new NpgsqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("p_user_id", userId);

            var accounts = new List<AccountResponseDto>();

            try
            {
                using var reader = await cmd.ExecuteReaderAsync();

                while (await reader.ReadAsync())
                {
                    accounts.Add(new AccountResponseDto
                    {
                        AccountId = reader.GetInt32(0),
                        Iban = reader.GetString(1),
                        Nickname = reader.GetString(2),
                        Balance = reader.GetDecimal(3),
                        CurrencyCode = reader.GetString(4),
                        Status = reader.GetString(5)
                    });
                }

                return accounts;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ HESAPLAR GETİRİLİRKEN HATA: {ex.Message}");
                return new List<AccountResponseDto>();
            }
        }
        public async Task<bool> UpdateNicknameAsync(UpdateNicknameDto dto)
        {
            using var conn = new NpgsqlConnection(_connectionString);

            await conn.OpenAsync();

            string sql =
                "SELECT fn_update_account_nickname(@p_account_id,@p_nickname)";

            using var cmd = new NpgsqlCommand(sql, conn);

            cmd.Parameters.AddWithValue("p_account_id", dto.AccountId);
            cmd.Parameters.AddWithValue("p_nickname", dto.Nickname);

            await cmd.ExecuteNonQueryAsync();

            return true;
        }

      public async Task<bool> DeactivateAccountAsync(int accountId)
        {
            using var conn = new NpgsqlConnection(_connectionString);

            await conn.OpenAsync();

            string sql =
                "SELECT fn_deactivate_account(@p_account_id)";

            using var cmd = new NpgsqlCommand(sql, conn);

            cmd.Parameters.AddWithValue("p_account_id", accountId);

            try
            {
                await cmd.ExecuteNonQueryAsync();
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return false;
            }
        }
        
        
    }
}