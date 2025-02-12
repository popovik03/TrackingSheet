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

// ����������� SignalR 
builder.Services.AddSignalR();

builder.Services.AddControllersWithViews()
    .AddNewtonsoftJson(options =>
        options.SerializerSettings.ReferenceLoopHandling = ReferenceLoopHandling.Ignore
    );

// ��������� �����������������
builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "RequestVerificationToken"; // ������������� ��� ���������
});

// ����������� ��������
builder.Services.AddScoped<RemoteDataService>();
builder.Services.AddScoped<RemoteDataRunService>();
builder.Services.AddScoped<QuarterYearStatisticsService>();
builder.Services.AddScoped<IKanbanService, KanbanService>();
builder.Services.AddHttpClient<IWeatherService, WeatherService>();

// �������� ������ "Users" � ������ ������������� � �������������� ������ VMLoginUser
builder.Services.Configure<List<VMLoginUser>>(builder.Configuration.GetSection("Users"));

// �������� ������ "UTC" � ������ UtcSettings
builder.Services.Configure<UtcSettings>(builder.Configuration.GetSection("UTC"));

// ���������� �������� �������������� � �������������� Cookie
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/Access/Login";
        options.LogoutPath = "/Access/LogOut";
        options.AccessDeniedPath = "/Access/AccessDenied";
        options.ExpireTimeSpan = TimeSpan.FromMinutes(720);
    });

// ����������� TelegramBotClient
var botToken = builder.Configuration["TelegramBot:Token"];
builder.Services.AddSingleton<ITelegramBotClient>(new TelegramBotClient(botToken));

// ����������� ������ ��� Long Polling
builder.Services.AddHostedService<TelegramLongPollingService>();

// ������� ��� ������ � ����������
string rootPath = builder.Configuration.GetValue<string>("FolderIndexing:RootPath");
string outputPath = builder.Configuration.GetValue<string>("FolderIndexing:OutputPath");
builder.Services.AddSingleton(new PassportFolderIndexerService(rootPath, outputPath));
builder.Services.AddSingleton(new PassportFolderSearchService(outputPath));

// ��������� TimedHostedService
builder.Services.AddHostedService<TimedHostedService>();

// ���������� ���� � ������
builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromSeconds(1000);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

// �����������
builder.Services.AddLogging(logging =>
{
    logging.ClearProviders();
    logging.AddConsole();
    logging.AddDebug();
});

// ����������� DbContext � �������������� SQL Server
builder.Services.AddDbContext<MVCDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("MVCDbConnectionString")));

var app = builder.Build();

// ��������� middleware
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

// ��������� ������������� ��� ������������
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Access}/{action=Login}/{id?}");

// ��������� ������������� ��� API ������������
app.MapControllers();

// ��������� ������������� ��� SignalR Hub
app.MapHub<KanbanHub>("/kanbanHub").RequireAuthorization(); 
app.MapHub<NotificationHub>("/notificationHub");
app.MapHub<TelegramHub>("/telegramHub");

app.Run();
