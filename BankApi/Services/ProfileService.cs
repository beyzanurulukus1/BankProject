using BankApi.DTOs;
using Npgsql;

namespace BankApi.Services
{
    public class ProfileService
    {
        private readonly string _connectionString;

        public ProfileService(IConfiguration configuration)
        {
            _connectionString =
                configuration.GetConnectionString("DefaultConnection")!;
        }

        public async Task<ProfileDto?> GetProfileAsync(int userId)
        {
            using var conn = new NpgsqlConnection(_connectionString);

            await conn.OpenAsync();

            string sql = @"
                SELECT
                    first_name,
                    last_name,
                    email,
                    phone_number,
                    tckn,
                    birth_date,
                    created_at
                FROM fn_get_profile(@p_user_id)
            ";

            using var cmd = new NpgsqlCommand(sql, conn);

            cmd.Parameters.AddWithValue(
                "p_user_id",
                userId
            );

            using var reader = await cmd.ExecuteReaderAsync();

            if (!await reader.ReadAsync())
            {
                return null;
            }

            return new ProfileDto
            {
                FirstName = reader.GetString(0),
                LastName = reader.GetString(1),
                Email = reader.GetString(2),
                PhoneNumber = reader.GetString(3),
                Tckn = reader.GetString(4),
                BirthDate = reader.GetDateTime(5),
                CreatedAt = reader.GetDateTime(6)
            };
        }
    }
}