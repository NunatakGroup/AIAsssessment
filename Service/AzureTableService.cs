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
                ?? throw new InvalidOperationException("Azure connection string not found");
            _tableClient = new TableClient(connectionString, "AssessmentResponses");
        }

        // Add to AzureTableService.cs
        public async Task<AssessmentResponseEntity> GetResponses(string sessionId)
        {
            try
            {
                return await _tableClient.GetEntityAsync<AssessmentResponseEntity>(sessionId, "1");
            }
            catch (Azure.RequestFailedException)
            {
                return null;
            }
        }

        public async Task SaveResponse(string sessionId, int questionId, int answerId)
        {
            try
            {
                var entity = new AssessmentResponseEntity 
                { 
                    PartitionKey = sessionId,
                    RowKey = "1"
                };

                try
                {
                    // Try to get existing entity
                    entity = await _tableClient.GetEntityAsync<AssessmentResponseEntity>(sessionId, "1");
                }
                catch (Azure.RequestFailedException ex) when (ex.Status == 404)
                {
                    // Entity doesn't exist yet - use the new one we created
                }

                var propertyName = $"Question{questionId}Answer";
                typeof(AssessmentResponseEntity).GetProperty(propertyName)?.SetValue(entity, answerId);

                await _tableClient.UpsertEntityAsync(entity);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error saving response for session {sessionId}");
                throw;
            }
        }

        public async Task SaveContactInfo(string sessionId, string name, string company, string email)
        {
            var entity = await GetOrCreateEntity(sessionId);
            entity.Name = name;
            entity.Company = company;
            entity.Email = email;
            await _tableClient.UpsertEntityAsync(entity);
        }

        private async Task<AssessmentResponseEntity> GetOrCreateEntity(string sessionId)
        {
            try
            {
                return await _tableClient.GetEntityAsync<AssessmentResponseEntity>(sessionId, "1");
            }
            catch (Azure.RequestFailedException ex) when (ex.Status == 404)
            {
                return new AssessmentResponseEntity { PartitionKey = sessionId, RowKey = "1" };
            }
        }

        public async Task TestConnection() => await _tableClient.CreateIfNotExistsAsync();

        public async Task UpdateEntity(AssessmentResponseEntity entity)
        {
            await _tableClient.UpdateEntityAsync(entity, entity.ETag);
        }
    }
}
