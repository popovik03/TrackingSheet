using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;

namespace TrackingSheet.Models.ViewModels
{
    public class AddIncidentViewModel
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

        public Guid ID { get; set; }
        public List<IFormFile> UploadedFiles { get; set; } //Новое свойство для загрузки файлов 

        public int IpPart { get; set; } // Новое свойство для получения значения из формы
    }
}
