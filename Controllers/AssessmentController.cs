using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AI_Maturity_Assessment.Services;
using AI_Maturity_Assessment.Models;

namespace AI_Maturity_Assessment.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class AssessmentController : Controller
    {
        private readonly ILogger<AssessmentController> _logger;
        private readonly IQuestionService _questionService;
        private readonly AzureTableService _azureTableService;
        private const string SessionIdKey = "AssessmentSessionId";

        public AssessmentController(
            ILogger<AssessmentController> logger,
            IQuestionService questionService,
            AzureTableService azureTableService)
        {
            _logger = logger;
            _questionService = questionService;
            _azureTableService = azureTableService;
        }

        [HttpGet]
        public IActionResult Index() => View();

        [HttpGet("GetQuestion/{id}")]
        public async Task<IActionResult> GetQuestion(int id)
        {
            try
            {
                var question = await _questionService.GetQuestion(id);
                return question == null ? NotFound() : Json(question);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting question {Id}", id);
                return StatusCode(500);
            }
        }

        [HttpGet("GetTotalQuestions")]
        public async Task<IActionResult> GetTotalQuestions()
        {
            try
            {
                var count = await _questionService.GetTotalQuestionCount();
                _logger.LogInformation("Retrieved total questions count: {Count}", count);
                return Json(count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting total questions count");
                return StatusCode(500, "Failed to get questions count");
            }
        }

        [HttpPost("SaveAnswer")]
    public async Task<IActionResult> SaveAnswer([FromBody] AnswerSubmission answer)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid model state in SaveAnswer");
                return BadRequest(ModelState);
            }

            // Get or create session ID
            var sessionId = HttpContext.Session.GetString(SessionIdKey);
            if (string.IsNullOrEmpty(sessionId))
            {
                sessionId = Guid.NewGuid().ToString();
                HttpContext.Session.SetString(SessionIdKey, sessionId);
                _logger.LogInformation("Created new session: {SessionId}", sessionId);
            }

            // Force session to be saved immediately
            await HttpContext.Session.CommitAsync();

            await _azureTableService.SaveResponse(sessionId, answer.QuestionId, answer.AnswerId);
            
            // Return the session ID to the client
            return Ok(new { sessionId });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving answer for question {QuestionId}", answer.QuestionId);
            return StatusCode(500, "Failed to save answer");
        }
    }

    [HttpPost]
    [Route("SaveDemographics")]
    public async Task<IActionResult> SaveDemographics([FromBody] DemographicData data)
    {
        try
        {
            if (string.IsNullOrEmpty(data.SessionId))
            {
                // Generate session ID if not provided
                data.SessionId = Guid.NewGuid().ToString();
            }
            
            // Store demographics in Azure via service
            await _azureTableService.SaveDemographics(
                data.SessionId,
                data.BusinessSector == "Other" ? data.OtherBusinessSector : data.BusinessSector,
                data.CompanySize
            );
            
            // Save session ID in HTTP session
            HttpContext.Session.SetString("AssessmentSessionId", data.SessionId);
            
            return Json(new { success = true, sessionId = data.SessionId });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving demographics");
            return BadRequest(new { error = ex.Message });
        }
    }

        [HttpPost("SubmitAnswers")]
    public async Task<IActionResult> SubmitAnswers([FromBody] List<AnswerSubmission> answers)
    {
        var sessionId = HttpContext.Session.GetString(SessionIdKey);
        _logger.LogInformation("SubmitAnswers - Current SessionId: {SessionId}", sessionId);

        if (string.IsNullOrEmpty(sessionId))
        {
            // Try to get session ID from answers
            sessionId = answers.FirstOrDefault()?.SessionId;
            if (!string.IsNullOrEmpty(sessionId))
            {
                HttpContext.Session.SetString(SessionIdKey, sessionId);
                await HttpContext.Session.CommitAsync();
            }
            else
            {
                _logger.LogWarning("No session found during SubmitAnswers");
                return BadRequest(new { error = "No session found. Please start the assessment again." });
            }
        }

            try
            {
                if (!ModelState.IsValid)
                {
                    _logger.LogWarning("Invalid model state in SubmitAnswers");
                    return BadRequest(ModelState);
                }

                foreach (var answer in answers)
                {
                    await _azureTableService.SaveResponse(sessionId, answer.QuestionId, answer.AnswerId);
                }

                var responses = await _azureTableService.GetResponses(sessionId);
                if (responses == null)
                {
                    _logger.LogError("No responses found for session {SessionId}", sessionId);
                    return BadRequest(new { error = "No responses found" });
                }

                responses.AIApplicationAverage = CalculateAverage(responses, new[] { 3, 4, 5 });
                responses.PeopleOrgAverage = CalculateAverage(responses, new[] { 6, 7, 8 });
                responses.TechDataAverage = CalculateAverage(responses, new[] { 9, 10, 11 });

                await _azureTableService.UpdateEntity(responses);
                
                return Json(new { redirectUrl = "/Results" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in SubmitAnswers for session {SessionId}", sessionId);
                return BadRequest(new { error = ex.Message });
            }
        }

        private double CalculateAverage(AssessmentResponseEntity responses, int[] questionIds)
        {
            try
            {
                var scores = questionIds
                    .Select(id => GetQuestionScore(responses, id))
                    .Where(score => score.HasValue)
                    .Select(score => score.Value)
                    .ToList();

                return scores.Any() ? scores.Average() : 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calculating average for questions {Questions}", 
                    string.Join(", ", questionIds));
                throw;
            }
        }

        private int? GetQuestionScore(AssessmentResponseEntity responses, int id)
        {
            return id switch
            {
                3 => responses.Question3Answer,
                4 => responses.Question4Answer,
                5 => responses.Question5Answer,
                6 => responses.Question6Answer,
                7 => responses.Question7Answer,
                8 => responses.Question8Answer,
                9 => responses.Question9Answer,
                10 => responses.Question10Answer,
                11 => responses.Question11Answer,
                _ => null
            };
        }
    }
}