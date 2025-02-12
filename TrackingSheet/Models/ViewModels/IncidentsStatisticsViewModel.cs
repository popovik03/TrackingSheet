namespace TrackingSheet.Models.ViewModels
{
    public class IncidentsStatisticsViewModel
    {
        public int Year { get; set; }
        public int Quarter { get; set; }
        public List<ProblemTypeStatisticsViewModel> Statistics { get; set; }
    }
}
