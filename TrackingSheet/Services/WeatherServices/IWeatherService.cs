using TrackingSheet.Models;
using System.Threading.Tasks;

namespace TrackingSheet.Services
{
    public interface IWeatherService
    {
        Task<WeatherResponse> GetCurrentWeatherAsync(string city);
        string GetWeatherBackgroundImage(int weatherCode, DateTime sunrise, DateTime sunset);
        Task<List<WeatherResponse>> GetCurrentWeatherAsync(IEnumerable<string> cities);


    }

}
