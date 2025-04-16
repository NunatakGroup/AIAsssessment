namespace AI_Maturity_Assessment.Models
{
    public enum QuestionType {SingleChoice, Demographics}

    public class Question
    {
        public int Id { get; set; }
        public string Chapter { get; set; } = string.Empty;
        public string ImagePath { get; set; } = string.Empty;
        public string QuestionText { get; set; } = string.Empty;
        public QuestionType Type { get; set; }
        public int OrderIndex { get; set; }
        public List<Answer> Answers { get; set; } = new List<Answer>();
    }
}