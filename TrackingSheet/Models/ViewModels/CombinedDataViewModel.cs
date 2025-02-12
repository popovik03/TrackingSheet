using TrackingSheet.Models;
using TrackingSheet.Models.Domain;
using TrackingSheet.Models.Telegram;
using System.Collections.Generic;

namespace TrackingSheet.Models.ViewModels
{
    public class CombinedDataViewModel
    {
        public IEnumerable<Incidents> RecentIncidents { get; set; }
        public IEnumerable<Incidents> AllIncidents { get; set; }

        public List<ProblemTypeStatisticsViewModel> FirstQuarterStatistics { get; set; }
        public List<ProblemTypeStatisticsViewModel> SecondQuarterStatistics { get; set; }

        public int FirstQuarterSTotalProblemTypes { get; set; }
        public int FirstQuarterSTotalClosedCount { get; set; }

        public int FirstQuarterSTotalSavedNPT { get; set; }
        public int SecondQuarterSTotalProblemTypes { get; set; }
        public int SecondQuarterSTotalClosedCount { get; set; }

        public int SecondQuarterSTotalSavedNPT { get; set; }

        public IEnumerable<TelegramMessage> TelegramMessages { get; set; }


        //Погодные данные
        public List<WeatherResponse> WeatherData { get; set; }
    }

    public class ProblemTypeStatisticsViewModel
    {
        public string ProblemType { get; set; }
        public int Count { get; set; }
        public int SuccessCount { get; set; }
        public int FailCount { get; set; }
        public int SavedNPTCount { get; set; }

        public int TotalSuccessFailCount { get; set; }
    }

    

}
