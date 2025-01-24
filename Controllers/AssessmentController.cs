using AI_Maturity_Assessment.Services;
using AI_Maturity_Assessment.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace AI_Maturity_Assessment.Controllers
{
   [Route("Assessment")]
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
           => Json(await _questionService.GetTotalQuestionCount());

       [HttpPost("SaveAnswer")]
       public async Task<IActionResult> SaveAnswer([FromBody] AnswerSubmission answer)
       {
           try
           {
               if (!ModelState.IsValid)
                   return BadRequest(ModelState);

               var sessionId = HttpContext.Session.GetString(SessionIdKey) ?? Guid.NewGuid().ToString();
               HttpContext.Session.SetString(SessionIdKey, sessionId);

               await _azureTableService.SaveResponse(sessionId, answer.QuestionId, answer.AnswerId);
               return Ok(new { sessionId });
           }
           catch (Exception ex)
           {
               _logger.LogError(ex, "Error saving answer for question {QuestionId}", answer.QuestionId);
               return StatusCode(500, "Failed to save answer");
           }
       }

       [HttpPost("SubmitAnswers")]
public async Task<IActionResult> SubmitAnswers([FromBody] List<AnswerSubmission> answers)
{
    try
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var sessionId = HttpContext.Session.GetString(SessionIdKey);
        if (string.IsNullOrEmpty(sessionId))
            return BadRequest("No session found");

        // Save final submission
        foreach (var answer in answers)
        {
            await _azureTableService.SaveResponse(sessionId, answer.QuestionId, answer.AnswerId);
        }

        return Ok(new { redirectUrl = "/Results" });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error submitting assessment");
        return StatusCode(500);
    }
}
   }
}