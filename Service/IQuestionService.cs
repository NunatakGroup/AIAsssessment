using AI_Maturity_Assessment.Models;
using System.Collections.Generic;

namespace AI_Maturity_Assessment.Services
{
    public interface IQuestionService
    {
        Task<Question> GetQuestion(int id);
        Task<List<Question>> GetAllQuestions();
        Task<int> GetTotalQuestionCount();

    }
}