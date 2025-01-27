using Microsoft.AspNetCore.Mvc;
using AI_Maturity_Assessment.Services;
using AI_Maturity_Assessment.Models;
using System.ComponentModel.DataAnnotations;

namespace AI_Maturity_Assessment.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class ResultsController : Controller
{
    private readonly AzureTableService _azureTableService;
    private readonly ResultEvaluationService _evaluationService;
    private const string SessionIdKey = "AssessmentSessionId";

    public ResultsController(AzureTableService azureTableService)
    {
        _azureTableService = azureTableService;
        _evaluationService = new ResultEvaluationService();
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
[Route("GetResults")]
public IActionResult GetResults()
    {
        var chartData = new[] { 3.5, 3.2, 3.8, 2.8, 2.9, 2.7, 4.0, 3.9, 4.1 };  // Dummy data for now

        var categoryResults = new[]
        {
            new {
                Name = "AI APPLICATION",
                Average = 3.5,  // Dummy score for now
                ResultText = _evaluationService.GetEvaluation("AI APPLICATION")
            },
            new {
                Name = "PEOPLE & ORGANIZATION",
                Average = 2.8,  // Dummy score for now
                ResultText = _evaluationService.GetEvaluation("PEOPLE & ORGANIZATION")
            },
            new {
                Name = "TECH & DATA",
                Average = 4.0,  // Dummy score for now
                ResultText = _evaluationService.GetEvaluation("TECH & DATA")
            }
        };

        var results = new
        {
            chartData,
            categoryResults,
            ambition = new { score = 4.0, details = "AI Ambition Score" }
        };

        return Json(results);
}

    [HttpPost]
    [Route("SubmitContact")]
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