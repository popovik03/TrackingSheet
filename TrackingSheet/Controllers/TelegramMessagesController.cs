using Microsoft.AspNetCore.Mvc;
using Telegram.Bot;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using TrackingSheet.Models.Telegram;
using TrackingSheet.Data;
using System.IO;
using System.Threading.Tasks;
using Telegram.Bot.Types;
using System;
using System.Linq;
using System.Collections.Generic;

namespace TrackingSheet.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TelegramMessagesController : ControllerBase
    {
        private readonly ITelegramBotClient _botClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<TelegramMessagesController> _logger;
        private readonly MVCDbContext _dbContext;

        public TelegramMessagesController(
            ITelegramBotClient botClient,
            IConfiguration configuration,
            ILogger<TelegramMessagesController> logger,
            MVCDbContext dbContext)
        {
            _botClient = botClient;
            _configuration = configuration;
            _logger = logger;
            _dbContext = dbContext;
        }

        [HttpPost("Send")]
        public async Task<IActionResult> SendMessage(
            [FromHeader(Name = "X-API-KEY")] string apiKey,
            [FromForm] SendMessageRequest request)
        {
            var validApiKey = _configuration["ApiKeys:TelegramSend"];

            if (apiKey != validApiKey)
            {
                _logger.LogWarning("Попытка доступа с недействительным API-ключом.");
                return Unauthorized(new SendMessageResponse { Status = "Недействительный API-ключ." });
            }

            // Проверка наличия текста или файлов
            if (string.IsNullOrWhiteSpace(request.Text) && (request.Files == null || !request.Files.Any()))
            {
                _logger.LogWarning("Пустое сообщение и отсутствуют файлы.");
                return BadRequest(new SendMessageResponse { Status = "Сообщение и файлы не могут быть одновременно пустыми." });
            }

            var chatIdString = _configuration["TelegramBot:GroupChatId"];
            if (!long.TryParse(chatIdString, out long chatId))
            {
                _logger.LogError("Некорректный GroupChatId в конфигурации.");
                return StatusCode(500, new SendMessageResponse { Status = "Серверная ошибка конфигурации." });
            }

            // Получение информации о боте для сохранения Username
            var botInfo = await _botClient.GetMe();

            // Создание объекта TelegramMessage для сохранения в базу данных
            var telegramMessage = new TelegramMessage
            {
                ChatId = chatId,
                Username = botInfo.Username,
                Text = string.IsNullOrWhiteSpace(request.Text) ? string.Empty : request.Text,

                Date = DateTime.UtcNow, // Или используйте DateTime.Now, если необходимо
                AvatarUrl = "/telegram-avatars/avatar.jpg", // Или другой подходящий URL
                Photos = new List<TelegramPhoto>(),
                Documents = new List<TelegramDocument>()
            };

            try
            {
                _logger.LogInformation("Начало отправки сообщения...");

                // Отправка текстового сообщения
                if (!string.IsNullOrWhiteSpace(request.Text))
                {
                    _logger.LogInformation("Отправка текстового сообщения...");
                    await _botClient.SendMessage(
                        chatId: chatId,
                        text: request.Text
                    );
                    _logger.LogInformation("Текстовое сообщение отправлено.");
                }

                // Отправка файлов
                if (request.Files != null && request.Files.Count > 0)
                {
                    _logger.LogInformation("Отправка файлов...");
                    var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploadsTelegram");

                    // Убедимся, что директория существует
                    if (!Directory.Exists(uploadsPath))
                    {
                        Directory.CreateDirectory(uploadsPath);
                        _logger.LogInformation($"Создана директория: {uploadsPath}");
                    }

                    foreach (var file in request.Files)
                    {
                        var fileType = file.ContentType.ToLower();
                        var fileName = Path.GetFileName(file.FileName);
                        var filePath = Path.Combine(uploadsPath, fileName);

                        // Сохранение файла на диск
                        using (var fileStream = new FileStream(filePath, FileMode.Create))
                        {
                            await file.CopyToAsync(fileStream);
                        }

                        _logger.LogInformation($"Файл сохранён: {filePath}");

                        // Отправка файла через Telegram Bot API
                        using (var stream = System.IO.File.OpenRead(filePath))
                        {
                            if (fileType.StartsWith("image/"))
                            {
                                var inputFile = new InputFileStream(stream, fileName);
                                await _botClient.SendPhoto(
                                    chatId: chatId,
                                    photo: inputFile
                                );

                                _logger.LogInformation($"Фотография отправлена: {fileName}");

                                // Добавление фотографии в модель
                                var photo = new TelegramPhoto
                                {
                                    FilePath = $"uploadsTelegram/{fileName}"
                                };
                                telegramMessage.Photos.Add(photo);
                            }
                            else
                            {
                                var inputFile = new InputFileStream(stream, fileName);
                                await _botClient.SendDocument(
                                    chatId: chatId,
                                    document: inputFile
                                );

                                _logger.LogInformation($"Документ отправлен: {fileName}");

                                // Добавление документа в модель
                                var document = new TelegramDocument
                                {
                                    FilePath = $"uploadsTelegram/{fileName}"
                                };
                                telegramMessage.Documents.Add(document);
                            }
                        }
                    }
                    _logger.LogInformation("Файлы отправлены.");
                }

                // Сохранение сообщения в базу данных
                _logger.LogInformation("Сохранение сообщения в базу данных...");
                _dbContext.TelegramMessages.Add(telegramMessage);
                await _dbContext.SaveChangesAsync();
                _logger.LogInformation("Сообщение сохранено в базу данных.");

                _logger.LogInformation("Сообщение и файлы успешно отправлены и сохранены в базе данных для GroupChatId: {GroupChatId}", chatId);
                return Ok(new SendMessageResponse { Status = "Сообщение и файлы отправлены успешно.", FileUrls = new List<string>() });
            }
            catch (Telegram.Bot.Exceptions.ApiRequestException apiEx)
            {
                _logger.LogError(apiEx, "Ошибка Telegram API при отправке сообщения.");
                return StatusCode(502, new SendMessageResponse { Status = "Ошибка Telegram API.", FileUrls = new List<string>() });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при отправке сообщения и/или файлов в группу с GroupChatId: {GroupChatId}", chatId);
                return StatusCode(500, new SendMessageResponse { Status = $"Ошибка при отправке: {ex.Message}", FileUrls = new List<string>() });
            }
        }
    }

    public class SendMessageRequest
    {
        public string? Text { get; set; }
        public List<IFormFile> Files { get; set; } = new List<IFormFile>();
    }
}