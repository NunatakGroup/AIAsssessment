using AI_Maturity_Assessment.Models;
using AI_Maturity_Assessment.Services;

var builder = WebApplication.CreateBuilder(args);

// Load environment variables before configuration
DotNetEnv.Env.Load();
builder.Configuration.AddEnvironmentVariables();

// Register services
builder.Services.AddControllersWithViews();
builder.Services.AddScoped<IQuestionService, QuestionService>();
builder.Services.AddScoped<AzureTableService>();
var serviceProvider = builder.Services.BuildServiceProvider();
var azureTableService = serviceProvider.GetRequiredService<AzureTableService>();
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

var app = builder.Build();
app.UseSession();

// Configure pipeline
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();