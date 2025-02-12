namespace TrackingSheet.Models.Telegram
{
    public class TelegramMessage
    {
        public int Id { get; set; }
        public long ChatId { get; set; }
        public string Username { get; set; }
        public string? Text { get; set; } 
        public DateTime Date { get; set; }
        public string AvatarUrl { get; set; }
        public ICollection<TelegramPhoto> Photos { get; set; }
        public ICollection<TelegramDocument> Documents { get; set; }
    }
}
