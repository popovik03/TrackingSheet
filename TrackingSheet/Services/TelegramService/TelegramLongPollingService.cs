
using Telegram.Bot;
using Telegram.Bot.Types;
using Telegram.Bot.Types.Enums;
using TrackingSheet.Data;
using TrackingSheet.Models.Telegram;
using Telegram.Bot.Polling;
using System.IO;
using System.Collections.Generic;
using TrackingSheet.Models.Options;
using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.SignalR;
using TrackingSheet.Hubs.TrackingSheet.Hubs;
using TrackingSheet.Models.DTO;

namespace TrackingSheet.Services.TelegramService
{
    public class TelegramLongPollingService : BackgroundService
    {
        private readonly ITelegramBotClient _botClient;
        private readonly ILogger<TelegramLongPollingService> _logger;
        private readonly IServiceProvider _serviceProvider;
        private readonly string _botToken;
        private readonly string _uploadPath;
        private readonly UtcSettings _utcSettings;
        private readonly IHubContext<TelegramHub> _telegramHubContext;

        public TelegramLongPollingService(
            ITelegramBotClient botClient,
            ILogger<TelegramLongPollingService> logger,
            IServiceProvider serviceProvider,
            IConfiguration configuration,
            IOptions<UtcSettings> utcSettingsOptions,
            IHubContext<TelegramHub> telegramHubContext)
        {
            _botClient = botClient;
            _logger = logger;
            _serviceProvider = serviceProvider;
            _botToken = configuration["TelegramBot:Token"];
            _uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploadsTelegram");
            _utcSettings = utcSettingsOptions.Value;
            _telegramHubContext = telegramHubContext;


            // Убедитесь, что папка Uploads существует
            Directory.CreateDirectory(_uploadPath);

            _logger.LogInformation("TelegramLongPollingService initialized.");
        }

        protected override Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("ExecuteAsync started.");
            var receiverOptions = new ReceiverOptions
            {
                AllowedUpdates = Array.Empty<UpdateType>() // Получать все обновления
            };

            _botClient.StartReceiving(
                HandleUpdateAsync,
                HandleErrorAsync,
                receiverOptions,
                cancellationToken: stoppingToken
            );

            _logger.LogInformation("Telegram Bot started receiving messages.");

            return Task.CompletedTask;
        }

        private async Task HandleUpdateAsync(ITelegramBotClient botClient, Update update, CancellationToken cancellationToken)
        {
            _logger.LogInformation("HandleUpdateAsync called.");

            if (update.Type != UpdateType.Message || update.Message == null)
                return;

            var message = update.Message;

            // Получение аватара пользователя (код уже у вас есть)
            string avatarUrl = await GetUserAvatarAsync(message.From.Id);

            using (var scope = _serviceProvider.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<MVCDbContext>();

                var utcNow = message.Date;
                var date = utcNow.AddHours(_utcSettings.GMToffset);

                // Создаём новый объект TelegramMessage
                var telegramMessage = new TelegramMessage
                {
                    ChatId = message.Chat.Id,
                    Username = message.From.Username,
                    Text = message.Text ?? message.Caption ?? string.Empty,
                    Date = date,
                    AvatarUrl = avatarUrl,
                    Photos = new List<TelegramPhoto>(),
                    Documents = new List<TelegramDocument>()
                };

                // Добавляем обработку фотографий
                if (message.Photo != null && message.Photo.Any())
                {
                    var largestPhoto = message.Photo.OrderByDescending(ps => ps.FileSize).FirstOrDefault();
                    if (largestPhoto != null)
                    {
                        var fileId = largestPhoto.FileId;
                        var tempFilePath = await DownloadFile(fileId);
                        if (tempFilePath != null)
                        {
                            try
                            {
                                var fileName = Path.GetFileName(tempFilePath);
                                var localFileName = Path.Combine(_uploadPath, fileName);
                                System.IO.File.Move(tempFilePath, localFileName, overwrite: true);

                                telegramMessage.Photos.Add(new TelegramPhoto
                                {
                                    FilePath = $"uploadsTelegram/{fileName}"
                                });
                            }
                            catch (Exception ex)
                            {
                                _logger.LogError(ex, "Ошибка при сохранении фото в локальное хранилище.");
                            }
                        }
                    }
                }

                // Сохранение сообщения в БД
                dbContext.TelegramMessages.Add(telegramMessage);
                await dbContext.SaveChangesAsync(cancellationToken);

                // Формируем DTO для отправки на клиент
                var telegramMessageDTO = new TelegramMessageDTO
                {
                    ChatId = telegramMessage.ChatId,
                    Username = telegramMessage.Username,
                    Text = telegramMessage.Text,
                    Date = telegramMessage.Date,
                    AvatarUrl = telegramMessage.AvatarUrl,
                    PhotoUrls = telegramMessage.Photos?.Select(p => $"/{p.FilePath}").ToList(),
                    DocumentUrls = telegramMessage.Documents?.Select(d => $"/{d.FilePath}").ToList()
                };

                // Отправляем через SignalR клиентам
                await _telegramHubContext.Clients.All.SendAsync("ReceiveTelegramMessage", telegramMessageDTO);
            }
        }




        private async Task<string> DownloadFile(string fileId)
        {
            try
            {
                var file = await _botClient.GetFile(fileId);
                var tempFileName = Path.GetFileName(file.FilePath);
                var tempFilePath = Path.Combine(Path.GetTempPath(), tempFileName);

                using (var fileStream = new FileStream(tempFilePath, FileMode.Create))
                {
                    await _botClient.DownloadFile(file.FilePath, fileStream);
                }

                _logger.LogInformation($"File downloaded to {tempFilePath}");
                return tempFilePath;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Ошибка при скачивании файла с FileId: {fileId}");
                return null;
            }
        }

        private async Task<string> GetUserAvatarAsync(long userId)
        {
            try
            {
                // Генерация имени файла на основе userId
                var userAvatarExtension = ".jpg"; // Предполагаемое расширение, можно динамически определить
                var uniqueFileName = $"{userId}{userAvatarExtension}";
                var localFilePath = Path.Combine(_uploadPath, uniqueFileName);
                var relativeUrl = $"/uploadsTelegram/{uniqueFileName}";

                // Проверяем, существует ли уже аватар пользователя
                if (System.IO.File.Exists(localFilePath))
                {
                    _logger.LogInformation($"Аватар для пользователя {userId} уже существует по пути {localFilePath}");
                    return relativeUrl;
                }

                var userPhotos = await _botClient.GetUserProfilePhotos(userId);
                if (userPhotos.TotalCount > 0)
                {
                    // Выбираем самое маленькое изображение для экономии пространства
                    var smallestPhoto = userPhotos.Photos.First().OrderBy(p => p.FileSize).FirstOrDefault();
                    if (smallestPhoto != null)
                    {
                        var fileId = smallestPhoto.FileId;
                        var tempFilePath = await DownloadFile(fileId);
                        if (tempFilePath != null)
                        {
                            try
                            {
                                // Перемещение файла в директорию uploadsTelegram с перезаписью, если необходимо
                                System.IO.File.Move(tempFilePath, localFilePath, overwrite: true);
                                _logger.LogInformation($"Аватар пользователя {userId} сохранён по пути {localFilePath}");
                                return relativeUrl;
                            }
                            catch (IOException ioEx)
                            {
                                _logger.LogError(ioEx, $"Ошибка при перемещении файла {tempFilePath} в {localFilePath}");
                                // Возвращаем стандартный аватар, если не удалось сохранить пользовательский
                                return "/telegram-avatars/default_avatar.jpg";
                            }
                            catch (UnauthorizedAccessException uaEx)
                            {
                                _logger.LogError(uaEx, $"Нет доступа для перемещения файла {tempFilePath} в {localFilePath}");
                                // Возвращаем стандартный аватар при отсутствии доступа
                                return "/telegram-avatars/default_avatar.jpg";
                            }
                            catch (Exception ex)
                            {
                                _logger.LogError(ex, $"Неизвестная ошибка при сохранении аватара для пользователя {userId}");
                                return "/telegram-avatars/default_avatar.jpg";
                            }
                        }
                    }
                }

                // Возвращаем стандартный аватар, если пользователь не имеет аватара или произошла ошибка
                return "/telegram-avatars/default_avatar.jpg";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Ошибка при получении аватара для пользователя {userId}");
                return "/telegram-avatars/default_avatar.jpg"; // В случае ошибки используем изображение по умолчанию
            }
        }


        private Task HandleErrorAsync(ITelegramBotClient botClient, Exception exception, CancellationToken cancellationToken)
        {
            _logger.LogError(exception, "Telegram Bot encountered an error.");
            return Task.CompletedTask;
        }
    }
}
