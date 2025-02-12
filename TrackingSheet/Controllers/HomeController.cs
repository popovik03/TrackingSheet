using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using TrackingSheet.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using TrackingSheet.Data;
using Microsoft.EntityFrameworkCore;
using TrackingSheet.Models.Domain;
using System.Collections.Generic;
using System.Linq;
using TrackingSheet.Models.ViewModels;
using TrackingSheet.Models.DTO;
using TrackingSheet.Models.VSATdata;
using TrackingSheet.Services.VsatBhaServices;
using Microsoft.AspNetCore.SignalR;
using TrackingSheet.Hubs;
using Newtonsoft.Json;
using TrackingSheet.Models.Notifications;
using TrackingSheet.Services;



namespace TrackingSheet.Controllers
{
    [Authorize]
    public class HomeController : Controller
    {

        private readonly ILogger<HomeController> _logger;
        private readonly MVCDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly RemoteDataService _remoteDataService;
        private readonly IHubContext<NotificationHub> _notificationHubContext;
        private readonly IWeatherService _weatherService;

        public HomeController(
            ILogger<HomeController> logger,
            MVCDbContext context,
            IConfiguration configuration,
            RemoteDataService remoteDataService,
            IHubContext<NotificationHub> notificationHubContext,
            IWeatherService weatherService)
        {
            _logger = logger;
            _context = context;
            _configuration = configuration;
            _remoteDataService = remoteDataService;
            _notificationHubContext = notificationHubContext;
            _weatherService = weatherService;
        }

        public async Task <IActionResult> Index()
        {
            /// Модель
            var model = new CombinedDataViewModel();

            DateTime firstQuarterStartDate = new DateTime(2024, 1, 1); // Начало первого квартала 2024 года
            DateTime firstQuarterEndDate = new DateTime(2024, 3, 31); // Конец первого квартала 2024 года

            
            var firstQuarterIncidents = await _context.IncidentList
                .Where(i => i.Date >= firstQuarterStartDate && i.Date <= firstQuarterEndDate)
                .GroupBy(i => i.ProblemType)
                .Select(g => new ProblemTypeStatisticsViewModel
                {
                    ProblemType = g.Key,
                    Count = g.Count(),
                    SuccessCount = g.Count(i => i.Status  == "Success"),
                    FailCount = g.Count(i => i.Status  == "Fail"),
                    TotalSuccessFailCount = g.Count(i => i.Status == "Success") + g.Count(i => i.Status == "Fail"),
                    SavedNPTCount = (int)g.Sum(i => i.SavedNPT) //в базе long - предложил такой вариант, без этого не хотел
                })
                .ToListAsync();

            int firstQuartertotalProblemTypes = firstQuarterIncidents.Sum(i=>i.Count);
            int firstQuartertotalClosedCount = firstQuarterIncidents.Sum(i => i.SuccessCount) + firstQuarterIncidents.Sum(i => i.FailCount);
            int firstQuartertotalSavedNPT = firstQuarterIncidents.Sum(i => i.SavedNPTCount);

            ///Q2

            DateTime secondQuarterStartDate = new DateTime(2024, 4, 1); // Начало первого квартала 2024 года
            DateTime secondQuarterEndDate = new DateTime(2024, 6, 30); // Конец первого квартала 2024 года

            var secondQuarterIncidents = await _context.IncidentList
                .Where(i => i.Date >= secondQuarterStartDate && i.Date <= secondQuarterEndDate)
                .GroupBy(i => i.ProblemType)
                .Select(g => new ProblemTypeStatisticsViewModel
                {
                    ProblemType = g.Key,
                    Count = g.Count(),
                    SuccessCount = g.Count(i => i.Status == "Success"),
                    FailCount = g.Count(i => i.Status == "Fail"),
                    TotalSuccessFailCount = g.Count(i => i.Status == "Success") + g.Count(i => i.Status == "Fail"),
                    SavedNPTCount = (int)g.Sum(i => i.SavedNPT) //в базе long - предложил такой вариант, без этого не хотел
                })
                .ToListAsync();

            int secondQuartertotalProblemTypes = secondQuarterIncidents.Sum(i => i.Count);
            int secondQuartertotalClosedCount = secondQuarterIncidents.Sum(i => i.SuccessCount) + secondQuarterIncidents.Sum(i => i.FailCount);
            int secondQuartertotalSavedNPT = secondQuarterIncidents.Sum(i => i.SavedNPTCount);

            

            // Получение последних 20 сообщений из Telegram
            model.TelegramMessages = _context.TelegramMessages
                .Include(m => m.Photos)
                .Include(m => m.Documents)
                .OrderByDescending(m => m.Date)
                .Take(50)
                .ToList();

            //Погода
            var cities = new List<string>
            {
                "Тюмень",
                "Новый Уренгой",
                "Ноябрьск",
                "Мирный",
                "Ленск",
                "Дудинка",
                "Ханты-Мансийск"
            };
            var weatherDataList = await _weatherService.GetCurrentWeatherAsync(cities);

            foreach (var w in weatherDataList)
            {
                // Если сервис вернул null, пропускаем
                if (w == null)
                    continue;

                // Дальше проверяем, есть ли погода
                if (w.Weather != null && w.Weather.Any())
                {
                    var weatherCode = w.Weather[0].Id;
                    var sunrise = DateTimeOffset.FromUnixTimeSeconds(w.Sys.Sunrise).UtcDateTime;
                    var sunset = DateTimeOffset.FromUnixTimeSeconds(w.Sys.Sunset).UtcDateTime;

                    w.BackgroundImage = _weatherService.GetWeatherBackgroundImage(weatherCode, sunrise, sunset);
                }
            }

            model.WeatherData = weatherDataList.ToList();

            // Получаем данные для первого города 
            var firstCityWeather = weatherDataList.FirstOrDefault();
            if (firstCityWeather != null)
            {
                // Получаем время восхода и заката
                DateTime sunrise = DateTimeOffset.FromUnixTimeSeconds(firstCityWeather.Sys.Sunrise).UtcDateTime;
                DateTime sunset = DateTimeOffset.FromUnixTimeSeconds(firstCityWeather.Sys.Sunset).UtcDateTime;

                // Получаем код погоды
                int weatherCode = firstCityWeather.Weather[0].Id;

                // Получаем путь к фоновому изображению
                string backgroundImage = _weatherService.GetWeatherBackgroundImage(weatherCode, sunrise, sunset);

                // Передаем путь в ViewBag
                ViewBag.BackgroundImage = backgroundImage;
            }

            return View(model);

        }

        [Authorize]
        [HttpGet]
        public async Task<IActionResult> GetDailyIncidents()
        {
            // Определяем временной диапазон для последних 36 часов
            var cutoffDate = DateTime.UtcNow.AddHours(-36);

            // Запрашиваем данные с фильтрацией и сортировкой
            var data = await _context.IncidentList
                .Where(incident => incident.Date >= cutoffDate) // Фильтруем записи за последние 36 часов
                .OrderByDescending(incident => incident.Date)    // Сортируем по дате, самые новые сверху
                .ToListAsync();

            return Json(data); // Возвращаем только массив данных
        }


        [Authorize]
        [HttpGet]
        public async Task<IActionResult> GetLatestVsatData(int ipPart)
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
                    return $"{pos}: {component} {sn}; ";
                }));

                // Подготовка данных для отправки
                var data = new
                {
                   
                    Well = vsatInfo.WELL_NAME,
                    Run = vsatInfo.MWRU_NUMBER,
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
        public async Task<IActionResult> GetDailyTasks()
        {
            try
            {
                // Задаём фиксированный ID доски Kanban
                var targetBoardId = Guid.Parse("12711015-7A9C-4563-910C-60ECCAE8696A");

                // Получаем первые две колонки доски Kanban с указанным ID, включая задачи, подзадачи и комментарии
                var columns = await _context.KanbanColumns
                    .Where(c => c.KanbanBoardId == targetBoardId)
                    .OrderBy(c => c.Order)
                    .Include(c => c.Tasks)
                        .ThenInclude(t => t.Subtasks)
                    .Include(c => c.Tasks)
                        .ThenInclude(t => t.Comments)
                    .Take(2) // Извлекаем первые две колонки
                    .ToListAsync();

                if (columns == null || !columns.Any())
                {
                    return Json(new { success = false, message = "Kanban доска с указанным ID не найдена или в ней отсутствуют колонки." });
                }

                // Преобразуем каждую колонку и её задачи в удобный для фронтенда формат
                var columnsData = columns.Select(column => new
                {
                    ColumnId = column.Id,
                    ColumnName = column.Column,
                    ColumnColor = column.ColumnColor,
                    Tasks = column.Tasks.Select(t => new
                    {
                        t.Id,
                        t.TaskName,
                        t.TaskDescription,
                        t.TaskColor,
                        t.CreatedAt,
                        t.DueDate,
                        t.Status,
                        t.Priority,
                        t.TaskType,
                        t.Order,
                        // Включение подзадач
                        Subtasks = t.Subtasks.Select(st => new
                        {
                            st.Id,
                            st.SubtaskDescription,
                            st.IsCompleted
                        }).ToList(),
                        // Включение комментариев
                        Comments = t.Comments.Select(c => new
                        {
                            c.Id,
                            c.CommentAuthor,
                            c.CommentText,
                            c.CreatedAt
                        }).ToList()
                    }).ToList()
                }).ToList();

                // Формируем ответ
                var response = new
                {
                    BoardId = targetBoardId,
                    Columns = columnsData
                };

                return Json(new { success = true, data = response });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при получении задач из Kanban доски.");
                return StatusCode(500, new { success = false, message = "Внутренняя ошибка сервера." });
            }
        }



        public IActionResult Privacy()
        {
            ViewData["CurrentPage"] = "about";
            return View();
        }

        public async Task <IActionResult> LogOut()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return RedirectToAction("Login", "Access");
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
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
                        continue;
                    }

                    var incident = await _context.IncidentList.FirstOrDefaultAsync(i => i.ID == updatedIncident.ID);

                    if (incident == null)
                    {
                        _logger.LogWarning($"UpdateIncidents: Инцидент с ID {updatedIncident.ID} не найден.");
                        continue;
                    }

                    // Обновите поля инцидента
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
                    
                }

                await _context.SaveChangesAsync();
                _logger.LogInformation("UpdateIncidents: Данные успешно обновлены.");
                return Ok(new { message = "Данные успешно обновлены." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "UpdateIncidents: Ошибка при массовом обновлении инцидентов.");
                return StatusCode(500, new { message = "Произошла ошибка при сохранении данных." });
            }
        }

        // Новый метод для добавления инцидента
        [Authorize]
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> AddIncident([FromBody] AddIncidentDTO newIncident)
        {
            if (newIncident == null)
            {
                _logger.LogWarning("AddIncident: Получены пустые данные.");
                return BadRequest(new { message = "Нет данных для добавления." });
            }

            try
            {
                var incident = new Incidents
                {
                    ID = Guid.NewGuid(),
                    Date = newIncident.Date,
                    Shift = newIncident.Shift,
                    Reporter = newIncident.Reporter,
                    VSAT = newIncident.VSAT,
                    Well = newIncident.Well,
                    Run = newIncident.Run,
                    SavedNPT = newIncident.SavedNPT,
                    ProblemType = newIncident.ProblemType,
                    HighLight = newIncident.HighLight,
                    Status = newIncident.Status,
                    Solution = newIncident.Solution,
                    File = newIncident.File,
                    DateEnd = newIncident.DateEnd,
                    Update = newIncident.Update
                };

                _context.IncidentList.Add(incident);
                await _context.SaveChangesAsync();

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

                // Возвращаем добавленный инцидент в ответе
                return Ok(new { message = "Инцидент успешно добавлен.", data = incident });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "AddIncident: Ошибка при добавлении инцидента.");
                return StatusCode(500, new { message = "Произошла ошибка при добавлении инцидента." });
            }
        }



    }
}
