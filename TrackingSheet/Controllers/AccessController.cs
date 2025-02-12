using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Options;
using System.Linq;
using System.IO;
using TrackingSheet.Models.VMLogin;

namespace TrackingSheet.Controllers
{
    public class AccessController : Controller
    {
        private readonly IWebHostEnvironment _environment;
        private readonly List<VMLoginUser> _users;

        public AccessController(IWebHostEnvironment environment, IOptions<List<VMLoginUser>> usersOptions)
        {
            _environment = environment;
            _users = usersOptions.Value;
        }

        public IActionResult Login()
        {
            // Проверка, аутентифицирован ли пользователь
            if (User.Identity.IsAuthenticated)
                return RedirectToAction("Index", "Home");

            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Login(VMLogin modelLogin)
        {
            if (ModelState.IsValid)
            {
                var user = _users.FirstOrDefault(u =>
                    string.Equals(u.Username, modelLogin.Login431, StringComparison.OrdinalIgnoreCase) &&
                    u.Password == modelLogin.PassWord);

                if (user != null)
                {
                    var claims = new List<Claim>
                    {
                        new Claim(ClaimTypes.Name, user.Username),
                        new Claim(ClaimTypes.NameIdentifier, user.Username)
                    };

                    var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
                    var authProperties = new AuthenticationProperties
                    {
                        AllowRefresh = true,
                        IsPersistent = modelLogin.KeepLogged
                    };

                    await HttpContext.SignInAsync(
                        CookieAuthenticationDefaults.AuthenticationScheme,
                        new ClaimsPrincipal(claimsIdentity),
                        authProperties);

                    return RedirectToAction("Index", "Home");
                }

                ViewData["ValidateMessage"] = "Пользователь не найден или неверный пароль.";
            }

            return View(modelLogin);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> LogOut()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return RedirectToAction("Login", "Access");
        }

        [HttpPost]
        [Authorize]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> UploadAvatar(IFormFile avatar)
        {
            if (avatar != null && avatar.Length > 0)
            {
                // Проверка типа файла (разрешить только изображения)
                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
                var extension = Path.GetExtension(avatar.FileName).ToLower();

                if (!allowedExtensions.Contains(extension))
                {
                    TempData["ValidateMessage"] = "Недопустимый тип файла. Разрешены только изображения.";
                    return RedirectToAction("Index", "Home");
                }

                // Проверка размера файла (например, максимум 2MB)
                if (avatar.Length > 2 * 1024 * 1024)
                {
                    TempData["ValidateMessage"] = "Размер файла слишком велик. Максимум 2MB.";
                    return RedirectToAction("Index", "Home");
                }

                // Получение имени пользователя
                var loggedUser = User.Identity.Name;

                // Путь для сохранения файла
                var avatarsPath = Path.Combine(_environment.WebRootPath, "avatars");
                if (!Directory.Exists(avatarsPath))
                {
                    Directory.CreateDirectory(avatarsPath);
                }

                var filePath = Path.Combine(avatarsPath, $"{loggedUser}{extension}");

                // Сохранение файла, перезаписывая существующий
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await avatar.CopyToAsync(stream);
                }

                // Удаление старых файлов с другими расширениями
                var existingFiles = Directory.GetFiles(avatarsPath, $"{loggedUser}.*")
                                             .Where(f => f != filePath);

                foreach (var existingFile in existingFiles)
                {
                    System.IO.File.Delete(existingFile);
                }

                TempData["ValidateMessage"] = "Фото профиля успешно обновлено.";
            }
            else
            {
                TempData["ValidateMessage"] = "Файл не выбран.";
            }

            return RedirectToAction("Index", "Home");
        }
    }
}
