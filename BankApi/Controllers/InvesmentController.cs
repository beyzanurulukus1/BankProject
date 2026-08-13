using BankApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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
    }
}