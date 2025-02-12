namespace TrackingSheet.Models.Telegram
{
    public class TelegramDocument
    {
        public int Id { get; set; }
        public string FilePath { get; set; } // Путь к сохранённому файлу на сервере
        public int TelegramMessageId { get; set; } // Внешний ключ на TelegramMessage
        public TelegramMessage TelegramMessage { get; set; } // Навигационное свойство
    }
}
