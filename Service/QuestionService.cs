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
                    Chapter = "AI AMBITION",
                    ImagePath = "/images/StrategicWheel.png",
                    QuestionText = "Currently, we are...",
                    Type = QuestionType.SingleChoice,
                    OrderIndex = 1,
                    Answers = new List<Answer>
                    {
                        new Answer { Id = 1, AnswerText = "...beginning to use AI", Score = 1},
                        new Answer { Id = 2, AnswerText = " ", Score = 2 },
                        new Answer { Id = 3, AnswerText = " ", Score = 3 },
                        new Answer { Id = 4, AnswerText = " ", Score = 4 },
                        new Answer { Id = 5, AnswerText = "...following our ambition to outperform market competitors", Score = 5 }
                    }
                },
                 new Question
                {
                    Id = 2,
                    Chapter = "AI APPLICATION",
                    ImagePath = "/images/StrategicWheel.png",
                    QuestionText = "We consistently leverage AI to advance our existing products and services",
                    Type = QuestionType.SingleChoice,
                    OrderIndex = 1,
                    Answers = new List<Answer>
                    {
                        new Answer { Id = 1, AnswerText = "Strongly Disagree", Score = 1, Description = "AI is not integrated into our strategic plans" },
                        new Answer { Id = 2, AnswerText = "Disagree", Score = 2 },
                        new Answer { Id = 3, AnswerText = "Neutral", Score = 3 },
                        new Answer { Id = 4, AnswerText = "Agree", Score = 4 },
                        new Answer { Id = 5, AnswerText = "Strongly Agree", Score = 5, Description = "AI is a core component of our strategic vision" }
                    }
                },
                 new Question
                {
                    Id = 3,
                    Chapter = "AI APPLICATION",
                    ImagePath = "/images/StrategicWheel.png",
                    QuestionText = "We continuously create new AI-driven Business Models and Revenue Streams",
                    Type = QuestionType.SingleChoice,
                    OrderIndex = 1,
                    Answers = new List<Answer>
                    {
                        new Answer { Id = 1, AnswerText = "Strongly Disagree", Score = 1, Description = "AI is not integrated into our strategic plans" },
                        new Answer { Id = 2, AnswerText = "Disagree", Score = 2 },
                        new Answer { Id = 3, AnswerText = "Neutral", Score = 3 },
                        new Answer { Id = 4, AnswerText = "Agree", Score = 4 },
                        new Answer { Id = 5, AnswerText = "Strongly Agree", Score = 5, Description = "AI is a core component of our strategic vision" }
                    }
                },
                new Question
                {
                    Id = 4,
                    Chapter = "AI APPLICATION",
                    ImagePath = "/images/StrategicWheel.png",
                    QuestionText = "We deploy AI to improve efficiency throughout all internal processes",
                    Type = QuestionType.SingleChoice,
                    OrderIndex = 1,
                    Answers = new List<Answer>
                    {
                        new Answer { Id = 1, AnswerText = "Strongly Disagree", Score = 1, Description = "AI is not integrated into our strategic plans" },
                        new Answer { Id = 2, AnswerText = "Disagree", Score = 2 },
                        new Answer { Id = 3, AnswerText = "Neutral", Score = 3 },
                        new Answer { Id = 4, AnswerText = "Agree", Score = 4 },
                        new Answer { Id = 5, AnswerText = "Strongly Agree", Score = 5, Description = "AI is a core component of our strategic vision" }
                    }
                },
                new Question
                {
                    Id = 5,
                    Chapter = "PEOPLE & ORGANIZATION",
                    ImagePath = "/images/StrategicWheel.png",
                    QuestionText = "We have the capability to assess the impact of AI applications and consistently monitor their performance",
                    Type = QuestionType.SingleChoice,
                    OrderIndex = 1,
                    Answers = new List<Answer>
                    {
                        new Answer { Id = 1, AnswerText = "Strongly Disagree", Score = 1, Description = "AI is not integrated into our strategic plans" },
                        new Answer { Id = 2, AnswerText = "Disagree", Score = 2 },
                        new Answer { Id = 3, AnswerText = "Neutral", Score = 3 },
                        new Answer { Id = 4, AnswerText = "Agree", Score = 4 },
                        new Answer { Id = 5, AnswerText = "Strongly Agree", Score = 5, Description = "AI is a core component of our strategic vision" }
                    }
                },
                new Question
                {
                    Id = 6,
                    Chapter = "PEOPLE & ORGANIZATION",
                    ImagePath = "/images/StrategicWheel.png",
                    QuestionText = "Our organization has clearly established structures, decision-making processes, and guidelines for responsible AI development",
                    Type = QuestionType.SingleChoice,
                    OrderIndex = 1,
                    Answers = new List<Answer>
                    {
                        new Answer { Id = 1, AnswerText = "Strongly Disagree", Score = 1, Description = "AI is not integrated into our strategic plans" },
                        new Answer { Id = 2, AnswerText = "Disagree", Score = 2 },
                        new Answer { Id = 3, AnswerText = "Neutral", Score = 3 },
                        new Answer { Id = 4, AnswerText = "Agree", Score = 4 },
                        new Answer { Id = 5, AnswerText = "Strongly Agree", Score = 5, Description = "AI is a core component of our strategic vision" }
                    }
                },
                new Question
                {
                    Id = 7,
                    Chapter = "PEOPLE & ORGANIZATION",
                    ImagePath = "/images/StrategicWheel.png",
                    QuestionText = "Our organization has clearly defined the competencies required for an AI-driven organization, strategically recruits talent in this field, and provides continuous training to empower employees to effectively use AI",
                    Type = QuestionType.SingleChoice,
                    OrderIndex = 1,
                    Answers = new List<Answer>
                    {
                        new Answer { Id = 1, AnswerText = "Strongly Disagree", Score = 1, Description = "AI is not integrated into our strategic plans" },
                        new Answer { Id = 2, AnswerText = "Disagree", Score = 2 },
                        new Answer { Id = 3, AnswerText = "Neutral", Score = 3 },
                        new Answer { Id = 4, AnswerText = "Agree", Score = 4 },
                        new Answer { Id = 5, AnswerText = "Strongly Agree", Score = 5, Description = "AI is a core component of our strategic vision" }
                    }
                },
                new Question
                {
                    Id = 8,
                    Chapter = "TECH & DATA",
                    ImagePath = "/images/StrategicWheel.png",
                    QuestionText = "We ensure robust security and privacy protection in the development and deployment of AI solutions",
                    Type = QuestionType.SingleChoice,
                    OrderIndex = 1,
                    Answers = new List<Answer>
                    {
                        new Answer { Id = 1, AnswerText = "Strongly Disagree", Score = 1, Description = "AI is not integrated into our strategic plans" },
                        new Answer { Id = 2, AnswerText = "Disagree", Score = 2 },
                        new Answer { Id = 3, AnswerText = "Neutral", Score = 3 },
                        new Answer { Id = 4, AnswerText = "Agree", Score = 4 },
                        new Answer { Id = 5, AnswerText = "Strongly Agree", Score = 5, Description = "AI is a core component of our strategic vision" }
                    }
                },
                new Question
                {
                    Id = 9,
                    Chapter = "TECH & DATA",
                    ImagePath = "/images/StrategicWheel.png",
                    QuestionText = "We deploy the right tools and models to power AI applications and integrate solutions into a coherent ecosystem",
                    Type = QuestionType.SingleChoice,
                    OrderIndex = 1,
                    Answers = new List<Answer>
                    {
                        new Answer { Id = 1, AnswerText = "Strongly Disagree", Score = 1, Description = "AI is not integrated into our strategic plans" },
                        new Answer { Id = 2, AnswerText = "Disagree", Score = 2 },
                        new Answer { Id = 3, AnswerText = "Neutral", Score = 3 },
                        new Answer { Id = 4, AnswerText = "Agree", Score = 4 },
                        new Answer { Id = 5, AnswerText = "Strongly Agree", Score = 5, Description = "AI is a core component of our strategic vision" }
                    }
                },
                new Question
                {
                    Id = 10,
                    Chapter = "TECH & DATA",
                    ImagePath = "/images/StrategicWheel.png",
                    QuestionText = "We have an effective data strategy in place and provide sufficient data to fully leverage the power of our AI applications",
                    Type = QuestionType.SingleChoice,
                    OrderIndex = 1,
                    Answers = new List<Answer>
                    {
                        new Answer { Id = 1, AnswerText = "Strongly Disagree", Score = 1, Description = "AI is not integrated into our strategic plans" },
                        new Answer { Id = 2, AnswerText = "Disagree", Score = 2 },
                        new Answer { Id = 3, AnswerText = "Neutral", Score = 3 },
                        new Answer { Id = 4, AnswerText = "Agree", Score = 4 },
                        new Answer { Id = 5, AnswerText = "Strongly Agree", Score = 5, Description = "AI is a core component of our strategic vision" }
                    }
                }
                
            };
        }

        public async Task<Question> GetQuestion(int id) 
        => await Task.FromResult(_questions.FirstOrDefault(q => q.Id == id));

        public async Task<List<Question>> GetAllQuestions() 
        => await Task.FromResult(_questions);

        public async Task<int> GetTotalQuestionCount() 
        => await Task.FromResult(_questions.Count);
}
}