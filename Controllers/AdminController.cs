using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using AI_Maturity_Assessment.Services; // Assuming AzureTableService is here
using AI_Maturity_Assessment.Models; // Assuming AssessmentResponseEntity is here
using AI_Maturity_Assessment.Models.Admin; // Assuming AdminLoginModel is here
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authentication.JwtBearer; // Needed for JWT scheme constant
using Azure.Data.Tables;
using Azure; // Required for RequestFailedException
using Microsoft.Extensions.Logging; // Ensure Logger is used

namespace AI_Maturity_Assessment.Controllers
{
    [Route("[controller]")]
    [ApiController] // Added ApiController attribute for better API conventions
    public class AdminController : Controller // Consider ControllerBase if not serving Views directly from API actions
    {
        private readonly IConfiguration _configuration;
        // Removed unused _tableService field if connection string is retrieved directly
        // private readonly AzureTableService _tableService;
        private readonly ILogger<AdminController> _logger;
        private readonly string _adminPassword;
        private readonly string _azureConnectionString; // Store connection string once

        public AdminController(
     IConfiguration configuration,
     ILogger<AdminController> logger)
 {
     _configuration = configuration;
     _logger = logger;

     // Get admin password ONLY from Environment Variable
     _adminPassword = Environment.GetEnvironmentVariable("AdminPassword") ?? // Check ENV var
                      throw new InvalidOperationException("Required environment variable 'AdminPassword' is not set."); // Throw if not found

     // Get connection string (prioritize environment variable - this logic is fine)
     _azureConnectionString = Environment.GetEnvironmentVariable("AzureStorage") ??
                              _configuration.GetConnectionString("AzureStorage") ??
                              throw new InvalidOperationException("Azure Storage connection string not found in Environment Variables (AzureStorage) or ConnectionStrings:AzureStorage");
 }

        // If this controller ONLY serves API endpoints and the Admin view is separate,
        // inherit from ControllerBase instead of Controller and remove this View() call.
        // If this Index action serves the main HTML view for the SPA, keep Controller inheritance.
        [HttpGet]
        [AllowAnonymous] // Allow access to the container page/view without auth
        public IActionResult Index()
        {
            // Returns the View (e.g., Admin/Index.cshtml) that hosts the JavaScript
            return View();
        }

        [HttpPost("Authenticate")]
        [AllowAnonymous] // Allow anonymous access to the authentication endpoint
        public IActionResult Authenticate([FromBody] AdminLoginModel loginModel)
        {
            try
            {
                if (loginModel == null || string.IsNullOrWhiteSpace(loginModel.Password))
                {
                    _logger.LogWarning("Authentication attempt with missing password.");
                    return BadRequest("Password is required.");
                }

                // Verify password
                if (loginModel.Password != _adminPassword)
                {
                    _logger.LogWarning("Failed login attempt to admin panel.");
                    return Unauthorized("Invalid password."); // Use 401 Unauthorized
                }

                // Generate JWT token
                var token = GenerateJwtToken();

                _logger.LogInformation("Successful admin login.");
                return Ok(new { token }); // Use Ok() for 200 status with JSON body

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during admin authentication.");
                return StatusCode(500, "An internal error occurred during authentication.");
            }
        }

        [HttpGet("GetAllAssessments")]
        // Protect this endpoint - requires a valid JWT token
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Admin")]
        public async Task<IActionResult> GetAllAssessments()
        {
            try
            {
                var assessments = await GetAllAssessmentResponses();
                // Log count only if needed for debugging, can be verbose
                // _logger.LogInformation($"Retrieved {assessments.Count} assessments from table.");

                // Logging first entry might expose data, remove if not needed for debug
                // if (assessments.Count > 0)
                // {
                //     var firstAssessment = assessments[0];
                //     _logger.LogInformation($"First Assessment PK: {firstAssessment.PartitionKey}, RK: {firstAssessment.RowKey}");
                // }

                return Ok(assessments); // Return data with 200 OK
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving assessment data.");
                return StatusCode(500, "An error occurred while retrieving assessment data.");
            }
        }

        // --- NEW DELETE ENDPOINT ---
        [HttpDelete("DeleteAssessment/{partitionKey}")]
        // Protect this endpoint - requires a valid Admin JWT token
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Admin")]
        public async Task<IActionResult> DeleteAssessment(string partitionKey)
        {
            // 1. Validate Input
            if (string.IsNullOrWhiteSpace(partitionKey))
            {
                _logger.LogWarning("Delete attempt with missing PartitionKey.");
                return BadRequest("PartitionKey is required."); // 400 Bad Request
            }

            // 2. Define RowKey (as confirmed by user)
            const string rowKey = "1"; // Use const as it's fixed

            _logger.LogInformation("Attempting delete for PK: {PartitionKey}, RK: {RowKey}", partitionKey, rowKey);

            try
            {
                // 3. Get Table Client
                var tableClient = new TableClient(_azureConnectionString, "AssessmentResponses"); // Ensure table name is correct

                // 4. Attempt Deletion using PartitionKey AND RowKey
            // Use ETag.All to match any ETag (bypass concurrency check)
            Response response = await tableClient.DeleteEntityAsync(partitionKey, rowKey, ETag.All); // <-- Corrected ETag

            // Check response status (DeleteEntityAsync throws on 404 by default, but explicit check is safe)
             if (response.Status >= 200 && response.Status < 300) // Check for success range (e.g., 204 No Content)
             {
                _logger.LogInformation("Successfully deleted entity PK: {PartitionKey}, RK: {RowKey}. Status: {Status}", partitionKey, rowKey, response.Status);
                return NoContent(); // HTTP 204 No Content is standard for successful DELETE with no body
             }
                 else
                 {
                    // This case might be rare if exception handling below works, but good practice
                     _logger.LogWarning("Delete operation returned non-success status: {Status}. PK: {PartitionKey}, RK: {RowKey}", response.Status, partitionKey, rowKey);
                     return StatusCode(response.Status, $"Deletion failed with status {response.Status}.");
                 }
            }
            // 5. Handle Specific Errors (e.g., Not Found)
            catch (RequestFailedException ex) when (ex.Status == 404)
            {
                _logger.LogWarning("Entity not found during delete attempt. PK: {PartitionKey}, RK: {RowKey}", partitionKey, rowKey);
                // Return 404 Not Found to the client
                return NotFound($"Entry with ID {partitionKey} (RowKey {rowKey}) not found.");
            }
            // 6. Handle General Errors
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting assessment entry with PK: {PartitionKey}, RK: {RowKey}", partitionKey, rowKey);
                // Return 500 Internal Server Error
                return StatusCode(500, "An internal server error occurred during deletion.");
            }
        }
        // --- END NEW DELETE ENDPOINT ---


        /// <summary>
        /// Retrieves all assessment response entities from Azure Table Storage.
        /// </summary>
        /// <returns>A list of AssessmentResponseEntity objects.</returns>
        private async Task<List<AssessmentResponseEntity>> GetAllAssessmentResponses()
        {
            try
            {
                // Log connection string carefully in production
                // _logger.LogInformation($"Using connection string starting with: {_azureConnectionString?.Substring(0, Math.Min(_azureConnectionString.Length, 20))}...");

                var tableClient = new TableClient(_azureConnectionString, "AssessmentResponses"); // Ensure table name is correct

                // Asynchronously query all entities. Consider using Select for large datasets if only few properties needed.
                var allEntities = new List<AssessmentResponseEntity>();
                await foreach (var entity in tableClient.QueryAsync<AssessmentResponseEntity>())
                {
                    allEntities.Add(entity);
                }

                _logger.LogInformation($"Retrieved {allEntities.Count} entities from AssessmentResponses table.");

                // Logging sample entity removed for cleaner production logs
                // var firstEntity = allEntities.FirstOrDefault();
                // if (firstEntity != null) _logger.LogInformation($"Sample PK: {firstEntity.PartitionKey}, RK: {firstEntity.RowKey}");
                // else _logger.LogWarning("No entities found in AssessmentResponses table.");

                return allEntities;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving assessment responses from Azure Table Storage.");
                // Re-throw to be caught by the calling action method for consistent error response
                throw;
            }
        }

        /// <summary>
        /// Generates a JWT token for admin authentication.
        /// </summary>
        /// <returns>A JWT token string.</returns>
        private string GenerateJwtToken()
        {
            var jwtKey = _configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not configured in Jwt:Key");
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                // Standard claims
                new Claim(JwtRegisteredClaimNames.Sub, "admin_user"), // Subject identifier
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()), // Unique token ID
                new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64), // Issued at time

                // Custom claims (Role needed for [Authorize(Roles="Admin")])
                new Claim(ClaimTypes.Role, "Admin")
                // Add other claims if needed, e.g., NameIdentifier
            };

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"], // Optional: Validate issuer if configured
                audience: _configuration["Jwt:Audience"], // Optional: Validate audience if configured
                claims: claims,
                expires: DateTime.UtcNow.AddHours(2), // Use UtcNow for consistency
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        // ValidateToken method is not typically needed within the controller if using standard [Authorize] attribute.
        // The Authentication middleware handles validation. Removed unless explicitly needed elsewhere.
        // private bool ValidateToken(string token) { ... }
    }
}