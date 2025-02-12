using System.Text.Json.Serialization;

namespace TrackingSheet.Models
{
   
    public class WeatherResponse
    {
        [JsonPropertyName("name")]
        public string Name { get; set; }

        [JsonPropertyName("main")]
        public MainInfo Main { get; set; }

        [JsonPropertyName("weather")]
        public WeatherInfo[] Weather { get; set; }

        [JsonPropertyName("wind")]
        public WindInfo Wind { get; set; }

        [JsonPropertyName("dt")]
        public long DateTimeUnix { get; set; }

        [JsonPropertyName("sys")] 
        public SysInfo Sys { get; set; }

        public string BackgroundImage { get; set; }

    }

    public class MainInfo
    {
        [JsonPropertyName("temp")]
        public float Temp { get; set; }

        [JsonPropertyName("feels_like")]
        public float FeelsLike { get; set; }

        [JsonPropertyName("humidity")]
        public int Humidity { get; set; }

        [JsonPropertyName("pressure")]
        public int Pressure { get; set; }
    }

    public class WeatherInfo
    {
        [JsonPropertyName("description")]
        public string Description { get; set; }

        [JsonPropertyName("icon")]
        public string Icon { get; set; }

        [JsonPropertyName("id")] 
        public int Id { get; set; }
    }

    public class WindInfo
    {
        [JsonPropertyName("speed")]
        public float Speed { get; set; }

        [JsonPropertyName("deg")]
        public int Degree { get; set; }
    }

    public class SysInfo 
    {
        [JsonPropertyName("sunrise")]
        public long Sunrise { get; set; }

        [JsonPropertyName("sunset")]
        public long Sunset { get; set; }
    }

}
