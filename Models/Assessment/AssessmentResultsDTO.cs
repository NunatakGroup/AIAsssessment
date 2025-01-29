namespace AI_Maturity_Assessment.Models.Assessment
{
    public class AssessmentResultsDTO
    {
        public double AIApplicationAverage { get; set; }
        public double PeopleOrgAverage { get; set; }
        public double TechDataAverage { get; set; }
        public string AIApplicationText { get; set; } = string.Empty;
        public string PeopleOrgText { get; set; } = string.Empty;
        public string TechDataText { get; set; } = string.Empty;
    }
}