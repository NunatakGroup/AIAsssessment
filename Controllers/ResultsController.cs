using Microsoft.AspNetCore.Mvc;
using AI_Maturity_Assessment.Services;
using AI_Maturity_Assessment.Models;
using System.ComponentModel.DataAnnotations;

namespace AI_Maturity_Assessment.Controllers
{
    public class ResultsController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        [HttpPost]
        public IActionResult SubmitContact([FromForm] ContactFormModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            
            return Ok();
        }
    }
}