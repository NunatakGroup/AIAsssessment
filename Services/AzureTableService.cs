using Azure;
using Azure.Data.Tables;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using AI_Maturity_Assessment.Models;

namespace AI_Maturity_Assessment.Services
{
    public class AzureTableService
    {
        private readonly TableClient _responsesTableClient;
        private readonly TableClient _configTableClient;
        private readonly ILogger<AzureTableService> _logger;

        // Constants for table names and keys
        private const string ResponsesTableName = "AssessmentResponses";
        private const string ConfigTableName = "Configuration";
        private const string BenchmarkPartitionKey = "CONFIG";
        private const string BenchmarkRowKey = "BENCHMARKS";
        private const string AssessmentResponseRowKey = "1";

        public AzureTableService(ILogger<AzureTableService> logger, IConfiguration configuration)
        {
            _logger = logger;
            var connectionString = Environment.GetEnvironmentVariable("AzureStorage") ??
                                   configuration?.GetConnectionString("AzureStorage") ??
                                   throw new InvalidOperationException("Azure Storage connection string not found in Environment Variables (AzureStorage) or app configuration.");

            _responsesTableClient = new TableClient(connectionString, ResponsesTableName);
            _responsesTableClient.CreateIfNotExists();
            
            _configTableClient = new TableClient(connectionString, ConfigTableName);
            _configTableClient.CreateIfNotExists();
            
            _logger.LogInformation("Azure Table Service initialized with tables: {ResponsesTable}, {ConfigTable}", 
                ResponsesTableName, ConfigTableName);
        }

        // --- Methods for Assessment Responses ---

        public async Task<AssessmentResponseEntity?> GetResponses(string sessionId)
        {
            try
            {
                // Only log at Debug level for routine operations
                _logger.LogDebug("Getting entity PK={SessionId}, RK={RowKey}", sessionId, AssessmentResponseRowKey);
                Response<AssessmentResponseEntity> response = await _responsesTableClient.GetEntityAsync<AssessmentResponseEntity>(sessionId, AssessmentResponseRowKey);
                return response.Value;
            }
            catch (RequestFailedException ex) when (ex.Status == 404)
            {
                _logger.LogDebug("Entity not found PK={SessionId}", sessionId);
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting responses for PK={SessionId}", sessionId);
                throw;
            }
        }

        public async Task SaveResponse(string sessionId, int questionId, int answerId)
        {
            try
            {
                var entity = await GetOrCreateEntity(sessionId);

                var propertyName = $"Question{questionId}Answer";
                var propertyInfo = typeof(AssessmentResponseEntity).GetProperty(propertyName);

                if (propertyInfo != null && propertyInfo.CanWrite)
                {
                    propertyInfo.SetValue(entity, answerId);
                    await _responsesTableClient.UpsertEntityAsync(entity, TableUpdateMode.Merge);
                    _logger.LogDebug("Saved response for PK={SessionId}, Q={QuestionId}", sessionId, questionId);
                }
                else
                {
                     _logger.LogWarning("Property '{PropertyName}' not found or not writable", propertyName);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving response for PK={SessionId}, Q={QuestionId}", sessionId, questionId);
                throw;
            }
        }

        public async Task SaveContactInfo(string sessionId, string name, string company, string email, bool? optInStatus = null)
        {
             try
             {
                var entity = await GetOrCreateEntity(sessionId);
                entity.Name = name;
                entity.Company = company;
                entity.Email = email;
                
                if (optInStatus.HasValue)
                {
                    entity.ContactOptIn = optInStatus.Value;
                }

                await _responsesTableClient.UpsertEntityAsync(entity, TableUpdateMode.Merge);
                _logger.LogInformation("Saved contact info for PK={SessionId}", sessionId);
             }
             catch (Exception ex)
             {
                 _logger.LogError(ex, "Error saving contact info for PK={SessionId}", sessionId);
                 throw;
             }
        }

        public async Task<bool> UpdateContactOptInAsync(string sessionId, bool optInValue)
        {
            try
            {
                var entity = await GetResponses(sessionId);

                if (entity == null)
                {
                    _logger.LogWarning("Cannot update ContactOptIn. Entity not found for PK={SessionId}", sessionId);
                    return false;
                }

                entity.ContactOptIn = optInValue;
                await _responsesTableClient.UpsertEntityAsync(entity, TableUpdateMode.Merge);
                _logger.LogInformation("Updated ContactOptIn={OptInValue} for PK={SessionId}", optInValue, sessionId);
                return true;
            }
            catch (RequestFailedException rfex) when (rfex.Status == 404)
            {
                _logger.LogWarning("Entity PK={SessionId} not found during ContactOptIn update", sessionId);
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating ContactOptIn for PK={SessionId}", sessionId);
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
                _logger.LogDebug("Saved demographics for PK={SessionId}", sessionId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving demographics for PK={SessionId}", sessionId);
                throw;
            }
        }

        private async Task<AssessmentResponseEntity> GetOrCreateEntity(string sessionId)
        {
            try
            {
                var response = await _responsesTableClient.GetEntityAsync<AssessmentResponseEntity>(sessionId, AssessmentResponseRowKey);
                return response.Value;
            }
            catch (RequestFailedException ex) when (ex.Status == 404)
            {
                 _logger.LogDebug("Creating new entity for PK={SessionId}", sessionId);
                 return new AssessmentResponseEntity(sessionId);
            }
             catch (Exception ex)
             {
                 _logger.LogError(ex, "Error in GetOrCreateEntity for PK={SessionId}", sessionId);
                 throw;
             }
        }

        public async Task UpdateEntity(AssessmentResponseEntity entity)
        {
             try
             {
                if (entity == null) throw new ArgumentNullException(nameof(entity));
                
                await _responsesTableClient.UpdateEntityAsync(entity, entity.ETag, TableUpdateMode.Replace);
                _logger.LogDebug("Updated entity PK={PartitionKey}", entity.PartitionKey);
             }
             catch (RequestFailedException ex) when (ex.Status == 412)
             {
                 _logger.LogWarning("ETag mismatch during update for PK={PartitionKey}", entity?.PartitionKey ?? "N/A");
                 throw;
             }
             catch (Exception ex)
             {
                 _logger.LogError(ex, "Error updating entity PK={PartitionKey}", entity?.PartitionKey ?? "N/A");
                 throw;
             }
        }

        public async Task UpsertEntityAsync(AssessmentResponseEntity entity)
        {
            try
            {
                if (entity == null) throw new ArgumentNullException(nameof(entity));
                if (string.IsNullOrEmpty(entity.PartitionKey) || string.IsNullOrEmpty(entity.RowKey))
                {
                    throw new ArgumentException("Entity must have PartitionKey and RowKey set.");
                }

                await _responsesTableClient.UpsertEntityAsync(entity, TableUpdateMode.Merge);
                _logger.LogDebug("Upserted entity PK={PartitionKey}", entity.PartitionKey);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error upserting entity PK={PartitionKey}", entity?.PartitionKey ?? "N/A");
                throw;
            }
        }

        public async Task<List<AssessmentResponseEntity>> GetAllAssessmentResponses()
        {
            var allEntities = new List<AssessmentResponseEntity>();
            _logger.LogInformation("Querying all entities from table '{TableName}' where RowKey='{RowKey}'", ResponsesTableName, AssessmentResponseRowKey);
            try
            {
                // Use more efficient async enumeration pattern
                await foreach (var entity in _responsesTableClient.QueryAsync<AssessmentResponseEntity>(filter: $"RowKey eq '{AssessmentResponseRowKey}'"))
                {
                    allEntities.Add(entity);
                }
                _logger.LogDebug("Retrieved {Count} assessment entities", allEntities.Count);
            }
            catch (Exception ex)
            {
                 _logger.LogError(ex, "Error retrieving all assessment responses");
                 throw;
            }
            return allEntities;
        }

        public async Task<bool> DeleteAssessmentResponseAsync(string partitionKey, string rowKey)
        {
            try
            {
                Response response = await _responsesTableClient.DeleteEntityAsync(partitionKey, rowKey, ETag.All);
                _logger.LogInformation("Deleted entity PK={PartitionKey}", partitionKey);
                return response.Status >= 200 && response.Status < 300;
            }
            catch (RequestFailedException ex) when (ex.Status == 404)
            {
                _logger.LogWarning("Entity not found during delete attempt PK={PartitionKey}", partitionKey);
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting entity PK={PartitionKey}", partitionKey);
                throw;
            }
        }

        // --- Benchmark Methods ---

        public async Task<BenchmarkEntity?> GetBenchmarks()
        {
            try
            {
                Response<BenchmarkEntity> response = await _configTableClient.GetEntityAsync<BenchmarkEntity>(BenchmarkPartitionKey, BenchmarkRowKey);
                return response.Value;
            }
            catch (RequestFailedException ex) when (ex.Status == 404)
            {
                _logger.LogWarning("Benchmark entity not found in '{TableName}'", ConfigTableName);
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving benchmark entity");
                throw;
            }
        }

        public async Task SaveBenchmarksAsync(BenchmarkEntity benchmarks)
        {
            benchmarks.PartitionKey = BenchmarkPartitionKey;
            benchmarks.RowKey = BenchmarkRowKey;

            try
            {
                await _configTableClient.UpsertEntityAsync(benchmarks, TableUpdateMode.Replace);
                _logger.LogInformation("Saved benchmark entity to '{TableName}'", ConfigTableName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving benchmark entity");
                throw;
            }
        }
    }
}