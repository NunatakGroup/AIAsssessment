public class ResultEvaluationService
{
    private readonly Dictionary<string, Dictionary<double, string>> _categoryEvaluations = new()
    {
        {
            "AI APPLICATION", new Dictionary<double, string>
            {
                { 1.0, "Initial stage of AI application. Focus on products, business models, and process optimization." },
                { 3.0, "Good progress in AI applications across products and processes." },
                { 4.5, "Advanced AI implementation across products, business models, and processes." }
            }
        },
        {
            "PEOPLE & ORGANIZATION", new Dictionary<double, string>
            {
                { 1.0, "Early stage in AI organization. Focus on impact assessment, governance, and skills." },
                { 3.0, "Good organizational AI readiness with established processes." },
                { 4.5, "Mature AI organization with strong governance and skilled workforce." }
            }
        },
        {
            "TECH & DATA", new Dictionary<double, string>
            {
                { 1.0, "Basic technical foundation. Prioritize security, tools, and data infrastructure." },
                { 3.0, "Solid technical setup with good security and data practices." },
                { 4.5, "Advanced technical maturity with state-of-art infrastructure." }
            }
        }
    };

    public string GetEvaluation(string category, double score)
    {
        var thresholds = _categoryEvaluations[category];
        return thresholds
            .OrderBy(t => t.Key)
            .LastOrDefault(t => score >= t.Key)
            .Value ?? thresholds.First().Value;
    }
}