namespace TrackingSheet.Models.RO_Planer
{
    public class EmployeePlaner2024
    {
        public int Id { get; set; }
        public int EmployeeId { get; set; } // Внешний ключ

        public int Year { get; set; }
        public string January { get; set; }
        public string February { get; set; }
        public string March { get; set; }
        public string April { get; set; }
        public string May { get; set; }
        public string June { get; set; }
        public string July { get; set; }
        public string August { get; set; }
        public string September { get; set; }
        public string October { get; set; }
        public string November { get; set; }
        public string December { get; set; }

        // Навигационное свойство для связи с ROemployees
        public ROemployees ROemployees { get; set; }
    }
}
