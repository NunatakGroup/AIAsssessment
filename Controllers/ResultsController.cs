using Microsoft.AspNetCore.Mvc;
using AI_Maturity_Assessment.Services;
using AI_Maturity_Assessment.Models;
using System.ComponentModel.DataAnnotations;

namespace AI_Maturity_Assessment.Controllers
{
    public class ResultsController : Controller
{
    private readonly AzureTableService _azureTableService;
    private const string SessionIdKey = "AssessmentSessionId";

    public ResultsController(AzureTableService azureTableService)
    {
        _azureTableService = azureTableService;
    }

    [HttpGet]
public IActionResult Index()
{
    var sessionId = HttpContext.Session.GetString(SessionIdKey);
    if (string.IsNullOrEmpty(sessionId))
        return RedirectToAction("Index", "Assessment");
    
    return View();
}

// Update ResultsController.cs GetResults method
[HttpGet]
public async Task<IActionResult> GetResults()
{
    var sessionId = HttpContext.Session.GetString(SessionIdKey);
    if (string.IsNullOrEmpty(sessionId))
        return BadRequest("No session found");

    var responses = await _azureTableService.GetResponses(sessionId);
    if (responses == null)
        return NotFound();

    var chartData = new[] {
        responses.Question2Answer ?? 0,  // AI Products
        responses.Question3Answer ?? 0,  // New Business Models
        responses.Question4Answer ?? 0,  // AI Enhanced Processes
        responses.Question5Answer ?? 0,  // AI Impact Management
        responses.Question6Answer ?? 0,  // AI Governance
        responses.Question7Answer ?? 0,  // Roles/Skills/Competencies
        responses.Question8Answer ?? 0,  // Security/Privacy
        responses.Question9Answer ?? 0,  // Platform/Tools
        responses.Question10Answer ?? 0  // Data Infrastructure
    };

    var results = new
    {
        chartData = chartData,
        ambition = new { score = responses.Question1Answer ?? 0, details = "AI Ambition Score" }
    };

    return Json(results);
}

    [HttpPost]
    public async Task<IActionResult> SubmitContact([FromForm] ContactFormModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var sessionId = HttpContext.Session.GetString(SessionIdKey);
        if (string.IsNullOrEmpty(sessionId))
            return BadRequest("No session found");

        await _azureTableService.SaveContactInfo(sessionId, model.Name, model.Company, model.Email);
        return Ok();
    }
}
}