namespace TrackingSheet.Models.DTO
{
    public class AddIncidentDTO
    {
        public DateTime Date { get; set; }
        public string? Shift { get; set; }
        public string? Reporter { get; set; }
        public int? VSAT { get; set; }
        public string? Well { get; set; }
        public int? Run { get; set; }
        public long? SavedNPT { get; set; }
        public string? ProblemType { get; set; }
        public string? HighLight { get; set; }
        public string? Status { get; set; }
        public string? Solution { get; set; }
        public int File { get; set; }
        public DateTime? DateEnd { get; set; }
        public string? Update { get; set; }
    }
}
