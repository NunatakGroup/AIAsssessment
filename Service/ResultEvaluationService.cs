public class ResultEvaluationService
{
    public string GetEvaluation(string category, double average)
    {
        return category switch
        {
            "AI APPLICATION" => GetAIApplicationEvaluation(average),
            "PEOPLE & ORGANIZATION" => GetPeopleOrgEvaluation(average),
            "TECH & DATA" => GetTechDataEvaluation(average),
            _ => "Category evaluation not available."
        };
    }

    private string GetAIApplicationEvaluation(double average)
    {
        if (average <= 1.0)
            return "Your organization is at the beginning of its AI journey. Focus on identifying potential AI use cases and start with pilot projects.";
        if (average <= 2.0)
            return "Your organization has started implementing AI applications. Consider expanding your AI initiatives and learning from early implementations.";
        if (average <= 3.0)
            return "Your organization shows good progress in AI adoption with several successful applications. Look for opportunities to scale existing solutions.";
        if (average <= 4.0)
            return "Your organization demonstrates advanced AI application capabilities. Focus on innovation and pushing boundaries in AI implementation.";
        return "Your organization is at the forefront of AI application. Continue leading and innovating in the field.";
    }

    private string GetPeopleOrgEvaluation(double average)
    {
        if (average <= 1.0)
            return "Your organization needs to focus on building basic AI awareness and skills among employees.";
        if (average <= 2.0)
            return "Your organization is developing its AI capabilities. Consider investing more in training and organizational alignment.";
        if (average <= 3.0)
            return "Your organization has a good foundation in AI capabilities. Focus on specialized skill development and broader adoption.";
        if (average <= 4.0)
            return "Your organization has strong AI capabilities. Consider developing centers of excellence and knowledge sharing programs.";
        return "Your organization excels in AI organizational capabilities. Focus on maintaining leadership and continuous innovation.";
    }

    private string GetTechDataEvaluation(double average)
    {
        if (average <= 1.0)
            return "Your organization needs to establish basic technical infrastructure for AI implementation.";
        if (average <= 2.0)
            return "Your organization has basic technical capabilities. Focus on improving data quality and infrastructure.";
        if (average <= 3.0)
            return "Your organization has a solid technical foundation. Consider advancing your data architecture and AI tools.";
        if (average <= 4.0)
            return "Your organization has advanced technical capabilities. Focus on optimization and scaling of infrastructure.";
        return "Your organization has exceptional technical maturity. Continue innovating and optimizing your technical infrastructure.";
    }
}