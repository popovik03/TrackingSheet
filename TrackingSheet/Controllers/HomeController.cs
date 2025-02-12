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
            /// ������
            var model = new CombinedDataViewModel();

            DateTime firstQuarterStartDate = new DateTime(2024, 1, 1); // ������ ������� �������� 2024 ����
            DateTime firstQuarterEndDate = new DateTime(2024, 3, 31); // ����� ������� �������� 2024 ����

            
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
                    SavedNPTCount = (int)g.Sum(i => i.SavedNPT) //� ���� long - ��������� ����� �������, ��� ����� �� �����
                })
                .ToListAsync();

            int firstQuartertotalProblemTypes = firstQuarterIncidents.Sum(i=>i.Count);
            int firstQuartertotalClosedCount = firstQuarterIncidents.Sum(i => i.SuccessCount) + firstQuarterIncidents.Sum(i => i.FailCount);
            int firstQuartertotalSavedNPT = firstQuarterIncidents.Sum(i => i.SavedNPTCount);

            ///Q2

            DateTime secondQuarterStartDate = new DateTime(2024, 4, 1); // ������ ������� �������� 2024 ����
            DateTime secondQuarterEndDate = new DateTime(2024, 6, 30); // ����� ������� �������� 2024 ����

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
                    SavedNPTCount = (int)g.Sum(i => i.SavedNPT) //� ���� long - ��������� ����� �������, ��� ����� �� �����
                })
                .ToListAsync();

            int secondQuartertotalProblemTypes = secondQuarterIncidents.Sum(i => i.Count);
            int secondQuartertotalClosedCount = secondQuarterIncidents.Sum(i => i.SuccessCount) + secondQuarterIncidents.Sum(i => i.FailCount);
            int secondQuartertotalSavedNPT = secondQuarterIncidents.Sum(i => i.SavedNPTCount);

            

            // ��������� ��������� 20 ��������� �� Telegram
            model.TelegramMessages = _context.TelegramMessages
                .Include(m => m.Photos)
                .Include(m => m.Documents)
                .OrderByDescending(m => m.Date)
                .Take(50)
                .ToList();

            //������
            var cities = new List<string>
            {
                "������",
                "����� �������",
                "��������",
                "������",
                "�����",
                "�������",
                "�����-��������"
            };
            var weatherDataList = await _weatherService.GetCurrentWeatherAsync(cities);

            foreach (var w in weatherDataList)
            {
                // ���� ������ ������ null, ����������
                if (w == null)
                    continue;

                // ������ ���������, ���� �� ������
                if (w.Weather != null && w.Weather.Any())
                {
                    var weatherCode = w.Weather[0].Id;
                    var sunrise = DateTimeOffset.FromUnixTimeSeconds(w.Sys.Sunrise).UtcDateTime;
                    var sunset = DateTimeOffset.FromUnixTimeSeconds(w.Sys.Sunset).UtcDateTime;

                    w.BackgroundImage = _weatherService.GetWeatherBackgroundImage(weatherCode, sunrise, sunset);
                }
            }

            model.WeatherData = weatherDataList.ToList();

            // �������� ������ ��� ������� ������ 
            var firstCityWeather = weatherDataList.FirstOrDefault();
            if (firstCityWeather != null)
            {
                // �������� ����� ������� � ������
                DateTime sunrise = DateTimeOffset.FromUnixTimeSeconds(firstCityWeather.Sys.Sunrise).UtcDateTime;
                DateTime sunset = DateTimeOffset.FromUnixTimeSeconds(firstCityWeather.Sys.Sunset).UtcDateTime;

                // �������� ��� ������
                int weatherCode = firstCityWeather.Weather[0].Id;

                // �������� ���� � �������� �����������
                string backgroundImage = _weatherService.GetWeatherBackgroundImage(weatherCode, sunrise, sunset);

                // �������� ���� � ViewBag
                ViewBag.BackgroundImage = backgroundImage;
            }

            return View(model);

        }

        [Authorize]
        [HttpGet]
        public async Task<IActionResult> GetDailyIncidents()
        {
            // ���������� ��������� �������� ��� ��������� 36 �����
            var cutoffDate = DateTime.UtcNow.AddHours(-36);

            // ����������� ������ � ����������� � �����������
            var data = await _context.IncidentList
                .Where(incident => incident.Date >= cutoffDate) // ��������� ������ �� ��������� 36 �����
                .OrderByDescending(incident => incident.Date)    // ��������� �� ����, ����� ����� ������
                .ToListAsync();

            return Json(data); // ���������� ������ ������ ������
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

                // �������� ������ BHA
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

                // ���������� ������ ��� ��������
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
                // ����� ������������� ID ����� Kanban
                var targetBoardId = Guid.Parse("12711015-7A9C-4563-910C-60ECCAE8696A");

                // �������� ������ ��� ������� ����� Kanban � ��������� ID, ������� ������, ��������� � �����������
                var columns = await _context.KanbanColumns
                    .Where(c => c.KanbanBoardId == targetBoardId)
                    .OrderBy(c => c.Order)
                    .Include(c => c.Tasks)
                        .ThenInclude(t => t.Subtasks)
                    .Include(c => c.Tasks)
                        .ThenInclude(t => t.Comments)
                    .Take(2) // ��������� ������ ��� �������
                    .ToListAsync();

                if (columns == null || !columns.Any())
                {
                    return Json(new { success = false, message = "Kanban ����� � ��������� ID �� ������� ��� � ��� ����������� �������." });
                }

                // ����������� ������ ������� � � ������ � ������� ��� ��������� ������
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
                        // ��������� ��������
                        Subtasks = t.Subtasks.Select(st => new
                        {
                            st.Id,
                            st.SubtaskDescription,
                            st.IsCompleted
                        }).ToList(),
                        // ��������� ������������
                        Comments = t.Comments.Select(c => new
                        {
                            c.Id,
                            c.CommentAuthor,
                            c.CommentText,
                            c.CreatedAt
                        }).ToList()
                    }).ToList()
                }).ToList();

                // ��������� �����
                var response = new
                {
                    BoardId = targetBoardId,
                    Columns = columnsData
                };

                return Json(new { success = true, data = response });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "������ ��� ��������� ����� �� Kanban �����.");
                return StatusCode(500, new { success = false, message = "���������� ������ �������." });
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
                _logger.LogWarning("UpdateIncidents: ��� ������ ��� ����������.");
                return BadRequest(new { message = "��� ������ ��� ����������." });
            }

            try
            {
                foreach (var updatedIncident in updatedIncidents)
                {
                    if (updatedIncident.ID == Guid.Empty)
                    {
                        _logger.LogWarning("UpdateIncidents: ������� ������ � ������ ID.");
                        continue;
                    }

                    var incident = await _context.IncidentList.FirstOrDefaultAsync(i => i.ID == updatedIncident.ID);

                    if (incident == null)
                    {
                        _logger.LogWarning($"UpdateIncidents: �������� � ID {updatedIncident.ID} �� ������.");
                        continue;
                    }

                    // �������� ���� ���������
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
                _logger.LogInformation("UpdateIncidents: ������ ������� ���������.");
                return Ok(new { message = "������ ������� ���������." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "UpdateIncidents: ������ ��� �������� ���������� ����������.");
                return StatusCode(500, new { message = "��������� ������ ��� ���������� ������." });
            }
        }

        // ����� ����� ��� ���������� ���������
        [Authorize]
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> AddIncident([FromBody] AddIncidentDTO newIncident)
        {
            if (newIncident == null)
            {
                _logger.LogWarning("AddIncident: �������� ������ ������.");
                return BadRequest(new { message = "��� ������ ��� ����������." });
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

                // ���������� ������ ��� �����������
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

               
                // ����������� ������������� ����������� ��� �������
                _logger.LogInformation($"�������� �����������: {JsonConvert.SerializeObject(incidentNotification)}");

                // �������� ����������� ����� SignalR
                await _notificationHubContext.Clients.All.SendAsync("ReceiveNewIncident", incidentNotification);

                // ���������� ����������� �������� � ������
                return Ok(new { message = "�������� ������� ��������.", data = incident });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "AddIncident: ������ ��� ���������� ���������.");
                return StatusCode(500, new { message = "��������� ������ ��� ���������� ���������." });
            }
        }



    }
}
