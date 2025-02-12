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
    public class GuestController : Controller
    {
        private readonly MVCDbContext mvcDbContext;
        private readonly IConfiguration _configuration;
        private readonly ILogger<IncidentsController> _logger;
        private readonly UtcSettings _utcSettings;

        public GuestController(MVCDbContext mvcDbContext, IConfiguration configuration, ILogger<IncidentsController> logger, IOptions<UtcSettings> utcSettingsOptions)
        {
            this.mvcDbContext = mvcDbContext;
            _configuration = configuration;
            _logger = logger;
            _utcSettings = utcSettingsOptions.Value;
        }

        [HttpGet]
        public async Task <IActionResult> Guest()
        {
            var incidents = await mvcDbContext.IncidentList.OrderByDescending(p => p.Date).ToListAsync();
            ViewData["CurrentPage"] = "journal";
            return View(incidents);
        }

        // Передача данных из базы в DataTable в формате json
        [HttpGet("api/guest/all")]
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
    }
}
