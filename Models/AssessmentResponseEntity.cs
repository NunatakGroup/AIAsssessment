using Azure;
using Azure.Data.Tables;
public class AssessmentResponseEntity : ITableEntity
{
    public string PartitionKey { get; set; }  // SessionId
    public string RowKey { get; set; } = "1";  // Using fixed RowKey since we'll have one row per session
    public DateTimeOffset? Timestamp { get; set; }
    public ETag ETag { get; set; }
    
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
}