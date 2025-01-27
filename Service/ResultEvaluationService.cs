public class ResultEvaluationService
{
    public string GetEvaluation(string category)
    {
        switch (category)
        {
            case "AI APPLICATION":
                return "Your organization shows promise in AI adoption with good progress in applications.";
            case "PEOPLE & ORGANIZATION":
                return "Your organization is developing its AI organizational capabilities.";
            case "TECH & DATA":
                return "Your organization has a strong technical foundation for AI.";
            default:
                return "Category evaluation not available.";
        }
    }
}