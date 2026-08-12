using System;
using System.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BankApi.DTOs;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Npgsql;

namespace BankApi.Services
{
    public class AuthService
    {
        private readonly string _connectionString;
        private readonly IConfiguration _configuration;

        public AuthService(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
        }

        public int RegisterCustomer(RegisterDto dto)
        {
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();

            using var cmd = new NpgsqlCommand("sp_register_customer", conn);
            cmd.CommandType = CommandType.StoredProcedure;

            // Veritabanındaki 'sp_register_customer' prosedür sıralaması ve tipleri:
            
            // 1. p_email VARCHAR(255)
            cmd.Parameters.Add(new NpgsqlParameter("p_email", NpgsqlTypes.NpgsqlDbType.Varchar) { Value = dto.Email });

            // 2. p_password_hash VARCHAR(255)
            string hashedPassword = BCrypt.Net.BCrypt.HashPassword(dto.Password);
            cmd.Parameters.Add(new NpgsqlParameter("p_password_hash", NpgsqlTypes.NpgsqlDbType.Varchar) { Value = hashedPassword });

            // 3. p_role_id INT (Customer rol ID'si = 2)
            cmd.Parameters.Add(new NpgsqlParameter("p_role_id", NpgsqlTypes.NpgsqlDbType.Integer) { Value = 2 });

            // 4. p_tckn VARCHAR(11)
            cmd.Parameters.Add(new NpgsqlParameter("p_tckn", NpgsqlTypes.NpgsqlDbType.Varchar) { Value = dto.TCKN });

            // 5. p_first_name VARCHAR(100)
            cmd.Parameters.Add(new NpgsqlParameter("p_first_name", NpgsqlTypes.NpgsqlDbType.Varchar) { Value = dto.FirstName });

            // 6. p_last_name VARCHAR(100)
            cmd.Parameters.Add(new NpgsqlParameter("p_last_name", NpgsqlTypes.NpgsqlDbType.Varchar) { Value = dto.LastName });

            // 7. p_phone_number VARCHAR(20)
            cmd.Parameters.Add(new NpgsqlParameter("p_phone_number", NpgsqlTypes.NpgsqlDbType.Varchar) { Value = dto.PhoneNumber });

            // 8. p_birth_date DATE
            cmd.Parameters.Add(new NpgsqlParameter("p_birth_date", NpgsqlTypes.NpgsqlDbType.Date) { Value = dto.DateOfBirth });

            // 9. INOUT p_user_id INT
            var outParam = new NpgsqlParameter("p_user_id", NpgsqlTypes.NpgsqlDbType.Integer)
            {
                Direction = ParameterDirection.InputOutput,
                Value = DBNull.Value
            };
            cmd.Parameters.Add(outParam);

            cmd.ExecuteNonQuery();

            return (int)outParam.Value;
        }

        public (bool IsSuccess, string Message, string Token) Login(LoginDto dto)
        {
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();

            using var cmd = new NpgsqlCommand(
                "SELECT id, password_hash, role_id FROM users WHERE email = @p_email",
                conn
            );
            cmd.Parameters.AddWithValue("@p_email", dto.Email);

            using var reader = cmd.ExecuteReader();

            if (!reader.Read())
            {
                return (false, "E-posta veya şifre hatalı.", string.Empty);
            }

            int userId = reader.GetInt32(0);
            string dbPasswordHash = reader.GetString(1);
            int roleId = reader.GetInt32(2);

            bool isPasswordValid = BCrypt.Net.BCrypt.Verify(dto.Password, dbPasswordHash);

            if (!isPasswordValid)
            {
                return (false, "E-posta veya şifre hatalı.", string.Empty);
            }

            // JWT Token Üretimi
            string token = GenerateJwtToken(userId, roleId, dto.Email);

            return (true, "Giriş başarılı!", token);
        }

        private string GenerateJwtToken(int userId, int roleId, string email)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"]!;

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim(ClaimTypes.Email, email),
                new Claim(ClaimTypes.Role, roleId == 1 ? "Admin" : "Customer")
            };

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(double.Parse(jwtSettings["ExpirationInMinutes"] ?? "60")),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}