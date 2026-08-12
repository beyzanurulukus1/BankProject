using System.Security.Claims;
using BankApi.Dtos;
using BankApi.Dtos.Account;
using BankApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;


namespace BankApi.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class TransactionController : ControllerBase
    {
        private readonly TransactionService _transactionService;
 
        public TransactionController(TransactionService transactionService)
        {
            _transactionService = transactionService;
        }

        [HttpPost("transfer")]
        public async Task<IActionResult> Transfer([FromBody] TransferDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                return Unauthorized(new { isSuccess = false, message = "Geçersiz oturum." });
            }

            int userId = int.Parse(userIdClaim.Value);
            var result = await _transactionService.TransferAsync(userId, dto);

            if (!result.isSuccess)
            {
                return BadRequest(new { isSuccess = false, message = result.message });
            }

            return Ok(new
            {
                isSuccess = true,
                message = result.message,
                referenceNo = result.referenceNo,
                transactionId = result.transactionId
            });
        }
        [HttpGet("history")]
        public async Task<IActionResult> GetHistory()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                return Unauthorized(new { isSuccess = false, message = "Geçersiz oturum." });
            }

            int userId = int.Parse(userIdClaim.Value);
            var history = await _transactionService.GetTransactionHistoryAsync(userId);

            return Ok(new
            {
                isSuccess = true,
                count = history.Count,
                data = history
            });
        }
        [HttpPost("deposit")]
        public async Task<IActionResult> Deposit([FromBody] DepositDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                return Unauthorized(new { isSuccess = false, message = "Geçersiz oturum." });
            }

            int userId = int.Parse(userIdClaim.Value);
            var result = await _transactionService.DepositAsync(userId, dto);

            if (!result.isSuccess)
            {
                return BadRequest(new { isSuccess = false, message = result.message });
            }

            return Ok(new
            {
                isSuccess = true,
                message = result.message,
                referenceNo = result.referenceNo,
                newBalance = result.newBalance
            });
        }
        [HttpPost("withdraw")]
        public async Task<IActionResult> Withdraw([FromBody] WithdrawDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                return Unauthorized(new { isSuccess = false, message = "Geçersiz oturum." });
            }

            int userId = int.Parse(userIdClaim.Value);
            var result = await _transactionService.WithdrawAsync(userId, dto);

            if (!result.isSuccess)
            {
                return BadRequest(new { isSuccess = false, message = result.message });
            }

            return Ok(new
            {
                isSuccess = true,
                message = result.message,
                referenceNo = result.referenceNo,
                newBalance = result.newBalance
            });
        }
        
    [HttpPost("exchange")]
public async Task<IActionResult> Exchange(
    [FromBody] ExchangeCurrencyDto dto)
{
    var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);

    if (userIdClaim == null)
    {
        return Unauthorized(new
        {
            isSuccess = false,
            message = "Geçersiz oturum."
        });
    }

    int userId = int.Parse(userIdClaim.Value);

    var result = await _transactionService.ExchangeCurrencyAsync(
        userId,
        dto.SourceAccountId,
        dto.TargetAccountId,
        dto.Amount,
        dto.Description
    );

    if (!result.isSuccess)
    {
        return BadRequest(new
        {
            isSuccess = false,
            message = result.message
        });
    }

    return Ok(new
    {
        isSuccess = true,
        message = result.message,
        referenceNo = result.referenceNo,
        transactionId = result.transactionId,
        sourceAmount = result.sourceAmount,
        targetAmount = result.targetAmount,
        exchangeRate = result.exchangeRate,
        exchangeRateType = result.exchangeRateType
    });
}
    }
}