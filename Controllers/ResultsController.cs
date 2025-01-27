using Microsoft.AspNetCore.Mvc;
using AI_Maturity_Assessment.Services;
using AI_Maturity_Assessment.Models;
using System.ComponentModel.DataAnnotations;

namespace AI_Maturity_Assessment.Controllers
{
    public class ResultsController : Controller
{
    private readonly AzureTableService _azureTableService;
    private readonly CategoryService _categoryService;
    private readonly ResultEvaluationService _evaluationService;
    private const string SessionIdKey = "AssessmentSessionId";

    public ResultsController(AzureTableService azureTableService)
    {
        _azureTableService = azureTableService;
        _categoryService = new CategoryService();
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

        var categoryResults = _categoryService.Categories.Keys
            .Select(category => {
            var result = _categoryService.CalculateCategoryResult(category, responses);
            result.ResultText = _evaluationService.GetEvaluation(category, result.Average);
            return result;
        })
        .ToList();

        var chartData = new[] {
            responses.Question2Answer ?? 0,
            responses.Question3Answer ?? 0,
            responses.Question4Answer ?? 0,
            responses.Question5Answer ?? 0,
            responses.Question6Answer ?? 0,
            responses.Question7Answer ?? 0,
            responses.Question8Answer ?? 0,
            responses.Question9Answer ?? 0,
            responses.Question10Answer ?? 0
        };

        var results = new
        {
            chartData,
            categoryResults,
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