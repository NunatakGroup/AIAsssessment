using AI_Maturity_Assessment.Models;
using System.Collections.Generic;

namespace AI_Maturity_Assessment.Services
{
    public interface IQuestionService
    {
        Question GetQuestion(int id);
        List<Question> GetAllQuestions();
        int GetTotalQuestionCount();
    }
}