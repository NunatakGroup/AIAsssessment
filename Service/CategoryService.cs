public class CategoryService
{
    public class CategoryResult
    {
        public string Name { get; set; }
        public double Average { get; set; }
        public string ResultText { get; set; }
    }

    public Dictionary<string, (int[] QuestionIds, Dictionary<double, string> ThresholdTexts)> Categories = 
        new()
        {
            {
                "AI APPLICATION", 
                (
                    QuestionIds: new[] { 2, 3, 4 },
                    ThresholdTexts: new Dictionary<double, string>
                    {
                        { 1.0, "Beginning stage: Your organization is starting to explore AI applications." },
                        { 3.0, "Developing stage: Your organization shows promise in AI adoption." },
                        { 4.5, "Advanced stage: Your organization excels at AI implementation." }
                    }
                )
            },
            {
                "PEOPLE & ORGANIZATION", 
                (
                    QuestionIds: new[] { 5, 6, 7 },
                    ThresholdTexts: new Dictionary<double, string>
                    {
                        { 1.0, "Beginning stage: Your organization is starting to explore AI applications." },
                        { 3.0, "Developing stage: Your organization shows promise in AI adoption." },
                        { 4.5, "Advanced stage: Your organization excels at AI implementation." }
                    }
                )
            },
            {
                "TECH & DATA", 
                (
                    QuestionIds: new[] { 8, 9, 10 },
                    ThresholdTexts: new Dictionary<double, string>
                    {
                        { 1.0, "Beginning stage: Your organization is starting to explore AI applications." },
                        { 3.0, "Developing stage: Your organization shows promise in AI adoption." },
                        { 4.5, "Advanced stage: Your organization excels at AI implementation." }
                    }
                )
            }
        };

    public CategoryResult CalculateCategoryResult(string category, AssessmentResponseEntity responses)
{
    var config = Categories[category];
    var scores = config.QuestionIds
        .Select(id => Convert.ToDouble(typeof(AssessmentResponseEntity)
            .GetProperty($"Question{id}Answer")
            ?.GetValue(responses) ?? 0))
        .ToList();

    var average = scores.Any() ? scores.Average() : 0;
    var resultText = config.ThresholdTexts
        .OrderBy(t => t.Key)
        .LastOrDefault(t => average >= t.Key).Value;

    return new CategoryResult
    {
        Name = category,
        Average = average,
        ResultText = resultText ?? config.ThresholdTexts.First().Value
    };
}
}