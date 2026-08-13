using BankApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Security.Claims;
 using Npgsql;
using BankApi.Dtos;
namespace BankApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class InvestmentController : ControllerBase
    {
        private readonly InvestmentService _investmentService;

        public InvestmentController(InvestmentService investmentService)
        {
            _investmentService = investmentService;
        }

        [HttpGet("stock/{symbol}")]
        public async Task<IActionResult> GetStock(string symbol)
        {
            try
            {
                var stock = await _investmentService.GetStockAsync(symbol);

                if (stock == null)
                {
                    return NotFound(new
                    {
                        isSuccess = false,
                        message = "Hisse bulunamadı."
                    });
                }

                return Ok(new
                {
                    isSuccess = true,
                    data = stock
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    isSuccess = false,
                    message = "Hisse verisi alınamadı.",
                    error = ex.Message
                });
            }
        }

        [HttpGet("index/{symbol}")]
        public async Task<IActionResult> GetIndex(string symbol)
        {
            try
            {
                var index = await _investmentService.GetIndexAsync(symbol);

                if (index == null)
                {
                    return NotFound(new
                    {
                        isSuccess = false,
                        message = "Endeks bulunamadı."
                    });
                }

                return Ok(new
                {
                    isSuccess = true,
                    data = index
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    isSuccess = false,
                    message = "Endeks verisi alınamadı.",
                    error = ex.Message
                });
            }
        }
        [HttpGet("history/{symbol}")]
        public async Task<IActionResult> GetHistory(
    string symbol,
    [FromQuery] string period = "1mo",
    [FromQuery] string interval = "1d")
        {
            try
            {
                var history =
                    await _investmentService.GetHistoricalDataAsync(
                        symbol,
                        period,
                        interval);

                return Ok(new
                {
                    isSuccess = true,
                    data = history
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    isSuccess = false,
                    message = "Geçmiş fiyat verisi alınamadı.",
                    error = ex.Message
                });
            }
        }
        [HttpGet("account")]
        public async Task<IActionResult> GetInvestmentAccount()
        {
            try
            {
                var userIdClaim =
                    User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? User.FindFirst("sub")?.Value
                    ?? User.FindFirst("unique_name")?.Value;

                if (!int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new
                    {
                        isSuccess = false,
                        message = "Kullanıcı kimliği alınamadı."
                    });
                }

                var account =
                    await _investmentService
                        .GetOrCreateInvestmentAccountAsync(userId);

                return Ok(new
                {
                    isSuccess = true,
                    data = account
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    isSuccess = false,
                    message = "Yatırım hesabı alınamadı.",
                    error = ex.Message
                });
            }
        }
        [HttpPost("deposit")]
        public async Task<IActionResult> DepositToInvestment(
            [FromBody] InvestmentDepositRequest request)
        {
            try
            {
                if (request.Amount <= 0)
                {
                    return BadRequest(new
                    {
                        isSuccess = false,
                        message = "Aktarım tutarı sıfırdan büyük olmalıdır."
                    });
                }

                var userIdClaim =
                    User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? User.FindFirst("sub")?.Value;

                if (!int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new
                    {
                        isSuccess = false,
                        message = "Kullanıcı kimliği alınamadı."
                    });
                }

                var account =
                    await _investmentService.TransferToInvestmentAccountAsync(
                        userId,
                        request.SourceAccountId,
                        request.Amount);

                if (account == null)
                {
                    return BadRequest(new
                    {
                        isSuccess = false,
                        message = "Para aktarımı gerçekleştirilemedi."
                    });
                }

                return Ok(new
                {
                    isSuccess = true,
                    data = account,
                    message = "Para yatırım hesabına aktarıldı."
                });
            }
            catch (PostgresException ex)
            {
                return BadRequest(new
                {
                    isSuccess = false,
                    message = ex.MessageText
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    isSuccess = false,
                    message = "Para aktarımı sırasında hata oluştu.",
                    error = ex.Message
                });
            }
        }
    }
}