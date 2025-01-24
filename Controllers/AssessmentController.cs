using Microsoft.AspNetCore.Mvc;
using AI_Maturity_Assessment.Services;
using AI_Maturity_Assessment.Models;
using System.Text.Json;



public class AssessmentController : Controller
{
    private readonly IQuestionService _questionService;

    public AssessmentController(IQuestionService questionService)
    {
        _questionService = questionService;
    }

    public IActionResult Index()
    {
        return View();
    }

    [HttpGet]
    public IActionResult GetQuestion(int id)
{
    var question = _questionService.GetQuestion(id);
    if (question == null) return NotFound();
    return Json(question);
}

    [HttpGet]
    public IActionResult GetTotalQuestions()
    {
        return Json(_questionService.GetTotalQuestionCount());
    }

    public IActionResult Results()
    {
        return View();
    }

    [HttpPost]
    public IActionResult SubmitAnswers([FromBody] List<AnswerSubmission> answers)
{
    if (!ModelState.IsValid)
        return BadRequest(ModelState);
        
    return Json(new { redirectUrl = Url.Action("Index", "Results") });
}
}