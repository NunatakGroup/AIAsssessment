using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;
using AI_Maturity_Assessment.Services;
using AI_Maturity_Assessment.Models;
using AI_Maturity_Assessment.Models.Assessment;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Http;

namespace AI_Maturity_Assessment.Controllers
{
    // Model used for the simple opt-in request body
    public class ContactOptInModel
    {
        public bool ContactOptIn { get; set; }
    }

    [Route("[controller]")]
    public class ResultsController : Controller
    {
        private readonly AzureTableService _azureTableService;
        private readonly IEmailService _emailService;
        private readonly ILogger<ResultsController> _logger;
        private readonly IOpenAIService _openAIService;
        private const string SessionIdKey = "AssessmentSessionId";
        
        // Add the team notification email addresses as constants
        private const string TEAM_EMAIL_1 = "moritz.wagner@nunatak.com";
        private const string TEAM_EMAIL_2 = "Paolo.caesar@nunatak.com";

        public ResultsController(
            AzureTableService azureTableService,
            IEmailService emailService,
            ILogger<ResultsController> logger,
            IOpenAIService openAIService)
        {
            _azureTableService = azureTableService;
            _emailService = emailService;
            _logger = logger;
            _openAIService = openAIService;
        }

        // Action method for displaying the initial results page
        [HttpGet]
        public IActionResult Index()
        {
            var sessionId = HttpContext.Session.GetString(SessionIdKey);
            _logger.LogInformation("[Results/Index] Accessed with sessionId: {SessionId}", sessionId ?? "NULL");

            if (string.IsNullOrEmpty(sessionId))
            {
                _logger.LogWarning("[Results/Index] Accessed without SessionId. Redirecting to Assessment.");
                return RedirectToAction("Index", "Assessment");
            }

            var viewModel = new AILabViewModel
            {
                Contacts = GetAILabContacts()
            };

            return View(viewModel);
        }

        // API endpoint called by JavaScript to fetch detailed result data
        [HttpGet]
        [Route("GetResults")]
        public async Task<IActionResult> GetResults()
        {
            var sessionId = HttpContext.Session.GetString(SessionIdKey);
            _logger.LogInformation("[GetResults] API called with sessionId: {SessionId}", sessionId ?? "NULL");

            if (string.IsNullOrEmpty(sessionId))
            {
                 _logger.LogWarning("[GetResults] No session found in HttpContext.");
                return BadRequest(new { error = "No session found. Please complete the assessment first." });
            }

            try
            {
                var responses = await _azureTableService.GetResponses(sessionId);

                if (responses == null)
                {
                     _logger.LogWarning("[GetResults] No responses found in Azure Table for SessionId (PK)={SessionId}", sessionId);
                    return NotFound(new { error = "Assessment results not found for this session." });
                }
                
                BenchmarkEntity benchmarks = await _azureTableService.GetBenchmarks() ?? new BenchmarkEntity();

                double aiAppAvg = responses.AIApplicationAverage ?? CalculateAverage(responses, 3, 5);
                double peopleOrgAvg = responses.PeopleOrgAverage ?? CalculateAverage(responses, 6, 8);
                double techDataAvg = responses.TechDataAverage ?? CalculateAverage(responses, 9, 11);

                bool needsGeneration = string.IsNullOrEmpty(responses.AIApplicationEvaluation) ||
                                       string.IsNullOrEmpty(responses.PeopleOrgEvaluation) ||
                                       string.IsNullOrEmpty(responses.TechDataEvaluation);

                string aiAppResultText = responses.AIApplicationEvaluation ?? "";
                string peopleOrgResultText = responses.PeopleOrgEvaluation ?? "";
                string techDataResultText = responses.TechDataEvaluation ?? "";
                bool evaluationDataUpdated = false;

                 if (responses.AIApplicationAverage == null) { responses.AIApplicationAverage = aiAppAvg; evaluationDataUpdated = true; }
                 if (responses.PeopleOrgAverage == null) { responses.PeopleOrgAverage = peopleOrgAvg; evaluationDataUpdated = true; }
                 if (responses.TechDataAverage == null) { responses.TechDataAverage = techDataAvg; evaluationDataUpdated = true; }

                if (needsGeneration)
                {
                     evaluationDataUpdated = true;

                    Task<string> aiAppTask = _openAIService.GenerateCategoryEvaluationAsync("AI APPLICATION", aiAppAvg, responses);
                    Task<string> peopleOrgTask = _openAIService.GenerateCategoryEvaluationAsync("PEOPLE & ORGANIZATION", peopleOrgAvg, responses);
                    Task<string> techDataTask = _openAIService.GenerateCategoryEvaluationAsync("TECH & DATA", techDataAvg, responses);

                    await Task.WhenAll(aiAppTask, peopleOrgTask, techDataTask);

                    aiAppResultText = responses.AIApplicationEvaluation = aiAppTask.Result;
                    peopleOrgResultText = responses.PeopleOrgEvaluation = peopleOrgTask.Result;
                    techDataResultText = responses.TechDataEvaluation = techDataTask.Result;
                }

                if (evaluationDataUpdated)
                {
                    try
                    {
                        await _azureTableService.UpsertEntityAsync(responses);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "[GetResults] Failed to save updated evaluation data for SessionId {SessionId}.", sessionId);
                    }
                }

                 var userChartData = new[] {
                     responses.Question3Answer ?? 0, responses.Question4Answer ?? 0, responses.Question5Answer ?? 0,
                     responses.Question6Answer ?? 0, responses.Question7Answer ?? 0, responses.Question8Answer ?? 0,
                     responses.Question9Answer ?? 0, responses.Question10Answer ?? 0, responses.Question11Answer ?? 0
                 };
                 var benchmarkChartData = new[] {
                     benchmarks.Q3Benchmark, benchmarks.Q4Benchmark, benchmarks.Q5Benchmark,
                     benchmarks.Q6Benchmark, benchmarks.Q7Benchmark, benchmarks.Q8Benchmark,
                     benchmarks.Q9Benchmark, benchmarks.Q10Benchmark, benchmarks.Q11Benchmark
                 };

                var categoryResults = new[]
                {
                    new { name = "AI APPLICATION", average = aiAppAvg, resultText = aiAppResultText },
                    new { name = "PEOPLE & ORGANIZATION", average = peopleOrgAvg, resultText = peopleOrgResultText },
                    new { name = "TECH & DATA", average = techDataAvg, resultText = techDataResultText }
                };

                var results = new
                {
                    userChartData,
                    benchmarkChartData,
                    categoryResults,
                    ambition = new { score = responses.Question1Answer ?? 0, details = "AI Ambition Score" }
                };

                return Json(results);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[GetResults] Unexpected error processing request for SessionId {SessionId}.", sessionId ?? "N/A");
                return StatusCode(500, new { error = "An unexpected error occurred while retrieving results." });
            }
        }

        // Helper method to calculate the average score for a range of questions
        private double CalculateAverage(AssessmentResponseEntity responses, int startQuestion, int endQuestion)
        {
            var answers = new List<int>();
            for (int i = startQuestion; i <= endQuestion; i++)
            {
                var propInfo = typeof(AssessmentResponseEntity).GetProperty($"Question{i}Answer");
                if (propInfo != null && propInfo.GetValue(responses) is int answerValue)
                {
                    answers.Add(answerValue);
                }
            }
            return answers.Any() ? answers.Average() : 0;
        }

        // Helper method to define the AI Lab contact persons
        private List<ContactPerson> GetAILabContacts()
        {
            return new List<ContactPerson>
            {
                new ContactPerson {
                    Name = "MANUEL HALBING",
                    Role = "AI Lab Managing Director",
                    Email = "manuel.halbing@nunatak.com",
                    ImagePath = "/images/manuel-halbing.jpg"
                },
                new ContactPerson {
                    Name = "LEA KLICK",
                    Role = "AI Lab Transformation Lead",
                    Email = "lea.klick@nunatak.com",
                    ImagePath = "/images/lea-klick.png"
                },
                new ContactPerson {
                    Name = "OLIVER ZINDLER",
                    Role = "AI Lab Strategy Lead",
                    Email = "oliver.zindler@nunatak.com",
                    ImagePath = "/images/oliver-zindler.png"
                },
            };
        }

        // API endpoint called by JavaScript when the contact form is submitted
        [HttpPost]
        [Route("SubmitContact")]
        public async Task<IActionResult> SubmitContact([FromForm] ContactFormModel model)
        {
            var sessionId = HttpContext.Session.GetString(SessionIdKey);
            _logger.LogInformation("[SubmitContact] API called for SessionId {SessionId}", sessionId ?? "NULL");

            if (string.IsNullOrEmpty(sessionId))
            {
                _logger.LogWarning("[SubmitContact] No session found in HttpContext.");
                return BadRequest(new { error = "Your session has expired. Please complete the assessment again." });
            }

            try
            {
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
                    _logger.LogWarning("[SubmitContact] Validation failed: {Errors}", string.Join("; ", errors));
                    return BadRequest(ModelState);
                }

                bool? contactOptIn = null;
                if (Request.Form.TryGetValue("ContactOptIn", out var optInValue) &&
                    bool.TryParse(optInValue, out bool parsedOptIn))
                {
                    contactOptIn = parsedOptIn;
                    _logger.LogInformation("[SubmitContact] Received ContactOptIn={OptInValue} from form data for SessionId {SessionId}", contactOptIn, sessionId);
                }

                var responses = await _azureTableService.GetResponses(sessionId);
                if (responses == null)
                {
                    _logger.LogError("[SubmitContact] Assessment results not found in storage for SessionId {SessionId}. Cannot save contact or send email.", sessionId);
                    return BadRequest(new { error = "Assessment results could not be found. Please try again or contact support." });
                }

                await _azureTableService.SaveContactInfo(sessionId, model.Name, model.Company, model.Email, contactOptIn);

                _logger.LogInformation("[SubmitContact] Preparing email DTO for SessionId {SessionId}", sessionId);
                string fallbackEvalText = "Evaluation currently unavailable.";

                // Prepare the results DTO for email
                var resultsDto = new AssessmentResultsDTO
                {
                    AIApplicationAverage = responses.AIApplicationAverage ?? CalculateAverage(responses, 3, 5),
                    PeopleOrgAverage = responses.PeopleOrgAverage ?? CalculateAverage(responses, 6, 8),
                    TechDataAverage = responses.TechDataAverage ?? CalculateAverage(responses, 9, 11),
                    AIApplicationText = responses.AIApplicationEvaluation ?? fallbackEvalText,
                    PeopleOrgText = responses.PeopleOrgEvaluation ?? fallbackEvalText,
                    TechDataText = responses.TechDataEvaluation ?? fallbackEvalText
                };

                // First, send the assessment results to the user
                try
                {
                    await _emailService.SendAssessmentResultsAsync(model.Email, model.Name, model.Company, resultsDto);
                    _logger.LogInformation("[SubmitContact] Assessment results email sent successfully to {Email} for SessionId {SessionId}", model.Email, sessionId);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "[SubmitContact] Failed to send assessment results email to {Email} for SessionId {SessionId}", model.Email, sessionId);
                }

                // NEW: Send notification email to the team if contact was explicitly requested (default to true if data is missing)
                bool shouldNotifyTeam = contactOptIn ?? true;
                if (shouldNotifyTeam)
                {
                    try
                    {
                        await SendTeamNotificationEmailAsync(responses, model, resultsDto);
                        _logger.LogInformation("[SubmitContact] Team notification email sent successfully for SessionId {SessionId}", sessionId);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "[SubmitContact] Failed to send team notification email for SessionId {SessionId}", sessionId);
                        // Don't fail the request if team notification email fails
                    }
                }

                return Ok(new { 
                    message = "Contact information submitted successfully.",
                    notification = "One of our Data & AI Lab Leads will contact you in the upcoming days" 
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[SubmitContact] Unexpected error processing request for SessionId {SessionId}", sessionId ?? "N/A");
                return StatusCode(500, new { error = "An unexpected error occurred while submitting contact information." });
            }
        }

        // NEW: Method to send notification email to the team
        private async Task SendTeamNotificationEmailAsync(
            AssessmentResponseEntity responses, 
            ContactFormModel contactInfo,
            AssessmentResultsDTO resultsDto)
        {
            // Send to both team members
            var teamEmails = new[] { TEAM_EMAIL_1, TEAM_EMAIL_2 };
            
            foreach (var email in teamEmails)
            {
                try
                {
                    // This uses the same email service but with a different subject
                    await _emailService.SendAssessmentResultsToTeamAsync(
                        email,
                        contactInfo.Name,
                        contactInfo.Company,
                        contactInfo.Email,
                        responses.BusinessSector,
                        responses.CompanySize,
                        resultsDto);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send team notification to {Email}", email);
                    // Continue to next email even if one fails
                }
            }
        }

        // API endpoint called by JavaScript for explicit opt-in update
        [HttpPost]
        [Route("OptInContact")]
        public async Task<IActionResult> OptInContact([FromBody] ContactOptInModel model)
        {
             var sessionId = HttpContext.Session.GetString(SessionIdKey);
             _logger.LogInformation("[OptInContact] API called for SessionId {SessionId} with OptIn={OptInValue}", sessionId ?? "NULL", model?.ContactOptIn);

             if (string.IsNullOrEmpty(sessionId))
             {
                 _logger.LogWarning("[OptInContact] No session found in HttpContext.");
                 return BadRequest(new { error = "Your session has expired. Please complete the assessment again." });
             }

             if (model == null)
             {
                  _logger.LogWarning("[OptInContact] Received null model data for SessionId {SessionId}", sessionId);
                  return BadRequest(new { error = "Invalid request data." });
             }

             try
             {
                 bool success = await _azureTableService.UpdateContactOptInAsync(sessionId, model.ContactOptIn);
                 
                 // If opted in, also try to send the team notification if we have contact info
                 if (success && model.ContactOptIn)
                 {
                     var responses = await _azureTableService.GetResponses(sessionId);
                     if (responses != null && !string.IsNullOrEmpty(responses.Email))
                     {
                         try
                         {
                             var resultsDto = new AssessmentResultsDTO
                             {
                                 AIApplicationAverage = responses.AIApplicationAverage ?? CalculateAverage(responses, 3, 5),
                                 PeopleOrgAverage = responses.PeopleOrgAverage ?? CalculateAverage(responses, 6, 8),
                                 TechDataAverage = responses.TechDataAverage ?? CalculateAverage(responses, 9, 11),
                                 AIApplicationText = responses.AIApplicationEvaluation ?? "Evaluation not available.",
                                 PeopleOrgText = responses.PeopleOrgEvaluation ?? "Evaluation not available.",
                                 TechDataText = responses.TechDataEvaluation ?? "Evaluation not available."
                             };
                             
                             var contactModel = new ContactFormModel
                             {
                                 Name = responses.Name ?? "Unknown",
                                 Company = responses.Company ?? "Unknown",
                                 Email = responses.Email
                             };
                             
                             await SendTeamNotificationEmailAsync(responses, contactModel, resultsDto);
                             _logger.LogInformation("[OptInContact] Team notification email sent for SessionId {SessionId}", sessionId);
                         }
                         catch (Exception ex)
                         {
                             _logger.LogError(ex, "[OptInContact] Failed to send team notification for SessionId {SessionId}", sessionId);
                             // Continue with success response even if notification email fails
                         }
                     }
                     
                     return Ok(new { 
                         message = "Contact preference updated successfully.", 
                         notification = "One of our Data & AI Lab Leads will contact you in the upcoming days" 
                     });
                 }

                 if (success)
                 {
                     return Ok(new { message = "Contact preference updated successfully." });
                 }
                 else
                 {
                     return NotFound(new { error = "Could not update preference. Assessment record not found." });
                 }
             }
             catch (Exception ex)
             {
                 _logger.LogError(ex, "[OptInContact] Unexpected error processing request for SessionId {SessionId}", sessionId);
                 return StatusCode(500, new { error = "An unexpected error occurred while updating contact preference." });
             }
        }
    }

    // Placeholder for the ViewModel used by the Index view
    public class AILabViewModel
    {
       public List<ContactPerson> Contacts { get; set; }
    }
}