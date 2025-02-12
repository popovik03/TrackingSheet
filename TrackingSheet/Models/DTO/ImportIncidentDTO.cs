namespace TrackingSheet.Models.DTO
{
    public class ImportIncidentDTO
    {
        public string Date { get; set; } // Формат: DD/MM/YYYY HH:mm
        public string Shift { get; set; }
        public string Reporter { get; set; }
        public string VSAT { get; set; }
        public string Well { get; set; }
        public string Run { get; set; }
        public string SavedNPT { get; set; }
        public string ProblemType { get; set; }
        public string HighLight { get; set; }
        public string Status { get; set; }
        public string Solution { get; set; }
    }
}
