namespace TrackingSheet.Models.Notifications
{
    public class IncidentNotification
    {
        public Guid IncidentId { get; set; }
        public string Reporter { get; set; }
        public string ProblemType { get; set; }
        public string HighLight { get; set; }
        public string Well { get; set; }
        public string Solution { get; set; }
        public int? VSAT { get; set; } 
    }
}
