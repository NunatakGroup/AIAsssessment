using Azure;
using Azure.Data.Tables;
using System; // Added for DateTimeOffset if not present elsewhere

// Assuming this file is in your Models folder or similar
namespace AI_Maturity_Assessment.Models // Adjust namespace if needed
{
    public class AssessmentResponseEntity : ITableEntity
    {
        // PartitionKey = SessionId (based on your AzureTableService code)
        public string PartitionKey { get; set; } = string.Empty;

        // RowKey = "1" (based on your AzureTableService code)
        public string RowKey { get; set; } = "1";

        public DateTimeOffset? Timestamp { get; set; }
        public ETag ETag { get; set; }

        // --- Make sure these are present ---
        public string? Name { get; set; }
        public string? Company { get; set; }
        public string? Email { get; set; }
        // ------------------------------------
        public string? BusinessSector { get; set; }
        public string? CompanySize { get; set; }

        // Answer columns
        public int? Question1Answer { get; set; }
        public int? Question2Answer { get; set; }
        public int? Question3Answer { get; set; }
        public int? Question4Answer { get; set; }
        public int? Question5Answer { get; set; }
        public int? Question6Answer { get; set; }
        public int? Question7Answer { get; set; }
        public int? Question8Answer { get; set; }
        public int? Question9Answer { get; set; }
        public int? Question10Answer { get; set; }
        public int? Question11Answer { get; set; }

        // Calculated Averages
        public double? AIApplicationAverage { get; set; }
        public double? PeopleOrgAverage { get; set; }
        public double? TechDataAverage { get; set; }

        // Evaluation Text Properties
        public string? AIApplicationEvaluation { get; set; }
        public string? PeopleOrgEvaluation { get; set; }
        public string? TechDataEvaluation { get; set; }

        public bool? ContactOptIn { get; set; } // Nullable boolean for opt-in status

        // Default constructor needed for table entity materialization
        public AssessmentResponseEntity() { }

        // Convenience constructor using Session ID for PartitionKey
        public AssessmentResponseEntity(string sessionId)
        {
            PartitionKey = sessionId; // SessionId is the PartitionKey in your service
            RowKey = "1";             // RowKey is "1" in your service
        }
    }
}