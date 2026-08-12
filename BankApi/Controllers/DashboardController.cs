using System.Security.Claims;
using BankApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BankApi.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly DashboardService _dashboardService;

        public DashboardController(DashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        [HttpGet]
        public async Task<IActionResult> GetDashboard()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                return Unauthorized(new { isSuccess = false, message = "Geçersiz oturum." });
            }

            int userId = int.Parse(userIdClaim.Value);
            var data = await _dashboardService.GetDashboardDataAsync(userId);

            return Ok(new 
            { 
                isSuccess = true, 
                data = data 
            });
        }
    }
}