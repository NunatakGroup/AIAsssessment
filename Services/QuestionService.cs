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
                    ImagePath = "/images/AI_Wheel_Full.png",
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
                    Chapter = "",
                    ImagePath = "/images/AI_Wheel_Full.png",
                    QuestionText = "Please tell us a bit about your organization",
                    Type = QuestionType.Demographics,
                    OrderIndex = 1,
                    Answers = new List<Answer>()
                },
                 new Question
                {
                    Id = 3,
                    Chapter = "AI APPLICATION AREAS",
                    ImagePath = "/images/AI_Wheel_Q1.png",
                    QuestionText = "We consistently develop new AI-driven solutions for our customers",
                    Type = QuestionType.SingleChoice,
                    OrderIndex = 1,
                    Answers = new List<Answer>
                    {
                        new Answer { Id = 5, AnswerText = "Strongly Agree", Score = 5, Description = "The deployment of AI is already a crucial element of our customer experience" },
                        new Answer { Id = 4, AnswerText = "Agree", Score = 4 },
                        new Answer { Id = 3, AnswerText = "Neutral", Score = 3 },
                        new Answer { Id = 2, AnswerText = "Disagree", Score = 2 },
                        new Answer { Id = 1, AnswerText = "Strongly Disagree", Score = 1, Description = "AI is not integrated into any products or services"}
                    }
                },
                 new Question
                {
                    Id = 4,
                    Chapter = "AI APPLICATION AREAS",
                    ImagePath = "/images/AI_Wheel_Q2.png",
                    QuestionText = "We deploy AI to improve efficiency throughout all internal processes",
                    Type = QuestionType.SingleChoice,
                    OrderIndex = 1,
                    Answers = new List<Answer>
                    {
                        new Answer { Id = 5, AnswerText = "Strongly Agree", Score = 5, Description = "We have automated AI-driven processes accross the value chain" },
                        new Answer { Id = 4, AnswerText = "Agree", Score = 4 },
                        new Answer { Id = 3, AnswerText = "Neutral", Score = 3 },
                        new Answer { Id = 2, AnswerText = "Disagree", Score = 2 },
                        new Answer { Id = 1, AnswerText = "Strongly Disagree", Score = 1, Description = "AI is not integrated into our internal processes" }
                    }
                },
                new Question
                {
                    Id = 5,
                    Chapter = "AI APPLICATION AREAS",
                    ImagePath = "/images/AI_Wheel_Q3.png",
                    QuestionText = "We have the capability to assess the impact of AI applications and consistently monitor their performance",
                    Type = QuestionType.SingleChoice,
                    OrderIndex = 1,
                    Answers = new List<Answer>
                    {
                        new Answer { Id = 5, AnswerText = "Strongly Agree", Score = 5, Description = "We continuously measure the impact and adjust our strategy accordingly" },
                        new Answer { Id = 4, AnswerText = "Agree", Score = 4 },
                        new Answer { Id = 3, AnswerText = "Neutral", Score = 3 },
                        new Answer { Id = 2, AnswerText = "Disagree", Score = 2 },
                        new Answer { Id = 1, AnswerText = "Strongly Disagree", Score = 1, Description = "We have no mechanism in place to measure the impact of AI applications" }
                    }
                },
                new Question
                {
                    Id = 6,
                    Chapter = "ORGANIZATION & PEOPLE",
                    ImagePath = "/images/AI_Wheel_Q4.png",
                    QuestionText = "Our organization has clearly established structures, decision-making processes, and guidelines for responsible AI deployment",
                    Type = QuestionType.SingleChoice,
                    OrderIndex = 1,
                    Answers = new List<Answer>
                    {
                        new Answer { Id = 5, AnswerText = "Strongly Agree", Score = 5, Description = "We deploy a comprehensive governance ensuring ethical, compliant, and controlled AI deployment" },
                        new Answer { Id = 4, AnswerText = "Agree", Score = 4 },
                        new Answer { Id = 3, AnswerText = "Neutral", Score = 3 },
                        new Answer { Id = 2, AnswerText = "Disagree", Score = 2 },
                        new Answer { Id = 1, AnswerText = "Strongly Disagree", Score = 1, Description = "We have no AI governance set up in place" }
                    }
                },
                new Question
                {
                    Id = 7,
                    Chapter = "ORGANIZATION & PEOPLE",
                    ImagePath = "/images/AI_Wheel_Q5.png",
                    QuestionText = "Our organization embraces AI innovation and actively promotes a culture of data-driven decision making",
                    Type = QuestionType.SingleChoice,
                    OrderIndex = 1,
                    Answers = new List<Answer>
                    {
                        new Answer { Id = 5, AnswerText = "Strongly Agree", Score = 5, Description = "We have a strong culture of AI innovation with widespread understanding and enthusiasm across all levels" },
                        new Answer { Id = 4, AnswerText = "Agree", Score = 4 },
                        new Answer { Id = 3, AnswerText = "Neutral", Score = 3 },
                        new Answer { Id = 2, AnswerText = "Disagree", Score = 2 },
                        new Answer { Id = 1, AnswerText = "Strongly Disagree", Score = 1, Description = "There is significant resistance to AI adoption and limited awareness of its potential" }
                    }
                },
                new Question
                {
                    Id = 8,
                    Chapter = "ORGANIZATION & PEOPLE",
                    ImagePath = "/images/AI_Wheel_Q6.png",
                    QuestionText = "Our organization has defined the AI competencies required, strategically recruits talent in this field, and provides continuous training to empower employees to effectively use AI",
                    Type = QuestionType.SingleChoice,
                    OrderIndex = 1,
                    Answers = new List<Answer>
                    {
                        new Answer { Id = 5, AnswerText = "Strongly Agree", Score = 5, Description = "We have strong AI capabilities with effective talent acquisition and development programs" },
                        new Answer { Id = 4, AnswerText = "Agree", Score = 4 },
                        new Answer { Id = 3, AnswerText = "Neutral", Score = 3 },
                        new Answer { Id = 2, AnswerText = "Disagree", Score = 2 },
                        new Answer { Id = 1, AnswerText = "Strongly Disagree", Score = 1, Description = "We have critical AI skill gaps with no development strategy" }
                    }
                },
                new Question
                {
                    Id = 9,
                    Chapter = "TECH & DATA",
                    ImagePath = "/images/AI_Wheel_Q7.png",
                    QuestionText = "We deploy the right tools and models to power AI applications and integrate solutions into a coherent ecosystem",
                    Type = QuestionType.SingleChoice,
                    OrderIndex = 1,
                    Answers = new List<Answer>
                    {
                        new Answer { Id = 5, AnswerText = "Strongly Agree", Score = 5, Description = "We deploy state-of-the-art AI infrastructure enabling rapid development and integration into our ecosystem" },
                        new Answer { Id = 4, AnswerText = "Agree", Score = 4 },
                        new Answer { Id = 3, AnswerText = "Neutral", Score = 3 },
                        new Answer { Id = 2, AnswerText = "Disagree", Score = 2 },
                        new Answer { Id = 1, AnswerText = "Strongly Disagree", Score = 1, Description = "We have limited or outdated tools and no platform integration" }
                    }
                },
                new Question
                {
                    Id = 10,
                    Chapter = "TECH & DATA",
                    ImagePath = "/images/AI_Wheel_Q8.png",
                    QuestionText = "We have established a robust data architecture that enables efficient data collection, storage, and access for AI deployment",
                    Type = QuestionType.SingleChoice,
                    OrderIndex = 1,
                    Answers = new List<Answer>
                    {
                        new Answer { Id = 5, AnswerText = "Strongly Agree", Score = 5, Description = "We maintain high-quality, well-structured data with seamless access and integration capabilities for AI development" },
                        new Answer { Id = 4, AnswerText = "Agree", Score = 4 },
                        new Answer { Id = 3, AnswerText = "Neutral", Score = 3 },
                        new Answer { Id = 2, AnswerText = "Disagree", Score = 2 },
                        new Answer { Id = 1, AnswerText = "Strongly Disagree", Score = 1, Description = "Our data is fragmented, poorly organized, and difficult to access for AI applications" }
                    }
                },
                new Question
                {
                    Id = 11,
                    Chapter = "TECH & DATA",
                    ImagePath = "/images/AI_Wheel_Q9.png",
                    QuestionText = "We ensure robust security and privacy protection in the development and deployment of AI solutions",
                    Type = QuestionType.SingleChoice,
                    OrderIndex = 1,
                    Answers = new List<Answer>
                    {
                        new Answer { Id = 5, AnswerText = "Strongly Agree", Score = 5, Description = "We have comprehensive security and privacy controls and guidelines across all new and existing AI initiatives" },
                        new Answer { Id = 4, AnswerText = "Agree", Score = 4 },
                        new Answer { Id = 3, AnswerText = "Neutral", Score = 3 },
                        new Answer { Id = 2, AnswerText = "Disagree", Score = 2 },
                        new Answer { Id = 1, AnswerText = "Strongly Disagree", Score = 1, Description = "No specific protection measures for AI applications are in place" }
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