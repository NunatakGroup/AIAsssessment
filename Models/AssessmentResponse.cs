using Azure;
using Azure.Data.Tables;

public class AssessmentResponse : ITableEntity
{
    public string PartitionKey { get; set; } = "AssessmentResponses";
    public string RowKey { get; set; } = Guid.NewGuid().ToString();
    public DateTimeOffset? Timestamp { get; set; } = DateTimeOffset.UtcNow;
    public ETag ETag { get; set; } = ETag.All;
    public Dictionary<int, int> Answers { get; set; } = new();
}