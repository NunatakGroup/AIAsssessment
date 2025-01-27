using AI_Maturity_Assessment.Models;
using AI_Maturity_Assessment.Services;
using AI_Maturity_Assessment.Middleware;

var builder = WebApplication.CreateBuilder(args);

// Load environment variables before configuration
DotNetEnv.Env.Load();
builder.Configuration.AddEnvironmentVariables();

// Register services
builder.Services.AddControllersWithViews();
builder.Services.AddScoped<IQuestionService, QuestionService>();
builder.Services.AddScoped<AzureTableService>();
builder.Services.AddScoped<ResultEvaluationService>();

// Remove duplicate AddControllersWithViews()
// builder.Services.AddControllersWithViews(); 

// Configure Session with more specific settings
builder.Services.AddDistributedMemoryCache(); // Add this line first

builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
    options.Cookie.SameSite = SameSiteMode.Lax;  // Changed from Strict to Lax
    options.Cookie.Name = ".AI_Maturity_Assessment.Session"; // Add a specific name
});

// Move this after app building
// var serviceProvider = builder.Services.BuildServiceProvider();
// var azureTableService = serviceProvider.GetRequiredService<AzureTableService>();

var app = builder.Build();

// Configure pipeline
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseSession();
app.UseSessionDebug();
app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseSessionDebug();
app.UseRouting();
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();