using System.Security.Claims;
using BankApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BankApi.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ProfileController : ControllerBase
    {
        private readonly ProfileService _profileService;

        public ProfileController(ProfileService profileService)
        {
            _profileService = profileService;
        }

        [HttpGet]
        public async Task<IActionResult> GetProfile()
        {
            var userIdClaim =
                User.FindFirst(ClaimTypes.NameIdentifier);

            if (userIdClaim == null)
            {
                return Unauthorized(new
                {
                    isSuccess = false,
                    message = "Geçersiz oturum."
                });
            }

            int userId = int.Parse(userIdClaim.Value);

            var profile =
                await _profileService.GetProfileAsync(userId);

            if (profile == null)
            {
                return NotFound(new
                {
                    isSuccess = false,
                    message = "Profil bulunamadı."
                });
            }

            return Ok(new
            {
                isSuccess = true,
                data = profile
            });
        }
    }
}