using BankApi.Dtos;
using BankApi.Dtos.Account;
using Npgsql;

namespace BankApi.Services
{
    public class TransactionService
    {
        private readonly string _connectionString;

        public TransactionService(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")!;
        }

        public async Task<(bool isSuccess, string message, string? referenceNo, int? transactionId)> TransferAsync(int userId, TransferDto dto)
        {
            using var conn = new NpgsqlConnection(_connectionString);
            await conn.OpenAsync();

            string sql = "SELECT transaction_id, reference_no, message FROM fn_transfer_money(@p_user_id, @p_source_account_id, @p_target_iban, @p_amount, @p_description)";

            using var cmd = new NpgsqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("p_user_id", userId);
            cmd.Parameters.AddWithValue("p_source_account_id", dto.SourceAccountId);
            cmd.Parameters.AddWithValue("p_target_iban", dto.TargetIban.Trim());
            cmd.Parameters.AddWithValue("p_amount", dto.Amount);
            cmd.Parameters.AddWithValue("p_description", (object?)dto.Description ?? "Hesaplar Arası Transfer");

            try
            {
                using var reader = await cmd.ExecuteReaderAsync();
                if (await reader.ReadAsync())
                {
                    int txnId = reader.GetInt32(0);
                    string refNo = reader.GetString(1);
                    string msg = reader.GetString(2);

                    return (true, msg, refNo, txnId);
                }

                return (false, "İşlem gerçekleştirilemedi.", null, null);
            }
            catch (PostgresException ex)
            {
                // RAISE EXCEPTION ile fırlatılan özel mesajları doğrudan yakalıyoruz
                return (false, ex.MessageText, null, null);
            }
            catch (Exception ex)
            {
                return (false, $"Beklenmeyen hata: {ex.Message}", null, null);
            }
        }
        public async Task<List<TransactionHistoryDto>> GetTransactionHistoryAsync(int userId)
        {
            var history = new List<TransactionHistoryDto>();
            using var conn = new NpgsqlConnection(_connectionString);
            await conn.OpenAsync();

            string sql = @"
    SELECT
        transaction_id,
        reference_no,
        source_iban,
        target_iban,
        amount,
        currency_code,
        currency_symbol,
        transaction_type,
        description,
        status,
        transaction_time,
        is_outgoing
    FROM fn_get_transaction_history(@p_user_id)
";

            using var cmd = new NpgsqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("p_user_id", userId);

            using var reader = await cmd.ExecuteReaderAsync();
while (await reader.ReadAsync())
{
    history.Add(new TransactionHistoryDto
    {
        TransactionId = reader.GetInt32(0),
        ReferenceNo = reader.GetString(1),

        SourceIban = reader.IsDBNull(2)
            ? null
            : reader.GetString(2),

        TargetIban = reader.IsDBNull(3)
            ? null
            : reader.GetString(3),

        Amount = reader.GetDecimal(4),

        CurrencyCode = reader.GetString(5),
        CurrencySymbol = reader.GetString(6),

        TransactionType = reader.GetString(7),

        Description = reader.IsDBNull(8)
            ? null
            : reader.GetString(8),

        Status = reader.GetString(9),

        TransactionTime = reader.GetDateTime(10),

        IsOutgoing = reader.GetBoolean(11)
    });
}

            return history;
        }
        public async Task<(bool isSuccess, string message, string? referenceNo, decimal? newBalance)> DepositAsync(int userId, DepositDto dto)
        {
            using var conn = new NpgsqlConnection(_connectionString);
            await conn.OpenAsync();

            string sql = "SELECT transaction_id, reference_no, new_balance, message FROM fn_deposit_money(@p_user_id, @p_account_id, @p_amount, @p_description)";

            using var cmd = new NpgsqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("p_user_id", userId);
            cmd.Parameters.AddWithValue("p_account_id", dto.AccountId);
            cmd.Parameters.AddWithValue("p_amount", dto.Amount);
            cmd.Parameters.AddWithValue("p_description", (object?)dto.Description ?? "ATM Para Yatırma");

            try
            {
                using var reader = await cmd.ExecuteReaderAsync();
                if (await reader.ReadAsync())
                {
                    string refNo = reader.GetString(1);
                    decimal newBal = reader.GetDecimal(2);
                    string msg = reader.GetString(3);

                    return (true, msg, refNo, newBal);
                }

                return (false, "Para yatırma işlemi başarısız.", null, null);
            }
            catch (PostgresException ex)
            {
                return (false, ex.MessageText, null, null);
            }
            catch (Exception ex)
            {
                return (false, $"Beklenmeyen hata: {ex.Message}", null, null);
            }
        }
        public async Task<(bool isSuccess, string message, string? referenceNo, decimal? newBalance)> WithdrawAsync(int userId, WithdrawDto dto)
        {
            using var conn = new NpgsqlConnection(_connectionString);
            await conn.OpenAsync();

            string sql = "SELECT transaction_id, reference_no, new_balance, message FROM fn_withdraw_money(@p_user_id, @p_account_id, @p_amount, @p_description)";

            using var cmd = new NpgsqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("p_user_id", userId);
            cmd.Parameters.AddWithValue("p_account_id", dto.AccountId);
            cmd.Parameters.AddWithValue("p_amount", dto.Amount);
            cmd.Parameters.AddWithValue("p_description", (object?)dto.Description ?? "ATM Para Çekme");

            try
            {
                using var reader = await cmd.ExecuteReaderAsync();
                if (await reader.ReadAsync())
                {
                    string refNo = reader.GetString(1);
                    decimal newBal = reader.GetDecimal(2);
                    string msg = reader.GetString(3);

                    return (true, msg, refNo, newBal);
                }

                return (false, "Para çekme işlemi başarısız.", null, null);
            }
            catch (PostgresException ex)
            {
                return (false, ex.MessageText, null, null);
            }
            catch (Exception ex)
            {
                return (false, $"Beklenmeyen hata: {ex.Message}", null, null);
            }
        }
    public async Task<(
    bool isSuccess,
    string message,
    string? referenceNo,
    int? transactionId,
    decimal? sourceAmount,
    decimal? targetAmount,
    decimal? exchangeRate,
    string? exchangeRateType
)> ExchangeCurrencyAsync(
    int userId,
    int sourceAccountId,
    int targetAccountId,
    decimal amount,
    string? description)
{
    using var conn = new NpgsqlConnection(_connectionString);
    await conn.OpenAsync();

    const string sql = @"
        SELECT
            transaction_id,
            reference_no,
            source_amount,
            target_amount,
            exchange_rate,
            exchange_rate_type,
            message
        FROM fn_exchange_currency(
            @p_user_id,
            @p_source_account_id,
            @p_target_account_id,
            @p_amount,
            @p_description
        );
    ";

    using var cmd = new NpgsqlCommand(sql, conn);

    cmd.Parameters.AddWithValue("p_user_id", userId);
    cmd.Parameters.AddWithValue("p_source_account_id", sourceAccountId);
    cmd.Parameters.AddWithValue("p_target_account_id", targetAccountId);
    cmd.Parameters.AddWithValue("p_amount", amount);
    cmd.Parameters.AddWithValue(
        "p_description",
        (object?)description ?? "Döviz Dönüşümü"
    );

    try
    {
        using var reader = await cmd.ExecuteReaderAsync();

        if (await reader.ReadAsync())
        {
            return (
                true,
                reader.GetString(6),
                reader.GetString(1),
                reader.GetInt32(0),
                reader.GetDecimal(2),
                reader.GetDecimal(3),
                reader.GetDecimal(4),
                reader.GetString(5)
            );
        }

        return (
            false,
            "Döviz dönüşümü gerçekleştirilemedi.",
            null,
            null,
            null,
            null,
            null,
            null
        );
    }
    catch (PostgresException ex)
    {
        return (
            false,
            ex.MessageText,
            null,
            null,
            null,
            null,
            null,
            null
        );
    }
    catch (Exception ex)
    {
        return (
            false,
            $"Beklenmeyen hata: {ex.Message}",
            null,
            null,
            null,
            null,
            null,
            null
        );
    }
}
    }
}