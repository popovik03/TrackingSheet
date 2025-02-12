using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Polly;
using Polly.Retry;

namespace TrackingSheet.Services.VsatBhaServices
{
    public class TimedHostedService : BackgroundService
    {
        private readonly ILogger<TimedHostedService> _logger;
        private readonly PassportFolderIndexerService _folderIndexerService;
        private Timer _timer;
        private readonly AsyncRetryPolicy _retryPolicy;

        public TimedHostedService(ILogger<TimedHostedService> logger, PassportFolderIndexerService folderIndexerService)
        {
            _logger = logger;
            _folderIndexerService = folderIndexerService;

            // Определение политики повторных попыток: 3 попытки с экспоненциальной задержкой
            _retryPolicy = Policy
                .Handle<Exception>()
                .WaitAndRetryAsync(
                    retryCount: 3,
                    sleepDurationProvider: attempt => TimeSpan.FromSeconds(Math.Pow(2, attempt)),
                    onRetry: (exception, timeSpan, retryCount, context) =>
                    {
                        _logger.LogWarning(exception, $"Попытка {retryCount} не удалась. Повтор через {timeSpan.TotalSeconds} секунд.");
                    });
        }

        protected override Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Сервис обновления паспортов по расписанию запущен");

            // Расчет времени до следующего запуска в 3:00
            var now = DateTime.Now;
            var nextRun = DateTime.Today.AddDays(now.Hour >= 3 ? 1 : 0).AddHours(3);
            var initialDelay = nextRun - now;

            _timer = new Timer(DoWork, null, initialDelay, TimeSpan.FromHours(24));

            return Task.CompletedTask;
        }

        private void DoWork(object state)
        {
            _ = DoWorkAsync();
        }

        private async Task DoWorkAsync()
        {
            try
            {
                _logger.LogInformation("Сервис обновления паспортов в работе");

                // Выполнение задачи с политикой повторных попыток
                await _retryPolicy.ExecuteAsync(async () => await _folderIndexerService.IndexFolderAsync());

                _logger.LogInformation("Сервис обновления паспортов успешно завершил работу");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Все попытки выполнения IndexFolderAsync не удались");
            }
        }

        public override Task StopAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Сервис обновления паспортов остановлен");
            _timer?.Change(Timeout.Infinite, 0);
            return Task.CompletedTask;
        }

        public override void Dispose()
        {
            _timer?.Dispose();
            base.Dispose();
        }
    }
}
