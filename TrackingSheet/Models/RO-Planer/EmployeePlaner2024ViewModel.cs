using System.Collections.Generic;
namespace TrackingSheet.Models.RO_Planer
{
    public class EmployeePlanViewModel
    {
        public int EmployeeId { get; set; }
        public string Name { get; set; }
        public int Stol { get; set; }
        public Dictionary<string, List<string>> MonthlyPlans { get; set; } // Ключ - месяц, значение - список дней
    }
}