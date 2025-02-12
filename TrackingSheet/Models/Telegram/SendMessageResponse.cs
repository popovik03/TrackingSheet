namespace TrackingSheet.Models.Telegram
{
    public class SendMessageResponse
    {
        public string Status { get; set; }
        public List<string> FileUrls { get; set; } = new List<string>();
    }

}
