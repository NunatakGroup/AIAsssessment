using Azure;
using Azure.Data.Tables;
public class AssessmentResponseEntity : ITableEntity
{
    public string PartitionKey { get; set; }  // SessionId
    public string RowKey { get; set; }  
    public int QuestionId { get; set; }
    public int AnswerId { get; set; }
    public DateTimeOffset? Timestamp { get; set; }
    public ETag ETag { get; set; }
}