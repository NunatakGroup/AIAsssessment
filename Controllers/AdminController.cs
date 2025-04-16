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
using AI_Maturity_Assessment.Models; // Assuming AssessmentResponseEntity and BenchmarkEntity are here (or referenced)
using AI_Maturity_Assessment.Models.Admin; // Assuming AdminLoginModel is here
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authentication.JwtBearer; // Needed for JWT scheme constant
using Azure.Data.Tables;
using Azure; // Required for RequestFailedException
using Microsoft.Extensions.Logging; // Ensure Logger is used


namespace AI_Maturity_Assessment.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class AdminController : Controller
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<AdminController> _logger;
        private readonly string _adminPassword;
        private readonly string _azureConnectionString;
        private readonly AzureTableService _azureTableService; // Inject AzureTableService

        public AdminController(
            IConfiguration configuration,
            ILogger<AdminController> logger,
            AzureTableService azureTableService) // Inject AzureTableService
        {
            _configuration = configuration;
            _logger = logger;
            _azureTableService = azureTableService; // Assign injected service

            _adminPassword = Environment.GetEnvironmentVariable("AdminPassword") ??
                             throw new InvalidOperationException("Required environment variable 'AdminPassword' is not set.");

            _azureConnectionString = Environment.GetEnvironmentVariable("AzureStorage") ??
                                     _configuration.GetConnectionString("AzureStorage") ??
                                     throw new InvalidOperationException("Azure Storage connection string not found in Environment Variables (AzureStorage) or ConnectionStrings:AzureStorage");
        }

        [HttpGet]
        [AllowAnonymous]
        public IActionResult Index()
        {
            return View();
        }

        [HttpPost("Authenticate")]
        [AllowAnonymous]
        public IActionResult Authenticate([FromBody] AdminLoginModel loginModel)
        {
            try
            {
                if (loginModel == null || string.IsNullOrWhiteSpace(loginModel.Password))
                {
                    _logger.LogWarning("Authentication attempt with missing password.");
                    return BadRequest("Password is required.");
                }

                if (loginModel.Password != _adminPassword)
                {
                    _logger.LogWarning("Failed login attempt to admin panel.");
                    return Unauthorized("Invalid password.");
                }

                var token = GenerateJwtToken();
                _logger.LogInformation("Successful admin login.");
                return Ok(new { token });

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during admin authentication.");
                return StatusCode(500, "An internal error occurred during authentication.");
            }
        }

        [HttpGet("GetAllAssessments")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Admin")]
        public async Task<IActionResult> GetAllAssessments()
        {
            try
            {
                // Use the injected service instance
                var assessments = await _azureTableService.GetAllAssessmentResponses();
                return Ok(assessments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving assessment data.");
                return StatusCode(500, "An error occurred while retrieving assessment data.");
            }
        }

        [HttpDelete("DeleteAssessment/{partitionKey}")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Admin")]
        public async Task<IActionResult> DeleteAssessment(string partitionKey)
        {
            if (string.IsNullOrWhiteSpace(partitionKey))
            {
                _logger.LogWarning("Delete attempt with missing PartitionKey.");
                return BadRequest("PartitionKey is required.");
            }
            const string rowKey = "1";
            _logger.LogInformation("Attempting delete for PK: {PartitionKey}, RK: {RowKey}", partitionKey, rowKey);

            try
            {
                // Use the injected service instance
                bool deleted = await _azureTableService.DeleteAssessmentResponseAsync(partitionKey, rowKey);

                if (deleted)
                {
                    _logger.LogInformation("Successfully deleted entity PK: {PartitionKey}, RK: {RowKey}.", partitionKey, rowKey);
                    return NoContent(); // HTTP 204
                }
                else
                {
                    // This case implies the service method returned false without throwing 404
                     _logger.LogWarning("Delete service method returned false for PK: {PartitionKey}, RK: {RowKey}", partitionKey, rowKey);
                     return NotFound($"Entry with ID {partitionKey} (RowKey {rowKey}) not found or delete failed."); // Return 404 if service indicates not found
                }
            }
            catch (RequestFailedException ex) when (ex.Status == 404) // Catch 404 specifically if service throws it
            {
                _logger.LogWarning("Entity not found during delete attempt (404 Exception). PK: {PartitionKey}, RK: {RowKey}", partitionKey, rowKey);
                return NotFound($"Entry with ID {partitionKey} (RowKey {rowKey}) not found.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting assessment entry with PK: {PartitionKey}, RK: {RowKey}", partitionKey, rowKey);
                return StatusCode(500, "An internal server error occurred during deletion.");
            }
        }


        // --- NEW BENCHMARK ENDPOINTS ---

        [HttpGet("GetBenchmarks")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Admin")]
        public async Task<IActionResult> GetBenchmarks()
        {
            _logger.LogInformation("Attempting to get benchmarks.");
            try
            {
                // Use the injected service instance to get benchmarks
                var benchmarks = await _azureTableService.GetBenchmarks(); // Assumes this method exists in AzureTableService

                if (benchmarks == null)
                {
                    _logger.LogWarning("No benchmark data found in storage. Returning default values.");
                    // Return default values if none are stored yet
                    return Ok(new BenchmarkEntity()); // Return new entity with default values
                }

                _logger.LogInformation("Successfully retrieved benchmarks.");
                return Ok(benchmarks);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving benchmarks.");
                // Return default values on error to avoid breaking the admin UI
                return Ok(new BenchmarkEntity { /* Optionally log error indicator */ });
                // Or return status code 500:
                // return StatusCode(500, "An error occurred while retrieving benchmark data.");
            }
        }

        [HttpPost("SaveBenchmarks")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Admin")]
        public async Task<IActionResult> SaveBenchmarks([FromBody] BenchmarkEntity benchmarkData)
        {
            if (benchmarkData == null)
            {
                return BadRequest("Benchmark data is required.");
            }

             _logger.LogInformation("Attempting to save benchmarks.");

            // Optional: Add server-side validation for values 1-5
            var properties = typeof(BenchmarkEntity).GetProperties()
                                .Where(p => p.Name.EndsWith("Benchmark") && p.PropertyType == typeof(int?));
            foreach (var prop in properties)
            {
                var value = (int?)prop.GetValue(benchmarkData);
                if (value.HasValue && (value < 1 || value > 5))
                {
                     _logger.LogWarning("Invalid benchmark value provided for {PropertyName}: {Value}", prop.Name, value);
                    return BadRequest($"Invalid value for {prop.Name}. Must be between 1 and 5.");
                }
            }


            try
            {
                // Ensure PartitionKey and RowKey are set correctly before saving
                benchmarkData.PartitionKey = "CONFIG";
                benchmarkData.RowKey = "BENCHMARKS";

                // Use the injected service instance to save benchmarks
                await _azureTableService.SaveBenchmarksAsync(benchmarkData); // Assumes this method exists

                _logger.LogInformation("Successfully saved benchmarks.");
                return Ok(new { message = "Benchmarks saved successfully." }); // Return 200 OK
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving benchmarks.");
                return StatusCode(500, "An internal server error occurred while saving benchmark data.");
            }
        }

        // --- END NEW BENCHMARK ENDPOINTS ---


        // GetAllAssessmentResponses is now handled by AzureTableService
        // private async Task<List<AssessmentResponseEntity>> GetAllAssessmentResponses() { ... }

        private string GenerateJwtToken()
        {
            var jwtKey = _configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not configured in Jwt:Key");
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, "admin_user"),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64),
                new Claim(ClaimTypes.Role, "Admin")
            };

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(2),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
