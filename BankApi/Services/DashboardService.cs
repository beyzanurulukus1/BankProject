using BankApi.Dtos;
using Npgsql;

namespace BankApi.Services
{
    public class DashboardService
    {
        private readonly string _connectionString;
        private readonly TransactionService _transactionService;

        public DashboardService(
            IConfiguration configuration,
            TransactionService transactionService)
        {
            _connectionString =
                configuration.GetConnectionString("DefaultConnection")!;

            _transactionService = transactionService;
        }

        public async Task<DashboardDto> GetDashboardDataAsync(int userId)
        {
            var dashboard = new DashboardDto();

            using (var conn = new NpgsqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                string sql = @"
                    SELECT
                        customer_name,
                        currency_code,
                        currency_symbol,
                        balance,
                        account_count,
                        active_account_count
                    FROM fn_get_dashboard_summary(@p_user_id)
                ";

                using var cmd = new NpgsqlCommand(sql, conn);

                cmd.Parameters.AddWithValue(
                    "p_user_id",
                    userId
                );

                using var reader = await cmd.ExecuteReaderAsync();

                while (await reader.ReadAsync())
                {
                    // Müşteri adı
                    dashboard.CustomerName = reader.GetString(0);

                    // Para birimi bakiyesi
                    dashboard.Balances.Add(
                        new CurrencyBalanceDto
                        {
                            CurrencyCode = reader.GetString(1),
                            CurrencySymbol = reader.GetString(2),
                            Balance = reader.GetDecimal(3)
                        }
                    );

                    // Hesap bilgileri
                    dashboard.AccountCount = reader.GetInt32(4);
                    dashboard.ActiveAccountCount = reader.GetInt32(5);
                }
            }

            // Son 5 işlem
            var allTransactions =
                await _transactionService.GetTransactionHistoryAsync(userId);

            dashboard.RecentTransactions =
                allTransactions.Take(5).ToList();

            return dashboard;
        }
    }
}