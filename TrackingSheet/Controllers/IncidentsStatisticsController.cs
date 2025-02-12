using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using TrackingSheet.Models;
using TrackingSheet.Services.IncidentStatisticsServices;
using TrackingSheet.Models.ViewModels;

namespace TrackingSheet.Controllers
{
    public class IncidentsStatisticsController : Controller
    {
        private readonly QuarterYearStatisticsService _quarterYearStatisticsService;

        public IncidentsStatisticsController(QuarterYearStatisticsService quarterYearStatisticsService)
        {
            _quarterYearStatisticsService = quarterYearStatisticsService;
        }


        [HttpGet]
        public async Task <IActionResult> IncidentsStatistics()
        {
            // Значения "по умолчанию" при первом визите
            int defaultYear = DateTime.Now.Year;  
            int defaultQuarter = 1;               
            int defaultMonth = 0;                 

            // Загрузка статистику сразу, чтобы при первом заходе была таблица
            var incidentsStatistics =
                await _quarterYearStatisticsService.GetIncidentStatisticsASync(defaultYear, defaultQuarter);

            // Настраиваем ViewData, чтобы в View при рендере были выбраны нужные значения
            ViewData["CurrentPage"] = "statistics";
            ViewData["SelectedYear"] = defaultYear;
            ViewData["SelectedQuarter"] = defaultQuarter.ToString();
            ViewData["SelectedMonth"] = defaultMonth.ToString();

            return View(incidentsStatistics);
        }

        
        [HttpPost]
        public async Task<IActionResult> IncidentsStatistics(int year, int quarter, int month)
        {
            List<ProblemTypeStatisticsViewModel> incidentsStatistics;

            if (month > 0)
            {
                incidentsStatistics = await _quarterYearStatisticsService.GetIncidentStatisticsForMonthAsync(year, month);
            }
            else if (quarter > 0)
            {
                incidentsStatistics = await _quarterYearStatisticsService.GetIncidentStatisticsASync(year, quarter);
            }
            else
            {
                incidentsStatistics = await _quarterYearStatisticsService.GetIncidentStatisticsForYearAsync(year);
            }

            ViewData["CurrentPage"] = "statistics";
            ViewData["SelectedYear"] = year;
            ViewData["SelectedQuarter"] = quarter.ToString();
            ViewData["SelectedMonth"] = month.ToString();

            return View(incidentsStatistics);
        }




    }
}
