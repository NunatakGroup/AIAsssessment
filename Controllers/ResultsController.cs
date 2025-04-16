using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;
using AI_Maturity_Assessment.Services;
using AI_Maturity_Assessment.Models;
using AI_Maturity_Assessment.Models.Assessment;
using System.Collections.Generic; // Required for List
using System.Linq; // Required for Linq methods like Any() Average()

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
                _logger.LogWarning("Results/Index accessed without SessionId. Redirecting to Assessment.");
                return RedirectToAction("Index", "Assessment");
            }

            // Pass AILabViewModel to the view
            var viewModel = new AILabViewModel
            {
                Contacts = GetAILabContacts()
            };

            return View(viewModel);
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
                    _logger.LogWarning("GetResults: No session found");
                    return BadRequest(new { error = "No session found. Please complete the assessment first." });
                }

                // Fetch Benchmarks
                BenchmarkEntity benchmarks = null;
                try
                {
                    benchmarks = await _azureTableService.GetBenchmarks();
                    _logger.LogInformation("Benchmarks fetched successfully.");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to fetch benchmarks. Using defaults.");
                    // Use default values if fetching fails
                    benchmarks = new BenchmarkEntity(); // Uses constructor default values
                }

                var responses = await _azureTableService.GetResponses(sessionId);
                _logger.LogInformation("User responses retrieved: {ResponsesExist}", responses != null);

                if (responses == null)
                {
                    _logger.LogWarning("GetResults: No responses found for session {SessionId}", sessionId);
                    return NotFound(new { error = "Assessment results not found for this session." });
                }

                // Ensure averages are calculated and stored if not already present
                // (This might be redundant if SubmitAnswers always calculates them, but safe)
                if (responses.AIApplicationAverage == null || responses.PeopleOrgAverage == null || responses.TechDataAverage == null)
                {
                    _logger.LogInformation("Calculating averages for session {SessionId}", sessionId);
                    responses.AIApplicationAverage = CalculateAverage(responses, 3, 5);
                    responses.PeopleOrgAverage = CalculateAverage(responses, 6, 8);
                    responses.TechDataAverage = CalculateAverage(responses, 9, 11);
                    await _azureTableService.UpdateEntity(responses); // Save updated averages
                }

                // User's answers for the chart (Q3-Q11)
                var userChartData = new[]
                {
                    responses.Question3Answer ?? 0,
                    responses.Question4Answer ?? 0,
                    responses.Question5Answer ?? 0,
                    responses.Question6Answer ?? 0,
                    responses.Question7Answer ?? 0,
                    responses.Question8Answer ?? 0,
                    responses.Question9Answer ?? 0,
                    responses.Question10Answer ?? 0,
                    responses.Question11Answer ?? 0
                };

                // Prepare Benchmark Data
                var benchmarkChartData = new[]
                {
                    benchmarks?.Q3Benchmark ?? 3,
                    benchmarks?.Q4Benchmark ?? 3,
                    benchmarks?.Q5Benchmark ?? 3,
                    benchmarks?.Q6Benchmark ?? 3,
                    benchmarks?.Q7Benchmark ?? 3,
                    benchmarks?.Q8Benchmark ?? 3,
                    benchmarks?.Q9Benchmark ?? 3,
                    benchmarks?.Q10Benchmark ?? 3,
                    benchmarks?.Q11Benchmark ?? 3
                };
                _logger.LogInformation("Benchmark data prepared: {BenchmarkData}", string.Join(",", benchmarkChartData));

                var categoryResults = new[]
                {
                    new {
                        name = "AI APPLICATION",
                        average = responses.AIApplicationAverage ?? 0, // Use calculated average
                        resultText = _evaluationService.GetEvaluation("AI APPLICATION", responses.AIApplicationAverage ?? 0)
                    },
                    new {
                        name = "PEOPLE & ORGANIZATION",
                        average = responses.PeopleOrgAverage ?? 0, // Use calculated average
                        resultText = _evaluationService.GetEvaluation("PEOPLE & ORGANIZATION", responses.PeopleOrgAverage ?? 0)
                    },
                    new {
                        name = "TECH & DATA",
                        average = responses.TechDataAverage ?? 0, // Use calculated average
                        resultText = _evaluationService.GetEvaluation("TECH & DATA", responses.TechDataAverage ?? 0)
                    }
                };

                // Update returned JSON structure
                var results = new
                {
                    userChartData,       // User's scores for Q3-Q11
                    benchmarkChartData,  // Benchmark scores for Q3-Q11
                    categoryResults,
                    // Ambition score might still be useful elsewhere on the page
                    ambition = new { score = responses.Question1Answer ?? 0, details = "AI Ambition Score" }
                };

                return Json(results);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetResults");
                // Return a generic error message to the client
                return StatusCode(500, new { error = "An unexpected error occurred while retrieving results." });
            }
        }

        // CalculateAverage remains the same
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

        // GetAILabContacts remains the same
        private List<ContactPerson> GetAILabContacts()
        {
            // Get the base URL of the application
            var baseUrl = $"{Request.Scheme}://{Request.Host}";

            return new List<ContactPerson>
            {
                new ContactPerson { Name = "MANUEL HALBING", Role = "AI Lab Managing Director", Email = "manuel.halbing@nunatak.com", ImagePath = "~/images/manuel-halbing.jpg" },
                new ContactPerson { Name = "LEA KLICK", Role = "AI Lab Transformation Lead", Email = "lea.klick@nunatak.com", ImagePath = "~/images/lea-klick.png" },
                new ContactPerson { Name = "OLIVER ZINDLER", Role = "AI Lab Strategy Lead", Email = "oliver.zindler@nunatak.com", ImagePath = "~/images/oliver-zindler.png" },
            };
        }

        // SubmitContact remains the same
        [HttpPost]
        [Route("SubmitContact")]
        public async Task<IActionResult> SubmitContact([FromForm] ContactFormModel model)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    // Log validation errors
                    var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
                    _logger.LogWarning("SubmitContact validation failed: {Errors}", string.Join("; ", errors));
                    return BadRequest(ModelState);
                }

                var sessionId = HttpContext.Session.GetString(SessionIdKey);
                if (string.IsNullOrEmpty(sessionId))
                {
                    _logger.LogWarning("SubmitContact: No session found.");
                    return BadRequest(new { error = "No session found" });
                }

                // Save only name, company, and email
                await _azureTableService.SaveContactInfo(sessionId, model.Name, model.Company, model.Email);
                _logger.LogInformation("Contact info saved for session {SessionId}", sessionId);

                // Get assessment results
                var responses = await _azureTableService.GetResponses(sessionId);
                if (responses == null)
                {
                    _logger.LogError("SubmitContact: Assessment results not found for session {SessionId} after saving contact info.", sessionId);
                    return BadRequest(new { error = "Assessment results not found" });
                }

                // Prepare results for email
                var resultsDto = new AssessmentResultsDTO
                {
                    // Use the potentially recalculated averages
                    AIApplicationAverage = responses.AIApplicationAverage ?? CalculateAverage(responses, 3, 5),
                    PeopleOrgAverage = responses.PeopleOrgAverage ?? CalculateAverage(responses, 6, 8),
                    TechDataAverage = responses.TechDataAverage ?? CalculateAverage(responses, 9, 11)
                };
                // Get evaluation text based on potentially recalculated averages
                resultsDto.AIApplicationText = _evaluationService.GetEvaluation("AI APPLICATION", resultsDto.AIApplicationAverage);
                resultsDto.PeopleOrgText = _evaluationService.GetEvaluation("PEOPLE & ORGANIZATION", resultsDto.PeopleOrgAverage);
                resultsDto.TechDataText = _evaluationService.GetEvaluation("TECH & DATA", resultsDto.TechDataAverage);

                // Send email
                try
                {
                    await _emailService.SendAssessmentResultsAsync(
                        model.Email,
                        model.Name,
                        model.Company,
                        resultsDto
                    );
                    _logger.LogInformation("Assessment results email sent successfully to {Email} for session {SessionId}", model.Email, sessionId);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send assessment results email to {Email} for session {SessionId}", model.Email, sessionId);
                    // Don't fail the request if email fails, but log it.
                }

                return Ok(new { message = "Contact information submitted successfully." }); // Return success message
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error submitting contact form for session {SessionId}", HttpContext.Session.GetString(SessionIdKey));
                return StatusCode(500, new { error = "An unexpected error occurred while submitting contact information." });
            }
        }
    }
}