namespace TrackingSheet.Models.DTO
{
    public class TelegramMessageDTO
    {
        public long ChatId { get; set; }
        public string Username { get; set; }
        public string Text { get; set; }
        public DateTime Date { get; set; }
        public string AvatarUrl { get; set; }
        public List<string> PhotoUrls { get; set; }
        public List<string> DocumentUrls { get; set; }
    }

}
