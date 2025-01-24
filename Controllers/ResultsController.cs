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

[HttpGet]
public async Task<IActionResult> GetResults()
{
    var sessionId = HttpContext.Session.GetString(SessionIdKey);
    if (string.IsNullOrEmpty(sessionId))
        return BadRequest("No session found");

    // Placeholder data for radar chart - replace with actual calculations
    var results = new
    {
        ambition = new { score = 80, details = "Strong AI ambition" },
        useCase = new { score = 75, details = "Good use cases" },
        enablers = new { score = 70, details = "Solid enablers" }
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