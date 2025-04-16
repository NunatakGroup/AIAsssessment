using Azure; // Required for ETag, RequestFailedException
using Azure.Data.Tables;
using Microsoft.Extensions.Configuration; // Required for IConfiguration
using Microsoft.Extensions.Logging; // Required for ILogger
using System; // Required for InvalidOperationException, Exception
using System.Collections.Generic; // Required for List
using System.Threading.Tasks; // Required for Task
using AI_Maturity_Assessment.Models; // Assuming AssessmentResponseEntity and BenchmarkEntity are here

namespace AI_Maturity_Assessment.Services
{
    public class AzureTableService
    {
        private readonly TableClient _responsesTableClient; // Client for assessment responses
        private readonly TableClient _configTableClient;    // Client for configuration data (benchmarks)
        private readonly ILogger<AzureTableService> _logger;

        // Constants for table names and benchmark keys
        private const string ResponsesTableName = "AssessmentResponses";
        private const string ConfigTableName = "Configuration"; // New table name for benchmarks
        private const string BenchmarkPartitionKey = "CONFIG";
        private const string BenchmarkRowKey = "BENCHMARKS";

        public AzureTableService(ILogger<AzureTableService> logger, IConfiguration configuration)
        {
            _logger = logger;
            // Get connection string (prioritize environment variable)
            var connectionString = Environment.GetEnvironmentVariable("AzureStorage") ??
                                   configuration?.GetConnectionString("AzureStorage") ??
                                   throw new InvalidOperationException("Azure Storage connection string not found in Environment Variables (AzureStorage) or app configuration.");

            // Initialize client for the assessment responses table
            _responsesTableClient = new TableClient(connectionString, ResponsesTableName);
            _responsesTableClient.CreateIfNotExists(); // Ensure table exists
            _logger.LogInformation("Table client initialized for table '{TableName}'", ResponsesTableName);

            // --- MODIFICATION START: Initialize client for the new Configuration table ---
            _configTableClient = new TableClient(connectionString, ConfigTableName);
            _configTableClient.CreateIfNotExists(); // Ensure config table exists
            _logger.LogInformation("Table client initialized for table '{TableName}'", ConfigTableName);
            // --- MODIFICATION END ---
        }

        // --- Methods for Assessment Responses (using _responsesTableClient) ---

        public async Task<AssessmentResponseEntity> GetResponses(string sessionId)
        {
            try
            {
                _logger.LogDebug("Attempting to get entity with PK={SessionId}, RK=1 from '{TableName}'", sessionId, ResponsesTableName);
                Response<AssessmentResponseEntity> response = await _responsesTableClient.GetEntityAsync<AssessmentResponseEntity>(sessionId, "1");
                _logger.LogDebug("Successfully retrieved entity for PK={SessionId} from '{TableName}'", sessionId, ResponsesTableName);
                return response.Value;
            }
            catch (RequestFailedException ex) when (ex.Status == 404)
            {
                _logger.LogWarning("Entity not found in '{TableName}' for PK={SessionId}, RK=1.", ResponsesTableName, sessionId);
                return null;
            }
            catch(Exception ex)
            {
                 _logger.LogError(ex, "Error getting responses for session {SessionId} from '{TableName}'", sessionId, ResponsesTableName);
                 throw;
            }
        }

        public async Task SaveResponse(string sessionId, int questionId, int answerId)
        {
            try
            {
                var entity = await GetOrCreateEntity(sessionId); // Uses responses client

                var propertyName = $"Question{questionId}Answer";
                var propertyInfo = typeof(AssessmentResponseEntity).GetProperty(propertyName);

                if (propertyInfo != null && propertyInfo.CanWrite)
                {
                    propertyInfo.SetValue(entity, answerId);
                    await _responsesTableClient.UpsertEntityAsync(entity, TableUpdateMode.Merge);
                    _logger.LogDebug("Upserted response in '{TableName}' for SessionId={SessionId}, Question={QuestionId}", ResponsesTableName, sessionId, questionId);
                }
                else
                {
                     _logger.LogWarning("Property '{PropertyName}' not found or not writable on AssessmentResponseEntity.", propertyName);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving response in '{TableName}' for session {SessionId}, Question {QuestionId}", ResponsesTableName, sessionId, questionId);
                throw;
            }
        }

        public async Task SaveContactInfo(string sessionId, string name, string company, string email)
        {
             try
             {
                var entity = await GetOrCreateEntity(sessionId);
                entity.Name = name;
                entity.Company = company;
                entity.Email = email;
                await _responsesTableClient.UpsertEntityAsync(entity, TableUpdateMode.Merge);
                 _logger.LogInformation("Saved contact info in '{TableName}' for session {SessionId}", ResponsesTableName, sessionId);
             }
             catch (Exception ex)
             {
                 _logger.LogError(ex, "Error saving contact info in '{TableName}' for session {SessionId}", ResponsesTableName, sessionId);
                 throw;
             }
        }

        public async Task SaveDemographics(string sessionId, string businessSector, string companySize)
        {
            try
            {
                var entity = await GetOrCreateEntity(sessionId);
                entity.BusinessSector = businessSector;
                entity.CompanySize = companySize;
                await _responsesTableClient.UpsertEntityAsync(entity, TableUpdateMode.Merge);
                _logger.LogInformation("Saved demographics in '{TableName}' for session {SessionId}", ResponsesTableName, sessionId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving demographics in '{TableName}' for session {SessionId}", ResponsesTableName, sessionId);
                throw;
            }
        }

        private async Task<AssessmentResponseEntity> GetOrCreateEntity(string sessionId)
        {
            try
            {
                var response = await _responsesTableClient.GetEntityAsync<AssessmentResponseEntity>(sessionId, "1");
                return response.Value;
            }
            catch (RequestFailedException ex) when (ex.Status == 404)
            {
                 _logger.LogInformation("Entity not found in '{TableName}' for PK={SessionId}, RK=1. Creating new entity.", ResponsesTableName, sessionId);
                return new AssessmentResponseEntity { PartitionKey = sessionId, RowKey = "1" };
            }
             catch (Exception ex)
             {
                 _logger.LogError(ex, "Error in GetOrCreateEntity for session {SessionId} in '{TableName}'", sessionId, ResponsesTableName);
                 throw;
             }
        }

        public async Task UpdateEntity(AssessmentResponseEntity entity)
        {
             try
             {
                if (entity.ETag == default)
                {
                     _logger.LogWarning("UpdateEntity called without ETag for PK={PartitionKey}, RK={RowKey} in '{TableName}'. Update might fail or overwrite.", entity.PartitionKey, entity.RowKey, ResponsesTableName);
                }
                await _responsesTableClient.UpdateEntityAsync(entity, entity.ETag, TableUpdateMode.Replace);
                 _logger.LogInformation("Updated entity PK={PartitionKey}, RK={RowKey} in '{TableName}'", entity.PartitionKey, entity.RowKey, ResponsesTableName);
             }
             catch (Exception ex)
             {
                 _logger.LogError(ex, "Error updating entity PK={PartitionKey}, RK={RowKey} in '{TableName}'", entity.PartitionKey, entity.RowKey, ResponsesTableName);
                 throw;
             }
        }

        public async Task<List<AssessmentResponseEntity>> GetAllAssessmentResponses()
        {
            var allEntities = new List<AssessmentResponseEntity>();
             _logger.LogInformation("Querying all entities from table '{TableName}'", ResponsesTableName);
            try
            {
                // Only query assessment rows (RowKey '1'), excluding config rows
                await foreach (var entity in _responsesTableClient.QueryAsync<AssessmentResponseEntity>(filter: "RowKey eq '1'"))
                {
                    allEntities.Add(entity);
                }
                 _logger.LogInformation("Retrieved {Count} assessment entities from '{TableName}'.", allEntities.Count, ResponsesTableName);
            }
            catch (Exception ex)
            {
                 _logger.LogError(ex, "Error retrieving all assessment responses from '{TableName}'.", ResponsesTableName);
                 throw;
            }
            return allEntities;
        }

        public async Task<bool> DeleteAssessmentResponseAsync(string partitionKey, string rowKey)
        {
             _logger.LogInformation("Attempting to delete entity PK={PartitionKey}, RK={RowKey} from table '{TableName}'", partitionKey, rowKey, ResponsesTableName);
            try
            {
                 Response response = await _responsesTableClient.DeleteEntityAsync(partitionKey, rowKey, ETag.All);
                 _logger.LogInformation("Delete operation completed with status {Status} for PK={PartitionKey}, RK={RowKey} in '{TableName}'", response.Status, partitionKey, rowKey, ResponsesTableName);
                 return true; // Throws on 404
            }
            catch (RequestFailedException ex) when (ex.Status == 404)
            {
                 _logger.LogWarning("Entity not found during delete attempt in '{TableName}'. PK={PartitionKey}, RK={RowKey}", ResponsesTableName, partitionKey, rowKey);
                 return false;
            }
            catch (Exception ex)
            {
                 _logger.LogError(ex, "Error deleting entity PK={PartitionKey}, RK={RowKey} from '{TableName}'", partitionKey, rowKey, ResponsesTableName);
                 throw;
            }
        }


        // --- NEW/MODIFIED METHODS FOR BENCHMARKS (using _configTableClient) ---

        /// <summary>
        /// Retrieves the benchmark configuration entity from the 'Configuration' table.
        /// Uses fixed PartitionKey "CONFIG" and RowKey "BENCHMARKS".
        /// </summary>
        /// <returns>The BenchmarkEntity or null if not found.</returns>
        public async Task<BenchmarkEntity> GetBenchmarks()
        {
            _logger.LogInformation("Attempting to retrieve benchmark entity (PK={PartitionKey}, RK={RowKey}) from table '{TableName}'", BenchmarkPartitionKey, BenchmarkRowKey, ConfigTableName);
            try
            {
                // --- MODIFICATION: Use the config table client ---
                Response<BenchmarkEntity> response = await _configTableClient.GetEntityAsync<BenchmarkEntity>(BenchmarkPartitionKey, BenchmarkRowKey);
                _logger.LogInformation("Successfully retrieved benchmark entity from '{TableName}'.", ConfigTableName);
                return response.Value;
            }
            catch (RequestFailedException ex) when (ex.Status == 404)
            {
                _logger.LogWarning("Benchmark entity (PK={PartitionKey}, RK={RowKey}) not found in '{TableName}'.", BenchmarkPartitionKey, BenchmarkRowKey, ConfigTableName);
                return null; // Return null if the benchmark entity doesn't exist
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving benchmark entity (PK={PartitionKey}, RK={RowKey}) from '{TableName}'", BenchmarkPartitionKey, BenchmarkRowKey, ConfigTableName);
                throw;
            }
        }

        /// <summary>
        /// Saves (or updates) the benchmark configuration entity in the 'Configuration' table.
        /// Uses fixed PartitionKey "CONFIG" and RowKey "BENCHMARKS".
        /// </summary>
        /// <param name="benchmarks">The BenchmarkEntity containing the values to save.</param>
        public async Task SaveBenchmarksAsync(BenchmarkEntity benchmarks)
        {
            // Ensure the correct keys are set
            benchmarks.PartitionKey = BenchmarkPartitionKey;
            benchmarks.RowKey = BenchmarkRowKey;

            _logger.LogInformation("Attempting to save benchmark entity (PK={PartitionKey}, RK={RowKey}) to table '{TableName}'", BenchmarkPartitionKey, BenchmarkRowKey, ConfigTableName);
            try
            {
                // --- MODIFICATION: Use the config table client ---
                await _configTableClient.UpsertEntityAsync(benchmarks, TableUpdateMode.Replace);
                _logger.LogInformation("Successfully saved benchmark entity to '{TableName}'.", ConfigTableName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving benchmark entity (PK={PartitionKey}, RK={RowKey}) to '{TableName}'", BenchmarkPartitionKey, BenchmarkRowKey, ConfigTableName);
                throw;
            }
        }
        // --- END NEW/MODIFIED METHODS FOR BENCHMARKS ---
    }
}
