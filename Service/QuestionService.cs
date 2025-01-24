using AI_Maturity_Assessment.Models;
using System.Collections.Generic;
using System.Linq;

namespace AI_Maturity_Assessment.Services
{
    public class QuestionService : IQuestionService
    {
        private readonly List<Question> _questions;

        public QuestionService()
        {
            _questions = new List<Question>
            {
                new Question
                {
                    Id = 1,
                    Chapter = "AI AMBITION - Planning",
                    ImagePath = "/images/StrategicWheel.png",
                    QuestionText = "We have clearly defined what we want to achieve by leveraging AI",
                    Type = QuestionType.SingleChoice,
                    OrderIndex = 1,
                    Answers = new List<Answer>
                    {
                        new Answer { Id = 1, AnswerText = "Strongly Disagree", Score = 1, Description = "AI is not integrated into our strategic plans" },
                        new Answer { Id = 2, AnswerText = "Disagree", Score = 2 },
                        new Answer { Id = 3, AnswerText = "Somewhat Agree", Score = 3 },
                        new Answer { Id = 4, AnswerText = "Agree", Score = 4 },
                        new Answer { Id = 5, AnswerText = "Strongly Agree", Score = 5, Description = "AI is a core component of our strategic vision" }
                    }
                },
                 new Question
                {
                    Id = 2,
                    Chapter = "AI AMBITION - Planning",
                    ImagePath = "/images/StrategicWheel.png",
                    QuestionText = "We have clearly defined what we want to achieve by leveraging AI",
                    Type = QuestionType.SingleChoice,
                    OrderIndex = 1,
                    Answers = new List<Answer>
                    {
                        new Answer { Id = 1, AnswerText = "Strongly Disagree", Score = 1, Description = "AI is not integrated into our strategic plans" },
                        new Answer { Id = 2, AnswerText = "Disagree", Score = 2 },
                        new Answer { Id = 3, AnswerText = "Somewhat Agree", Score = 3 },
                        new Answer { Id = 4, AnswerText = "Agree", Score = 4 },
                        new Answer { Id = 5, AnswerText = "Strongly Agree", Score = 5, Description = "AI is a core component of our strategic vision" }
                    }
                },
                 new Question
                {
                    Id = 3,
                    Chapter = "AI AMBITION - Planning",
                    ImagePath = "/images/StrategicWheel.png",
                    QuestionText = "We have clearly defined what we want to achieve by leveraging AI",
                    Type = QuestionType.SingleChoice,
                    OrderIndex = 1,
                    Answers = new List<Answer>
                    {
                        new Answer { Id = 1, AnswerText = "Strongly Disagree", Score = 1, Description = "AI is not integrated into our strategic plans" },
                        new Answer { Id = 2, AnswerText = "Disagree", Score = 2 },
                        new Answer { Id = 3, AnswerText = "Somewhat Agree", Score = 3 },
                        new Answer { Id = 4, AnswerText = "Agree", Score = 4 },
                        new Answer { Id = 5, AnswerText = "Strongly Agree", Score = 5, Description = "AI is a core component of our strategic vision" }
                    }
                }
            };
        }

        public Question GetQuestion(int id) => _questions.FirstOrDefault(q => q.Id == id);
        public List<Question> GetAllQuestions() => _questions;
        public int GetTotalQuestionCount() => _questions.Count;
    }
}