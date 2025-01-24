using Microsoft.AspNetCore.Mvc;
using AI_Maturity_Assessment.Services;
using AI_Maturity_Assessment.Models;

public class HomeController : Controller
{
    private readonly IQuestionService _questionService;

    public HomeController(IQuestionService questionService)
    {
        _questionService = questionService;
    }

    public IActionResult Index() => View();
    public IActionResult Assessment() => View();
    public IActionResult Results() => View();

    [HttpGet]
    public IActionResult GetQuestion(int id) => 
        Json(_questionService.GetQuestion(id) ?? (object)NotFound());

    public IActionResult GetTotalQuestions() => 
        Json(_questionService.GetTotalQuestionCount());
}