using System.Security.Claims;
using BankApi.Dtos;
using BankApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BankApi.Dtos.Account;

namespace BankApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // 🔒 Bu controller'daki tüm kapılar korumalıdır!
    public class AccountController : ControllerBase
    {
        private readonly AccountService _accountService;

        public AccountController(AccountService accountService)
        {
            _accountService = accountService;
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateAccount([FromBody] CreateAccountDto dto)
        {
            // 🎟️ Token içinden kullanıcının ID'sini çekiyoruz
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                           ?? User.FindFirst("sub")?.Value
                           ?? User.FindFirst("unique_name")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { isSuccess = false, message = "Geçersiz token kimliği!" });
            }

            var result = await _accountService.CreateAccountAsync(userId, dto);

            if (!result.isSuccess)
            {
                // 💡 ValueTuple nesnesi JSON'a boş çevrilmesin diye anonim nesne döndürüyoruz:
                return BadRequest(new
                {
                    isSuccess = result.isSuccess,
                    message = result.message
                });
            }

            return Ok(new
            {
                isSuccess = result.isSuccess,
                message = result.message,
                iban = result.iban,
                accountId = result.accountId
            });
        }
        [HttpGet("my-accounts")]
        public async Task<IActionResult> GetMyAccounts()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                           ?? User.FindFirst("sub")?.Value
                           ?? User.FindFirst("unique_name")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new
                {
                    isSuccess = false,
                    message = "Geçersiz token kimliği!"
                });
            }

            var accounts = await _accountService.GetMyAccountsAsync(userId);
            Console.WriteLine($"Kullanıcı {userId} için {accounts.Count} hesap bulundu.");
            return Ok(new
            {
                isSuccess = true,
                data = accounts
            });
        }
        [HttpPut("nickname")]
        public async Task<IActionResult> UpdateNickname(
            UpdateNicknameDto dto)
        {
            await _accountService.UpdateNicknameAsync(dto);

            return Ok(new
            {
                isSuccess = true,
                message = "Takma ad güncellendi."
            });
        }
        [HttpPut("deactivate")]
        public async Task<IActionResult> DeactivateAccount(
    DeactivateAccountDto dto)
        {
            var result =
                await _accountService.DeactivateAccountAsync(dto.AccountId);

            if (!result)
            {
                return BadRequest(new
                {
                    isSuccess = false,
                    message = "Hesap pasifleştirilemedi."
                });
            }

            return Ok(new
            {
                isSuccess = true,
                message = "Hesap pasifleştirildi."
            });
        }



    }


}