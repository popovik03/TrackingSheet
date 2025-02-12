using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrackingSheet.Models.VSATdata;
using TrackingSheet.Data;
using TrackingSheet.Models.Domain;
using TrackingSheet.Models.Options;
using Newtonsoft.Json;
using TrackingSheet.Models.DTO;
using TrackingSheet.Services.VsatBhaServices;
using TrackingSheet.Models.ViewModels;
using Microsoft.Extensions.Options;
using System.Globalization;
using Microsoft.AspNetCore.SignalR;
using TrackingSheet.Hubs;
using TrackingSheet.Models.Notifications;

namespace TrackingSheet.Controllers
{
    public class IncidentsController : Controller
    {
        private readonly MVCDbContext mvcDbContext;
        private readonly RemoteDataService _remoteDataService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<IncidentsController> _logger;
        private readonly UtcSettings _utcSettings;
        private readonly IHubContext<NotificationHub> _notificationHubContext;

        public IncidentsController(MVCDbContext mvcDbContext, RemoteDataService remoteDataService, IConfiguration configuration, ILogger<IncidentsController> logger, IOptions<UtcSettings> utcSettingsOptions, IHubContext<NotificationHub> notificationHubContext)
        {
            this.mvcDbContext = mvcDbContext;
            _remoteDataService = remoteDataService;
            _configuration = configuration;
            _logger = logger;
            _utcSettings = utcSettingsOptions.Value;
            _notificationHubContext = notificationHubContext;
        }

        [Authorize]
        [HttpGet]
        public async Task<IActionResult> Index()
        {
            var incidents = await mvcDbContext.IncidentList.OrderByDescending(p => p.Date).ToListAsync();
            ViewData["CurrentPage"] = "journal";
            return View(incidents);
        }


        [Authorize]
        [HttpGet]
        public async Task<IActionResult> View(Guid id)
        {
            var incident = await mvcDbContext.IncidentList
                .Include(i => i.Updates)
                .FirstOrDefaultAsync(x => x.ID == id);

            if (incident != null)
            {
                var ViewModel = new UpdateIncidentViewModel()
                {
                    ID = incident.ID,
                    Date = incident.Date,
                    Shift = incident.Shift,
                    Reporter = incident.Reporter,
                    VSAT = incident.VSAT,
                    Well = incident.Well,
                    Run = incident.Run,
                    SavedNPT = incident.SavedNPT,
                    ProblemType = incident.ProblemType,
                    HighLight = incident.HighLight,
                    Status = incident.Status,
                    Solution = incident.Solution,
                    File = incident.File,
                    DateEnd = incident.DateEnd,
                    Updates = incident.Updates?.ToList()
                };
                ViewData["CurrentPage"] = "journal";

                // Получаем URL предыдущей страницы
                string returnUrl = Request.Headers["Referer"].ToString();
                ViewData["ReturnUrl"] = returnUrl;

                return View("View", ViewModel);
            }

            return RedirectToAction("Index");
        }


        // Передача данных из базы в DataTable в формате json
        [Authorize]
        [HttpGet("api/incidents/all")]
        public async Task<IActionResult> GetAllIncidents()
        {
            var data = await mvcDbContext.IncidentList.ToListAsync();
            var totalRecords = data.Count;

            return Json(new
            {
                draw = 1,
                recordsTotal = totalRecords,
                recordsFiltered = totalRecords,
                data = data
            });
        }

        [Authorize]
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> UpdateIncidents([FromBody] List<UpdateIncidentsDTO> updatedIncidents)
        {
            if (updatedIncidents == null || !updatedIncidents.Any())
            {
                _logger.LogWarning("UpdateIncidents: Нет данных для обновления.");
                return BadRequest(new { message = "Нет данных для обновления." });
            }

            try
            {
                foreach (var updatedIncident in updatedIncidents)
                {
                    if (updatedIncident.ID == Guid.Empty)
                    {
                        _logger.LogWarning("UpdateIncidents: Пропуск записи с пустым ID.");
                        continue; // Пропускаем некорректные записи
                    }

                    var incident = await mvcDbContext.IncidentList
                        .FirstOrDefaultAsync(i => i.ID == updatedIncident.ID);

                    if (incident == null)
                    {
                        _logger.LogWarning($"UpdateIncidents: Инцидент с ID {updatedIncident.ID} не найден.");
                        continue; // Пропускаем отсутствующие записи
                    }

                    // Обновляем только изменённые поля
                    incident.Date = updatedIncident.Date;
                    incident.Shift = updatedIncident.Shift;
                    incident.Reporter = updatedIncident.Reporter;
                    incident.VSAT = updatedIncident.VSAT;
                    incident.Well = updatedIncident.Well;
                    incident.Run = updatedIncident.Run;
                    incident.SavedNPT = updatedIncident.SavedNPT;
                    incident.ProblemType = updatedIncident.ProblemType;
                    incident.HighLight = updatedIncident.HighLight;
                    incident.Status = updatedIncident.Status;
                    incident.Solution = updatedIncident.Solution;
                    incident.File = updatedIncident.File;
                    incident.DateEnd = updatedIncident.DateEnd;
                }

                await mvcDbContext.SaveChangesAsync();
                _logger.LogInformation("UpdateIncidents: Данные успешно обновлены.");
                return Ok(new { message = "Данные успешно обновлены." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "UpdateIncidents: Ошибка при массовом обновлении инцидентов.");
                return StatusCode(500, new { message = "Произошла ошибка при сохранении данных." });
            }
        }

        [Authorize]
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> EditUpdate([FromBody] EditUpdateModel model)
        {
            if (ModelState.IsValid)
            {
                var update = await mvcDbContext.IncidentUpdates.FindAsync(model.UpdateID);
                if (update != null)
                {
                    update.UpdateSolution = model.UpdateSolution;
                    await mvcDbContext.SaveChangesAsync();
                    return Json(new { success = true });
                }
                else
                {
                    return Json(new { success = false, message = "Обновление не найдено" });
                }
            }
            else
            {
                return Json(new { success = false, message = "Некорректные данные" });
            }
        }

        [Authorize]
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteUpdate([FromBody] DeleteUpdateModel model)
        {
            if (ModelState.IsValid)
            {
                var update = await mvcDbContext.IncidentUpdates.FindAsync(model.UpdateID);
                if (update != null)
                {
                    mvcDbContext.IncidentUpdates.Remove(update);
                    await mvcDbContext.SaveChangesAsync();
                    return Json(new { success = true });
                }
                else
                {
                    return Json(new { success = false, message = "Обновление не найдено" });
                }
            }
            else
            {
                return Json(new { success = false, message = "Некорректные данные" });
            }
        }

        public class EditUpdateModel
        {
            public Guid UpdateID { get; set; }
            public string UpdateSolution { get; set; }
        }

        public class DeleteUpdateModel
        {
            public Guid UpdateID { get; set; }
        }



        // Методы для добавления, редактирования и удаления инцидентов

        [Authorize]
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Add(AddIncidentViewModel addIncidentRequest)
        {
            if (addIncidentRequest == null)
            {
                _logger.LogWarning("Add: AddIncidentViewModel is null.");
                return BadRequest(new { message = "Некорректные данные." });
            }

            var incident = new Incidents()
            {
                ID = addIncidentRequest.ID, 
                Date = addIncidentRequest.Date,
                Shift = addIncidentRequest.Shift,
                Reporter = addIncidentRequest.Reporter,
                VSAT = addIncidentRequest.VSAT,
                Well = addIncidentRequest.Well,
                Run = addIncidentRequest.Run,
                SavedNPT = addIncidentRequest.SavedNPT,
                ProblemType = addIncidentRequest.ProblemType,
                HighLight = addIncidentRequest.HighLight,
                Status = addIncidentRequest.Status,
                Solution = addIncidentRequest.Solution,
                File = 0, // Изначально устанавливаем File в 0
                DateEnd = null, // Устанавливаем DateEnd в NULL
                Update = null // Устанавливаем Update в NULL
            };

            // Сохранение инцидента в базу данных
            await mvcDbContext.IncidentList.AddAsync(incident);
            await mvcDbContext.SaveChangesAsync();

            // Обработка загруженных файлов, если есть
            if (addIncidentRequest.UploadedFiles != null && addIncidentRequest.UploadedFiles.Count > 0)
            {
                var incidentFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", incident.ID.ToString());
                if (!Directory.Exists(incidentFolder))
                {
                    Directory.CreateDirectory(incidentFolder);
                }

                foreach (var file in addIncidentRequest.UploadedFiles)
                {
                    if (file != null && file.Length > 0)
                    {
                        var fileName = Path.GetFileName(file.FileName);
                        var filePath = Path.Combine(incidentFolder, fileName);

                        // Обеспечение уникальности имени файла
                        if (System.IO.File.Exists(filePath))
                        {
                            fileName = $"{Path.GetFileNameWithoutExtension(fileName)}_{Guid.NewGuid()}{Path.GetExtension(fileName)}";
                            filePath = Path.Combine(incidentFolder, fileName);
                        }

                        // Сохранение файла
                        using (var stream = new FileStream(filePath, FileMode.Create))
                        {
                            await file.CopyToAsync(stream);
                        }
                    }
                }

                // Обновление инцидента, чтобы указать на наличие файлов
                incident.File = 1;
                await mvcDbContext.SaveChangesAsync();
            }

            // Подготовка данных для уведомления
            var incidentNotification = new IncidentNotification
            {
                IncidentId = incident.ID,
                Reporter = incident.Reporter,
                ProblemType = incident.ProblemType,
                HighLight = incident.HighLight,
                Well = incident.Well,
                Solution = incident.Solution,
                VSAT = incident.VSAT 
            };

            // Логирование отправляемого уведомления для отладки
            _logger.LogInformation($"Отправка уведомления: {JsonConvert.SerializeObject(incidentNotification)}");

            // Отправка уведомления через SignalR
            await _notificationHubContext.Clients.All.SendAsync("ReceiveNewIncident", incidentNotification);

            _logger.LogInformation($"Incident {incident.ID} successfully added. Redirecting to View.");

            // Возврат JSON с URL для перенаправления
            return Json(new { redirectUrl = Url.Action("View", "Incidents", new { id = incident.ID }) });
        }


        [Authorize]
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(UpdateIncidentViewModel model, IEnumerable<IFormFile> UploadedFiles)
        {
            if (model == null)
            {
                _logger.LogWarning("Edit: Model is null.");
                return Json(new { success = false, message = "Некорректные данные." });
            }

            var incident = await mvcDbContext.IncidentList.FindAsync(model.ID);
            if (incident == null)
            {
                _logger.LogWarning($"Edit: Incident with ID {model.ID} not found.");
                return Json(new { success = false, message = "Инцидент не найден." });
            }

            try
            {
                // Обновление свойств инцидента
                incident.Date = model.Date;
                incident.DateEnd = model.DateEnd;
                incident.Shift = model.Shift;
                incident.Reporter = model.Reporter;
                incident.VSAT = model.VSAT;
                incident.Well = model.Well;
                incident.Run = model.Run;
                incident.SavedNPT = model.SavedNPT;
                incident.ProblemType = model.ProblemType;
                incident.HighLight = model.HighLight;
                incident.Status = model.Status;
                incident.Solution = model.Solution;

                // Устанавливаем значение File из модели
                incident.File = model.File;

                // Обработка загруженных файлов, если есть
                if (UploadedFiles != null && UploadedFiles.Any())
                {
                    var incidentFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", incident.ID.ToString());
                    if (!Directory.Exists(incidentFolder))
                    {
                        Directory.CreateDirectory(incidentFolder);
                    }

                    foreach (var file in UploadedFiles)
                    {
                        if (file != null && file.Length > 0)
                        {
                            var fileName = Path.GetFileName(file.FileName);
                            var filePath = Path.Combine(incidentFolder, fileName);

                            // Ensure unique file names
                            if (System.IO.File.Exists(filePath))
                            {
                                fileName = $"{Path.GetFileNameWithoutExtension(fileName)}_{Guid.NewGuid()}{Path.GetExtension(fileName)}";
                                filePath = Path.Combine(incidentFolder, fileName);
                            }

                            // Save the file
                            using (var stream = new FileStream(filePath, FileMode.Create))
                            {
                                await file.CopyToAsync(stream);
                            }

                            _logger.LogInformation($"Edit: File '{fileName}' saved for incident '{incident.ID}'.");
                        }
                    }

                    // Так как мы загрузили новые файлы, устанавливаем File в 1
                    incident.File = 1;
                }

                await mvcDbContext.SaveChangesAsync();
                _logger.LogInformation($"Edit: Incident {model.ID} successfully updated.");
                TempData["SuccessMessage"] = "Инцидент успешно обновлен.";

                // Получаем ReturnUrl из данных формы
                string returnUrl = Request.Form["ReturnUrl"];
                if (string.IsNullOrEmpty(returnUrl))
                {
                    // Если ReturnUrl не задан, используем URL по умолчанию
                    returnUrl = Url.Action("Index", "Home");
                }

                // Возвращаем успешный JSON-ответ с URL для перенаправления
                return Json(new { success = true, redirectUrl = returnUrl });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Edit: Error updating incident {model.ID}.");
                return Json(new { success = false, message = "Произошла ошибка при обновлении инцидента." });
            }
        }


        [Authorize]
        [HttpGet]
        public async Task<IActionResult> Delete(Guid id)
        {
            if (id == Guid.Empty)
            {
                _logger.LogWarning("Attempted to delete a record with an empty ID.");
                TempData["AlertMessage"] = "Invalid identifier.";
                return RedirectToAction("Index");
            }

            var incident = await mvcDbContext.IncidentList.FindAsync(id);

            if (incident != null)
            {
                mvcDbContext.IncidentList.Remove(incident);
                await mvcDbContext.SaveChangesAsync();
                TempData["AlertMessage"] = "Incident deleted.";
                _logger.LogInformation("Incident successfully deleted.");
            }
            else
            {
                _logger.LogWarning($"Incident with ID {id} not found for deletion.");
                TempData["AlertMessage"] = "Incident not found.";
            }

            return RedirectToAction("Index");
        }

        // Метод для получения информации из базы данных
        [HttpPost]
        public async Task<IActionResult> SetIpAddressAndGetLatestVsatInfo(int ipPart)
        {
            string connectionStringTemplate = _configuration.GetConnectionString("RemoteDatabase");
            string connectionString = connectionStringTemplate.Replace("${IPAddress}", ipPart.ToString());

            HttpContext.Session.SetString("RemoteDbConnectionString", connectionString);
            TempData["ipPart"] = ipPart;

            try
            {
                string connectionStringNew = HttpContext.Session.GetString("RemoteDbConnectionString");
                _remoteDataService.SetConnectionString(connectionStringNew);

                VsatInfo vsatInfo = await _remoteDataService.GetLatestVsatInfoAsync();

                if (vsatInfo == null)
                {
                    return NotFound();
                }

                var model = new AddIncidentViewModel
                {
                    VSAT = ipPart,
                    Well = vsatInfo.WELL_NAME,
                    Run = vsatInfo.MWRU_NUMBER,
                    Date = DateTime.Now,
                    Shift = DateTime.Now.Hour >= 20 || DateTime.Now.Hour < 8 ? "Night" : "Day",
                    Reporter = TempData.Peek("Login") as string ?? string.Empty,
                    IpPart = ipPart,
                };

                ViewBag.CurrentPage = "new_incident";
                ViewBag.VsatInfo = vsatInfo;

                return View("Add", model); 
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception occurred while getting latest VSAT info.");
                string status_message = $"Error retrieving data from {HttpContext.Session.GetString("RemoteDbConnectionString")}";
                return View("Add");
            }
        }

        [Authorize]
        [HttpGet]
        public async Task<IActionResult> GetVsatData(int ipPart)
        {
            try
            {
                string connectionStringTemplate = _configuration.GetConnectionString("RemoteDatabase");
                string connectionString = connectionStringTemplate.Replace("${IPAddress}", ipPart.ToString());

                _remoteDataService.SetConnectionString(connectionString);

                VsatInfo vsatInfo = await _remoteDataService.GetLatestVsatInfoAsync();

                if (vsatInfo == null)
                {
                    return NotFound();
                }

                // Создание строки BHA
                var positions = vsatInfo.MWRC_POSITION;
                var sns = vsatInfo.MWCO_SN;
                var components = vsatInfo.NEW_REAL_NAME;

                string bha = string.Join("", positions.OrderBy(kv => kv.Value).Select(position =>
                {
                    var key = position.Key;
                    var pos = position.Value;
                    var component = components.ContainsKey(key) ? components[key] : "N/A";
                    var sn = sns.ContainsKey(key) ? sns[key] : "N/A";
                    return $"{pos}:{component} {sn}; ";
                }));

                // Подготовка данных для отправки
                var data = new
                {
                    VSAT = ipPart,
                    Well = vsatInfo.WELL_NAME,
                    Run = vsatInfo.MWRU_NUMBER,
                    Shift = DateTime.Now.Hour >= 20 || DateTime.Now.Hour < 8 ? "Night" : "Day",
                    BHA = bha,
                    Pad = vsatInfo.FCTY_NAME,
                    Field = vsatInfo.OOIN_NAME
                };

                return Json(data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception occurred while getting latest VSAT info.");
                return StatusCode(500, new { message = $"Error retrieving data from IP {ipPart}" });
            }
        }


        [Authorize]
        [HttpGet]
        public IActionResult Add()
        {
            ViewData["CurrentPage"] = "new_incident";

            var newIncidentId = Guid.NewGuid();

            var vsatInfoJson = TempData["VsatInfo"] as string;
            VsatInfo vsatInfo = string.IsNullOrEmpty(vsatInfoJson) ? null : JsonConvert.DeserializeObject<VsatInfo>(vsatInfoJson);

            var model = new AddIncidentViewModel
            {
                ID = newIncidentId,
                Well = vsatInfo?.WELL_NAME ?? "Test",
                Run = vsatInfo?.MWRU_NUMBER ?? 100,
                Date = DateTime.Now,
                Shift = DateTime.Now.Hour >= 20 || DateTime.Now.Hour < 8 ? "Night" : "Day",
                Reporter = TempData.Peek("Login") as string ?? string.Empty,
                
            };

            ViewBag.VsatInfo = vsatInfo;

            return View(model);
        }


        // Метод удаления временных файлов
        [IgnoreAntiforgeryToken]
        [HttpPost]
        public IActionResult DeleteTempFile(string fileName, Guid incidentId)
        {
            try
            {
                var incidentFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", incidentId.ToString());
                var filePath = Path.Combine(incidentFolder, fileName);

                if (System.IO.File.Exists(filePath))
                {
                    System.IO.File.Delete(filePath);
                    return Json(new { success = true });
                }
                else
                {
                    return Json(new { success = false, message = "File not found." });
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [Authorize]
        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult DeleteFile([FromBody] DeleteFileRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.FileName) || request.IncidentId == Guid.Empty)
            {
                _logger.LogWarning("DeleteFile: Invalid parameters.");
                return Json(new { success = false, message = "Invalid parameters." });
            }

            try
            {
                var incidentFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", request.IncidentId.ToString());
                var filePath = Path.Combine(incidentFolder, request.FileName);

                if (System.IO.File.Exists(filePath))
                {
                    System.IO.File.Delete(filePath);
                    _logger.LogInformation($"DeleteFile: File '{request.FileName}' deleted from incident '{request.IncidentId}'.");

                    // Проверяем, остались ли еще файлы
                    bool filesExist = Directory.Exists(incidentFolder) && Directory.GetFiles(incidentFolder).Length > 0;

                    // Обновляем значение incident.File в базе данных
                    var incident = mvcDbContext.IncidentList.Find(request.IncidentId);
                    if (incident != null)
                    {
                        incident.File = filesExist ? 1 : 0;
                        mvcDbContext.SaveChanges();
                    }

                    return Json(new { success = true });
                }
                else
                {
                    _logger.LogWarning($"DeleteFile: File '{request.FileName}' not found in incident '{request.IncidentId}'.");
                    return Json(new { success = false, message = "File not found." });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"DeleteFile: Error deleting file '{request.FileName}' from incident '{request.IncidentId}'.");
                return Json(new { success = false, message = ex.Message });
            }
        }



        [Authorize]
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ImportExcel([FromBody] List<ImportIncidentDTO> incidents)
        {
            if (incidents == null || incidents.Count == 0)
            {
                return Json(new { success = false, message = "Нет данных для импорта." });
            }

            try
            {
                List<Incidents> incidentsToAdd = new List<Incidents>();
                List<string> errorMessages = new List<string>();

                foreach (var incidentDto in incidents)
                {
                    // Валидация обязательных полей
                    if (string.IsNullOrWhiteSpace(incidentDto.Date) ||
                        string.IsNullOrWhiteSpace(incidentDto.Shift) ||
                        string.IsNullOrWhiteSpace(incidentDto.Reporter) ||
                        string.IsNullOrWhiteSpace(incidentDto.VSAT) ||
                        string.IsNullOrWhiteSpace(incidentDto.Well) ||
                        string.IsNullOrWhiteSpace(incidentDto.Run) ||
                        string.IsNullOrWhiteSpace(incidentDto.SavedNPT) ||
                        string.IsNullOrWhiteSpace(incidentDto.ProblemType) ||
                        string.IsNullOrWhiteSpace(incidentDto.Status))
                    {
                        errorMessages.Add($"Некорректные данные для инцидента: {JsonConvert.SerializeObject(incidentDto)}");
                        continue; // Пропускаем некорректные записи
                    }

                    // Парсинг даты без учёта часового пояса
                    DateTime date;
                    if (!TryParseDateIgnoringTimeZone(incidentDto.Date, out date))
                    {
                        errorMessages.Add($"Некорректный формат даты: {incidentDto.Date}");
                        continue;
                    }

                    // Ручное вычитание или добавление смещения из конфигурации
                    date = date.AddHours(-_utcSettings.GMToffset);

                    // Создание объекта инцидента с преобразованной датой
                    var incident = new Incidents
                    {
                        ID = Guid.NewGuid(),
                        Date = date, // Преобразованная дата после вычитания/добавления часов
                        Shift = incidentDto.Shift,
                        Reporter = incidentDto.Reporter,
                        VSAT = ParseIntSafe(incidentDto.VSAT),
                        Well = incidentDto.Well,
                        Run = ParseIntSafe(incidentDto.Run),
                        SavedNPT = ParseLongSafe(incidentDto.SavedNPT),
                        ProblemType = incidentDto.ProblemType,
                        HighLight = incidentDto.HighLight,
                        Status = incidentDto.Status,
                        Solution = incidentDto.Solution,
                        DateEnd = null, // Устанавливаем DateEnd в NULL
                        File = 0, // Устанавливаем File в 0
                        Update = null // Устанавливаем Update в NULL
                    };

                    // Логирование даты перед сохранением
                    _logger.LogInformation($"Saving incident with Date: {incident.Date.ToString("yyyy-MM-dd HH:mm:ss")} (Kind: {incident.Date.Kind})");

                    incidentsToAdd.Add(incident);
                }

                if (incidentsToAdd.Count > 0)
                {
                    await mvcDbContext.IncidentList.AddRangeAsync(incidentsToAdd);
                    await mvcDbContext.SaveChangesAsync();
                }

                if (errorMessages.Count > 0)
                {
                    // Возвращаем успешный импорт, но с сообщениями об ошибках
                    return Json(new { success = true, importedCount = incidentsToAdd.Count, errors = errorMessages });
                }

                return Json(new { success = true, importedCount = incidentsToAdd.Count });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при импорте инцидентов из Excel.");
                return Json(new { success = false, message = "Произошла ошибка при импорте данных." });
            }
        }


        // Вспомогательный метод для парсинга даты без учёта часового пояса
        private bool TryParseDateIgnoringTimeZone(string dateString, out DateTime date)
        {
            date = DateTime.MinValue;

            try
            {
                // Удаляем часть строки, содержащую информацию о часовом поясе
                var index = dateString.IndexOf(" GMT");
                if (index > -1)
                {
                    dateString = dateString.Substring(0, index);
                }

                // Парсим оставшуюся строку
                if (DateTime.TryParse(dateString, out date))
                {
                    // Устанавливаем Kind как Unspecified, чтобы избежать преобразований
                    date = DateTime.SpecifyKind(date, DateTimeKind.Unspecified);
                    return true;
                }

                return false;
            }
            catch
            {
                return false;
            }
        }


        // Вспомогательные методы для безопасного парсинга
        private int ParseIntSafe(string value)
        {
            if (int.TryParse(value, out int result))
                return result;
            return 0;
        }

        private long ParseLongSafe(string value)
        {
            if (long.TryParse(value, out long result))
                return result;
            return 0;
        }

        [Authorize]
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteIncident([FromBody] DeleteIncidentModel model)
        {
            if (model == null || model.Id == Guid.Empty)
            {
                _logger.LogWarning("DeleteIncident: Пустой или отсутствующий ID предоставлен.");
                return BadRequest(new { message = "Неверный идентификатор." });
            }

            var incident = await mvcDbContext.IncidentList.FindAsync(model.Id);
            if (incident == null)
            {
                _logger.LogWarning($"DeleteIncident: Инцидент с ID {model.Id} не найден.");
                return NotFound(new { message = "Инцидент не найден." });
            }

            try
            {
                mvcDbContext.IncidentList.Remove(incident);
                await mvcDbContext.SaveChangesAsync();
                _logger.LogInformation($"DeleteIncident: Инцидент {model.Id} успешно удалён.");
                return Ok(new { message = "Инцидент успешно удалён." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"DeleteIncident: Ошибка при удалении инцидента {model.Id}.");
                return StatusCode(500, new { message = "Ошибка при удалении инцидента." });
            }
        }

        


        public class DeleteIncidentModel
        {
            public Guid Id { get; set; }
        }

        public class DeleteFileRequest
        {
            public string FileName { get; set; }
            public Guid IncidentId { get; set; }
        }


    }
}

