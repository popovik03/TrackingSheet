namespace TrackingSheet.Models.Domain
{
    public class Incidents
    {
        public Guid ID { get; set; }
        public DateTime Date { get; set; }
        
        public string? Shift { get; set; }
        public string? Reporter { get; set;}

        public int? VSAT { get; set; }
        public string? Well { get; set; }
        public int? Run { get; set; }
        public long? SavedNPT { get; set; }
        public string? ProblemType { get; set; }
        public string? HighLight { get; set; }
        public string? Status { get; set;}

        public string? Solution { get; set;}

        public int File { get; set; } //добавил для хранения файлов (просьба)
        public DateTime? DateEnd { get; set; } //добавил для даты окончания (просьба)
        public string? Update { get; set; }
        // Навигационное свойство для связи с обновлениями инцидента
        public ICollection<IncidentUpdate>? Updates { get; set; }

    }

    public class IncidentUpdate
    {
        public Guid ID { get; set; }
        public Guid IncidentID { get; set; } //Внешний ключ на инцидент из основной таблицы
        public DateTime Date { get; set; }
        public string? UpdateReporter { get; set; }
        public string? UpdateSolution { get; set; }
        public int Run { get; set; }
        //Навигационное свойство для связи с инцидентом из основной таблицы
        public Incidents Incident { get; set; }
    }
 
}
