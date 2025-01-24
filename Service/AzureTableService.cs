using Azure.Data.Tables;
using System.Text.Json;

namespace AI_Maturity_Assessment.Services
{
    public class AzureTableService
    {
        private readonly TableClient _tableClient;
        private readonly ILogger<AzureTableService> _logger;

        public AzureTableService(ILogger<AzureTableService> logger)
        {
            _logger = logger;
            var connectionString = Environment.GetEnvironmentVariable("AzureStorage")
                ?? throw new InvalidOperationException("Azure connection string not found in .env");
            _tableClient = new TableClient(connectionString, "AssessmentResponses");
        }

        public async Task SaveResponse(string sessionId, int questionId, int answerId)
        {
            try
            {
                var entity = new AssessmentResponseEntity
                {
                    PartitionKey = sessionId,
                    RowKey = questionId.ToString(),
                    QuestionId = questionId,
                    AnswerId = answerId
                };

                await _tableClient.UpsertEntityAsync(entity);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error saving response for session {sessionId}");
                throw;
            }
        }

        public async Task TestConnection() => await _tableClient.CreateIfNotExistsAsync();
    }
}