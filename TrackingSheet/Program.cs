using Microsoft.EntityFrameworkCore;
using TrackingSheet.Data;
using Microsoft.AspNetCore.Authentication.Cookies;
using TrackingSheet.Services;
using Newtonsoft.Json;
using TrackingSheet.Services.TelegramService;
using Telegram.Bot;
using TrackingSheet.Services.VsatBhaServices;
using TrackingSheet.Services.IncidentStatisticsServices;
using TrackingSheet.Models.VMLogin;
using TrackingSheet.Models.Options;
using TrackingSheet.Hubs;
using TrackingSheet.Hubs.TrackingSheet.Hubs;

var builder = WebApplication.CreateBuilder(args);

// Регистрация SignalR 
builder.Services.AddSignalR();

builder.Services.AddControllersWithViews()
    .AddNewtonsoftJson(options =>
        options.SerializerSettings.ReferenceLoopHandling = ReferenceLoopHandling.Ignore
    );

// Настройка антифальсификации
builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "RequestVerificationToken"; // Устанавливаем имя заголовка
});

// Регистрация сервисов
builder.Services.AddScoped<RemoteDataService>();
builder.Services.AddScoped<RemoteDataRunService>();
builder.Services.AddScoped<QuarterYearStatisticsService>();
builder.Services.AddScoped<IKanbanService, KanbanService>();
builder.Services.AddHttpClient<IWeatherService, WeatherService>();

// Привязка секции "Users" к списку пользователей с использованием модели VMLoginUser
builder.Services.Configure<List<VMLoginUser>>(builder.Configuration.GetSection("Users"));

// Привязка секции "UTC" к классу UtcSettings
builder.Services.Configure<UtcSettings>(builder.Configuration.GetSection("UTC"));

// Добавление сервисов аутентификации с использованием Cookie
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/Access/Login";
        options.LogoutPath = "/Access/LogOut";
        options.AccessDeniedPath = "/Access/AccessDenied";
        options.ExpireTimeSpan = TimeSpan.FromMinutes(720);
    });

// Регистрация TelegramBotClient
var botToken = builder.Configuration["TelegramBot:Token"];
builder.Services.AddSingleton<ITelegramBotClient>(new TelegramBotClient(botToken));

// Регистрация службы для Long Polling
builder.Services.AddHostedService<TelegramLongPollingService>();

// Сервисы для работы с паспортами
string rootPath = builder.Configuration.GetValue<string>("FolderIndexing:RootPath");
string outputPath = builder.Configuration.GetValue<string>("FolderIndexing:OutputPath");
builder.Services.AddSingleton(new PassportFolderIndexerService(rootPath, outputPath));
builder.Services.AddSingleton(new PassportFolderSearchService(outputPath));

// Добавляем TimedHostedService
builder.Services.AddHostedService<TimedHostedService>();

// Добавление кэша и сессии
builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromSeconds(1000);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

// Логирование
builder.Services.AddLogging(logging =>
{
    logging.ClearProviders();
    logging.AddConsole();
    logging.AddDebug();
});

// Регистрация DbContext с использованием SQL Server
builder.Services.AddDbContext<MVCDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("MVCDbConnectionString")));

var app = builder.Build();

// Настройка middleware
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseSession();

app.UseAuthentication();
app.UseAuthorization();

// Настройка маршрутизации для контроллеров
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Access}/{action=Login}/{id?}");

// Настройка маршрутизации для API контроллеров
app.MapControllers();

// Настройка маршрутизации для SignalR Hub
app.MapHub<KanbanHub>("/kanbanHub").RequireAuthorization(); 
app.MapHub<NotificationHub>("/notificationHub");
app.MapHub<TelegramHub>("/telegramHub");

app.Run();
