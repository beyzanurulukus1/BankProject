using BankApi.DTOs;
using BankApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace BankApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")] // Adres: /api/auth
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;

       
        public AuthController(AuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")] 
        public IActionResult Register([FromBody] RegisterDto dto)
        {
            try

  
            {
                
                int newUserId = _authService.RegisterCustomer(dto);

                // Başarılı cevabı (HTTP 200 OK) döndürüyoruz
                return Ok(new { Message = "Müşteri kaydı başarıyla yapıldı!", UserId = newUserId });
            }
            catch (Exception ex)
            {
                // Bir hata olursa (örneğin aynı TCKN tekrar girildiyse) HTTP 400 döndürüyoruz
                return BadRequest(new { Message = "Kayıt işlemi başarısız.", Error = ex.Message });
            }
        }
        [HttpPost("login")] // Adres: POST /api/auth/login
public IActionResult Login([FromBody] LoginDto dto)
{
    var result = _authService.Login(dto);

    // Giriş başarısızsa HTTP 400 dönüyoruz
    if (!result.IsSuccess)
    {
        return BadRequest(new { Message = result.Message });
    }

    // 🟢 Giriş başarılıysa HTTP 200 OK ve JWT Token'ı dönüyoruz
    return Ok(new
    {
        Message = result.Message,
        Token = result.Token
    });
}
    }
}