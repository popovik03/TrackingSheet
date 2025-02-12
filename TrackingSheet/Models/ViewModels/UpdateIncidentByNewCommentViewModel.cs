namespace TrackingSheet.Models.ViewModels
{
    public class UpdateIncidentByNewCommentViewModel
    {
        public Guid IncidentID { get; set; } // ID инцидента, к которому относится обновление
        public DateTime Date { get; set; } // Дата обновления
        public string? UpdateReporter { get; set; } // Автор обновления
        public string? UpdateSolution { get; set; } // Описание или решение
        public int Run { get; set; } // Номер рейса или другой идентификатор
    }
}
