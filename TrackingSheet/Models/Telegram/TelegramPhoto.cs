namespace TrackingSheet.Models.Telegram
{
    public class TelegramPhoto
    {
        public int Id { get; set; }
        public string FilePath { get; set; }
        public int TelegramMessageId { get; set; }
        public TelegramMessage TelegramMessage { get; set; }
    }
}
