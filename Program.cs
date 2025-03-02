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
builder.Services.AddScoped<IEmailService, EmailService>();

// Configure Session with more specific settings
builder.Services.AddDistributedMemoryCache();

builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Cookie.Name = ".AI_Maturity_Assessment.Session";
});

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
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        // Add Cache-Control headers to allow browser caching
        ctx.Context.Response.Headers.Append("Cache-Control", "public,max-age=600");
        
        // Ensure content type is set correctly for images
        if (ctx.File.Name.EndsWith(".png", StringComparison.OrdinalIgnoreCase))
        {
            ctx.Context.Response.ContentType = "image/png";
        }
        else if (ctx.File.Name.EndsWith(".jpg", StringComparison.OrdinalIgnoreCase) || 
                 ctx.File.Name.EndsWith(".jpeg", StringComparison.OrdinalIgnoreCase))
        {
            ctx.Context.Response.ContentType = "image/jpeg";
        }
    }
});
app.UseStaticFiles();
app.UseSessionDebug();
app.UseRouting();
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();