using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using TrackingSheet.Models;

namespace TrackingSheet.Services
{
    public class WeatherService : IWeatherService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;

        public WeatherService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _apiKey = configuration["OpenWeatherMap:ApiKey"];
        }

        public async Task<WeatherResponse> GetCurrentWeatherAsync(string city)
        {
            if (string.IsNullOrEmpty(city))
                throw new ArgumentException("Город не может быть пустым.", nameof(city));

            try
            {
                var url = $"https://api.openweathermap.org/data/2.5/weather?q={Uri.EscapeDataString(city)}&appid={_apiKey}&units=metric&lang=ru";
                var response = await _httpClient.GetAsync(url);

                // Если неудачный статус, выбрасываем HttpRequestException
                if (!response.IsSuccessStatusCode)
                {
                    throw new HttpRequestException($"Запрос к OpenWeatherMap не удался: {response.StatusCode}");
                }

                var json = await response.Content.ReadAsStringAsync();
                var options = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true,
                };
                var weatherResponse = JsonSerializer.Deserialize<WeatherResponse>(json, options);

                return weatherResponse;
            }
            catch (Exception ex)
            {
                
                return null;
            }
        }


        public string GetWeatherBackgroundImage(int weatherCode, DateTime sunrise, DateTime sunset)
        {
            DateTime now = DateTime.UtcNow;
            //Опеределение день или ночь
            bool isDaytime = now > sunrise && now < sunset;

            return weatherCode switch
            {
                // Ясно (ясный день или ночь)
                800 => isDaytime ? "/img/weather/day.png" : "/img/weather/night.png",

                // Облачно
                >= 801 and <= 804 => "/img/weather/Cloudy.png",

                // Дождь
                >= 500 and <= 531 => "/img/weather/rain.png",

                // Снег
                >= 600 and <= 622 => "/img/weather/snow.png",

                // Гроза
                >= 200 and <= 232 => "/img/weather/Lightning.png",

                // Туман или атмосферные явления
                >= 701 and <= 781 => "/img/weather/Fog.png",

                // По умолчанию (например, для неизвестных кодов)
                _ => "/img/weather/day.png"
            };
        }

        public async Task<List<WeatherResponse>> GetCurrentWeatherAsync(IEnumerable<string> cities)
        {
            var tasks = cities.Select(city => GetCurrentWeatherAsync(city));
            var results = await Task.WhenAll(tasks);
            return results.ToList();
        }
    }

    
}