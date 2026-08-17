using BankApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
        [HttpPost("buy")]
public async Task<IActionResult> BuyStock(
    [FromBody] BuyStockRequest request)
{
    try
    {
        if (string.IsNullOrWhiteSpace(request.Symbol))
        {
            return BadRequest(new
            {
                isSuccess = false,
                message = "Hisse sembolü gereklidir."
            });
        }

        if (request.Quantity <= 0)
        {
            return BadRequest(new
            {
                isSuccess = false,
                message = "Hisse adedi sıfırdan büyük olmalıdır."
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

        var result =
            await _investmentService.BuyStockAsync(
                userId,
                request.Symbol,
                request.Quantity);

        if (result == null)
        {
            return BadRequest(new
            {
                isSuccess = false,
                message = "Hisse satın alma işlemi gerçekleştirilemedi."
            });
        }

        return Ok(new
        {
            isSuccess = true,
            data = result,
            message = result.Message
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
            message = "Hisse satın alma sırasında hata oluştu.",
            error = ex.Message
        });
    }
}
[HttpGet("portfolio")]
public async Task<IActionResult> GetPortfolio()
{
    try
    {
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

        var portfolio =
            await _investmentService.GetPortfolioAsync(userId);

        if (portfolio == null)
        {
            return NotFound(new
            {
                isSuccess = false,
                message = "Yatırım hesabı bulunamadı."
            });
        }

        return Ok(new
        {
            isSuccess = true,
            data = portfolio
        });
    }
    catch (Exception ex)
    {
        return StatusCode(500, new
        {
            isSuccess = false,
            message = "Portföy bilgileri alınamadı.",
            error = ex.Message
        });
    }
}
[HttpPost("sell")]
public async Task<IActionResult> SellStock(
    [FromBody] SellStockRequest request)
{
    try
    {
        if (string.IsNullOrWhiteSpace(request.Symbol))
        {
            return BadRequest(new
            {
                isSuccess = false,
                message = "Hisse sembolü gereklidir."
            });
        }

        if (request.Quantity <= 0)
        {
            return BadRequest(new
            {
                isSuccess = false,
                message = "Satılacak hisse adedi sıfırdan büyük olmalıdır."
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

        var result =
            await _investmentService.SellStockAsync(
                userId,
                request.Symbol,
                request.Quantity);

        if (result == null)
        {
            return BadRequest(new
            {
                isSuccess = false,
                message = "Hisse satış işlemi gerçekleştirilemedi."
            });
        }

        return Ok(new
        {
            isSuccess = true,
            data = result,
            message = result.Message
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
            message = "Hisse satışı sırasında hata oluştu.",
            error = ex.Message
        });
    }
}
[HttpGet("transactions")]
public async Task<IActionResult> GetInvestmentTransactions()
{
    try
    {
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

        var result =
            await _investmentService
                .GetInvestmentTransactionsAsync(userId);

        return Ok(new
        {
            isSuccess = true,
            data = result
        });
    }
    catch (Exception ex)
    {
        return StatusCode(500, new
        {
            isSuccess = false,
            message = "Yatırım işlem geçmişi alınamadı.",
            error = ex.Message
        });
    }
}
    }
}