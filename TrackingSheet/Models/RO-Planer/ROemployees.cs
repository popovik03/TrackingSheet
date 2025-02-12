
namespace TrackingSheet.Models.RO_Planer
{
    public class ROemployees
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int Stol { get; set; }
        public ICollection<EmployeePlaner2024> PlanerEntries { get; set; } //Связь с ROplanerEntries
    }
}
