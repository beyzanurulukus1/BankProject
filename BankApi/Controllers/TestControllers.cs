using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BankApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TestController : ControllerBase
    {
        [Authorize]
        [HttpGet("protected")]
        public IActionResult GetProtectedData()
        {
            var userEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;

            return Ok(new
            {
                Message = "Tebrikler! Geçerli bir JWT Token ile korumalı alana girdiniz. VIP bilekliğiniz çalışıyor! 🎟️",
                UserEmail = userEmail
            });
        }
    }
}