namespace TrackingSheet.Models.DTO
{
    public class EditTaskSubtaskDto
    {
        public Guid Id { get; set; }
        public string SubtaskDescription { get; set; }
        public bool IsCompleted { get; set; }
        public string RowVersion { get; set; } // RowVersion как строка (Base64)
    }
}
