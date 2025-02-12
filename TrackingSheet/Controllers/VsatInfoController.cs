using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using TrackingSheet.Models.VSATdata;
using TrackingSheet.Services.VsatBhaServices;

namespace TrackingSheet.Controllers
{
    public class VsatInfoController : Controller
    {
        private readonly RemoteDataService _remoteDataService;
        private readonly RemoteDataRunService _remoteDataRunService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<VsatInfoController> _logger;
        private readonly PassportFolderIndexerService _passportIndexer;
        private readonly PassportFolderSearchService _passportSearcher;

        public VsatInfoController(
            RemoteDataService remoteDataService,
            RemoteDataRunService remoteDataRunService,
            IConfiguration configuration,
            ILogger<VsatInfoController> logger,
            PassportFolderIndexerService passportIndexer,
            PassportFolderSearchService passportSearcher)
        {
            _remoteDataService = remoteDataService;
            _remoteDataRunService = remoteDataRunService;
            _configuration = configuration;
            _logger = logger;
            _passportIndexer = passportIndexer;
            _passportSearcher = passportSearcher;
        }

        [HttpPost]
        public IActionResult SetIpAddress(int ipPart)
        {
            string connectionStringTemplate = _configuration.GetConnectionString("RemoteDatabase");
            string connectionString = connectionStringTemplate.Replace("${IPAddress}", ipPart.ToString());

            // Сохранение строки подключения в сессии
            HttpContext.Session.SetString("RemoteDbConnectionString", connectionString);
            TempData["ipPart"] = ipPart;

            return RedirectToAction(nameof(GetLatestVsatInfo));
        }

        [HttpGet]
        public IActionResult GetLatestVsatInfo()
        {
            ViewData["CurrentPage"] = "vsat_bha";
            return View();
        }


        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> GetAllRunsVsatInfo([FromBody] VsatInfoRunRequest request)
        {
            try
            {
                // Формирование строки подключения
                string connectionStringTemplate = _configuration.GetConnectionString("RemoteDatabase");
                string connectionString = connectionStringTemplate.Replace("${IPAddress}", request.ipPart.ToString());

                // Установка строки подключения в сервисе
                _remoteDataRunService.SetConnectionString(connectionString);

                // Получение данных по всем рейсам
                List<VsatInfoRun> vsatRuns = await _remoteDataRunService.GetAllRunsVsatInfoAsync();

                if (vsatRuns == null || vsatRuns.Count == 0)
                {
                    return NotFound("VSAT или база данных не найдена.");
                }

                // Логируем данные перед возвратом
                _logger.LogInformation("VSAT Runs Data: {@VsatRuns}", vsatRuns);

                // Возвращаем данные в формате JSON
                return Json(vsatRuns);
            }
            catch (Exception ex)
            {
                // Логирование ошибки
                _logger.LogError(ex, "Exception occurred while getting all VSAT runs info.");

                // Возвращаем ошибку с сообщением
                return StatusCode(500, "Произошла непридвиденная ошибка. Повторите позже.");
            }
        }


        // Индексация папок
        [HttpGet]
        public async Task<IActionResult> IndexFolder()
        {
            try
            {
                await _passportIndexer.IndexFolderAsync();
                return Ok("Индексация завершена");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception occurred while indexing folders.");
                return StatusCode(500, "Ошибка при индексации папок.");
            }
        }



        [HttpGet]
        public async Task<IActionResult> SearchAndOpenFolders(string folderName)
        {
            if (string.IsNullOrEmpty(folderName))
            {
                return BadRequest("Folder name cannot be empty.");
            }

            try
            {
                // Поиск папок
                var folders = await _passportSearcher.SearchPassportFoldersAsync(folderName);

                if (folders.Count == 0)
                {
                    return NotFound("No folders found.");
                }

                // Формируем HTML-контент
                var htmlContent = $@"
<!DOCTYPE html>
<html lang='en'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Folders</title>
</head>
<body>
    <h1>Список папок</h1>
    <p>    Cкопируйте путь и вставьте его в проводник или адресную строку браузера:</p>
    <ul>";

                foreach (var folder in folders)
                {
                    // Формируем путь для отображения
                    var formattedPath = folder.Replace("\"", "");
                    htmlContent += $"<li><a href='file:///{formattedPath}'>{formattedPath}</a></li>";
                }

                htmlContent += @"
    </ul>
</body>
</html>";

                return Content(htmlContent, "text/html");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while searching folders.");
                return StatusCode(500, "Error occurred while searching folders.");
            }
        }

    }
}
