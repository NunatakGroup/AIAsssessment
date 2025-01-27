using System.Collections.Generic;

namespace AI_Maturity_Assessment.Services
{
    public class EvaluationService
    {
        public class CategoryResult
        {
            public string Name { get; set; } = string.Empty;
            public double Average { get; set; }
            public string ResultText { get; set; } = string.Empty;
        }

        public List<CategoryResult> GetEvaluation(string category)
        {
            return new List<CategoryResult>
            {
                new CategoryResult 
                {
                    Name = "AI APPLICATION",
                    Average = 3.5,
                    ResultText = "Your organization shows promise in AI adoption with good progress in applications."
                },
                new CategoryResult 
                {
                    Name = "PEOPLE & ORGANIZATION",
                    Average = 2.8,
                    ResultText = "Your organization is developing its AI organizational capabilities."
                },
                new CategoryResult 
                {
                    Name = "TECH & DATA",
                    Average = 4.0,
                    ResultText = "Your organization has a strong technical foundation for AI."
                }
            };
        }
    }
}