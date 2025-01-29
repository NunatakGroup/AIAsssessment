using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;
using AI_Maturity_Assessment.Services;
using AI_Maturity_Assessment.Models;
using AI_Maturity_Assessment.Models.Assessment;

namespace AI_Maturity_Assessment.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class ResultsController : Controller
    {
        private readonly AzureTableService _azureTableService;
        private readonly ResultEvaluationService _evaluationService;
        private readonly IEmailService _emailService;
        private readonly ILogger<ResultsController> _logger;
        private const string SessionIdKey = "AssessmentSessionId";

        public ResultsController(
            AzureTableService azureTableService,
            IEmailService emailService,
            ILogger<ResultsController> logger)
        {
            _azureTableService = azureTableService;
            _emailService = emailService;
            _evaluationService = new ResultEvaluationService();
            _logger = logger;
        }

        [HttpGet]
        public IActionResult Index()
        {
            var sessionId = HttpContext.Session.GetString(SessionIdKey);
            _logger.LogInformation("Index accessed with sessionId: {SessionId}", sessionId);
            
            if (string.IsNullOrEmpty(sessionId))
            {
                return RedirectToAction("Index", "Assessment");
            }
            
            return View();
        }

        [HttpGet]
        [Route("GetResults")]
        public async Task<IActionResult> GetResults()
        {
            try
            {
                var sessionId = HttpContext.Session.GetString(SessionIdKey);
                _logger.LogInformation("GetResults called with sessionId: {SessionId}", sessionId);

                if (string.IsNullOrEmpty(sessionId))
                {
                    _logger.LogWarning("No session found");
                    return BadRequest(new { error = "No session found" });
                }

                var responses = await _azureTableService.GetResponses(sessionId);
                _logger.LogInformation("Responses retrieved: {ResponsesExist}", responses != null);
                
                if (responses == null)
                {
                    return NotFound(new { error = "No responses found" });
                }

                // Calculate category averages
                var aiApplicationAvg = CalculateAverage(responses, 2, 4);
                var peopleOrgAvg = CalculateAverage(responses, 5, 7);
                var techDataAvg = CalculateAverage(responses, 8, 10);

                // Store averages in the entity
                responses.AIApplicationAverage = aiApplicationAvg;
                responses.PeopleOrgAverage = peopleOrgAvg;
                responses.TechDataAverage = techDataAvg;
                await _azureTableService.UpdateEntity(responses);

                var chartData = new[] 
                { 
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

                var categoryResults = new[]
                {
                    new {
                        name = "AI APPLICATION",
                        average = aiApplicationAvg,
                        resultText = _evaluationService.GetEvaluation("AI APPLICATION", aiApplicationAvg)
                    },
                    new {
                        name = "PEOPLE & ORGANIZATION",
                        average = peopleOrgAvg,
                        resultText = _evaluationService.GetEvaluation("PEOPLE & ORGANIZATION", peopleOrgAvg)
                    },
                    new {
                        name = "TECH & DATA",
                        average = techDataAvg,
                        resultText = _evaluationService.GetEvaluation("TECH & DATA", techDataAvg)
                    }
                };

                var results = new
                {
                    chartData,
                    categoryResults,
                    ambition = new { score = responses.Question1Answer ?? 0, details = "AI Ambition Score" }
                };

                return Json(results);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetResults");
                return BadRequest(new { error = ex.Message });
            }
        }

        private double CalculateAverage(AssessmentResponseEntity responses, int startQuestion, int endQuestion)
        {
            var answers = new List<int>();
            for (int i = startQuestion; i <= endQuestion; i++)
            {
                var answer = typeof(AssessmentResponseEntity)
                    .GetProperty($"Question{i}Answer")
                    ?.GetValue(responses) as int?;
                
                if (answer.HasValue)
                    answers.Add(answer.Value);
            }

            return answers.Any() ? answers.Average() : 0;
        }

        [HttpPost]
        [Route("SubmitContact")]
        public async Task<IActionResult> SubmitContact([FromForm] ContactFormModel model)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var sessionId = HttpContext.Session.GetString(SessionIdKey);
                if (string.IsNullOrEmpty(sessionId))
                {
                    return BadRequest(new { error = "No session found" });
                }

                // Save contact info
                await _azureTableService.SaveContactInfo(sessionId, model.Name, model.Company, model.Email);

                // Get assessment results
                var responses = await _azureTableService.GetResponses(sessionId);
                if (responses == null)
                {
                    return BadRequest(new { error = "Assessment results not found" });
                }

                // Prepare results for email
                var resultsDto = new AssessmentResultsDTO
                {
                    AIApplicationAverage = responses.AIApplicationAverage ?? 0,
                    PeopleOrgAverage = responses.PeopleOrgAverage ?? 0,
                    TechDataAverage = responses.TechDataAverage ?? 0,
                    AIApplicationText = _evaluationService.GetEvaluation("AI APPLICATION", responses.AIApplicationAverage ?? 0),
                    PeopleOrgText = _evaluationService.GetEvaluation("PEOPLE & ORGANIZATION", responses.PeopleOrgAverage ?? 0),
                    TechDataText = _evaluationService.GetEvaluation("TECH & DATA", responses.TechDataAverage ?? 0)
                };

                // Send email
                try
                {
                    await _emailService.SendAssessmentResultsAsync(
                        model.Email,
                        model.Name,
                        model.Company,
                        resultsDto
                    );
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send assessment results email");
                    // Note: We're not returning an error to the client here
                    // as the contact form submission was successful
                }

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error submitting contact form");
                return BadRequest(new { error = ex.Message });
            }
        }
    }
}