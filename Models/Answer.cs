namespace AI_Maturity_Assessment.Models
{
    public class Answer
    {
        public int Id { get; set; }
        public string AnswerText { get; set; } = string.Empty;
        public int Score { get; set; }
        public string? Description { get; set; }
    }
}