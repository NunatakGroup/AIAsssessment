using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Caching.Memory;
using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using AI_Maturity_Assessment.Models;

namespace AI_Maturity_Assessment.Services
{
    public interface IOpenAIService
    {
        Task<string> GenerateCategoryEvaluationAsync(string categoryName, double averageScore, AssessmentResponseEntity responses);
    }

    public class OpenAIService : IOpenAIService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;
        private readonly ILogger<OpenAIService> _logger;
        private readonly IMemoryCache _cache;
        private readonly string? _apiKey;
        private readonly string _modelName;
        private readonly TimeSpan _cacheDuration = TimeSpan.FromHours(24); // Cache evaluations for 24 hours

        public OpenAIService(
            IHttpClientFactory httpClientFactory, 
            IConfiguration configuration, 
            ILogger<OpenAIService> logger,
            IMemoryCache cache)
        {
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
            _logger = logger;
            _cache = cache;

            // Get API Key
            _apiKey = Environment.GetEnvironmentVariable("AIAPIKey") ?? _configuration["OpenAI:ApiKey"];

            if (string.IsNullOrEmpty(_apiKey))
            {
                _logger.LogError("OpenAI API Key could not be found");
            }

            // Get Model Name
            _modelName = _configuration["OpenAI:ModelName"] ?? "gpt-3.5-turbo";
        }

        public async Task<string> GenerateCategoryEvaluationAsync(string categoryName, double averageScore, AssessmentResponseEntity responses)
        {
            // Check if API key is available
            if (string.IsNullOrEmpty(_apiKey))
            {
                return $"Automated evaluation generation is currently unavailable for the '{categoryName}' category.";
            }

            // Create cache key based on inputs
            string cacheKey = $"evaluation_{categoryName}_{averageScore}_{GetResponseHash(responses, categoryName)}";

            // Try to get from cache first
            if (_cache.TryGetValue(cacheKey, out string? cachedEvaluation) && !string.IsNullOrEmpty(cachedEvaluation))
            {
                _logger.LogDebug("Cache hit for evaluation of {CategoryName}", categoryName);
                return cachedEvaluation;
            }

            // Build the prompts
            string userPromptContent = BuildPrompt(categoryName, averageScore, responses);
            string systemInstructions = GetSystemInstructions();

            // Create the request body object
            var requestPayload = CreateRequestPayload(userPromptContent, systemInstructions);

            try
            {
                // Send API request with exponential backoff retry logic
                string generatedText = await SendOpenAIRequestWithRetryAsync(requestPayload);
                
                if (!string.IsNullOrEmpty(generatedText))
                {
                    // Cache the successful result
                    _cache.Set(cacheKey, generatedText, _cacheDuration);
                    return generatedText;
                }
                else
                {
                    return GetFallbackEvaluation(categoryName, averageScore);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate evaluation for {CategoryName}", categoryName);
                return GetFallbackEvaluation(categoryName, averageScore);
            }
        }

        private async Task<string> SendOpenAIRequestWithRetryAsync(ResponseApiRequest requestPayload, int maxRetries = 3)
        {
            using var httpClient = _httpClientFactory.CreateClient();
            httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
            
            var requestUrl = "https://api.openai.com/v1/responses";
            int retryCount = 0;
            int retryDelayMs = 1000; // Start with 1 second delay

            while (retryCount <= maxRetries)
            {
                try
                {
                    if (retryCount > 0)
                    {
                        _logger.LogWarning("Retry attempt {RetryCount} for OpenAI API call", retryCount);
                    }

                    HttpResponseMessage httpResponse = await httpClient.PostAsJsonAsync(requestUrl, requestPayload);

                    if (httpResponse.IsSuccessStatusCode)
                    {
                        ResponseApiResponse? apiResponse = await httpResponse.Content.ReadFromJsonAsync<ResponseApiResponse>();

                        string? generatedText = apiResponse?.Output?
                            .FirstOrDefault(o => o.Type == "message")?.Content?
                            .FirstOrDefault(c => c.Type == "output_text")?.Text;

                        if (!string.IsNullOrWhiteSpace(generatedText))
                        {
                            return generatedText.Trim();
                        }
                        
                        _logger.LogWarning("OpenAI response content was empty or in unexpected format");
                        return string.Empty;
                    }
                    else if (IsRetryableStatusCode(httpResponse.StatusCode))
                    {
                        // Retryable error, continue to next iteration
                        _logger.LogWarning("Retryable error from OpenAI API. Status: {StatusCode}", httpResponse.StatusCode);
                    }
                    else 
                    {
                        // Non-retryable error
                        string errorContent = await httpResponse.Content.ReadAsStringAsync();
                        _logger.LogError("OpenAI API request failed. Status: {StatusCode}, Content: {ErrorContent}", 
                            httpResponse.StatusCode, errorContent);
                        return string.Empty;
                    }
                }
                catch (HttpRequestException ex)
                {
                    _logger.LogError(ex, "HTTP request error on attempt {RetryCount}", retryCount);
                    if (retryCount == maxRetries) throw;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Unexpected error on attempt {RetryCount}", retryCount);
                    throw;
                }

                // Apply exponential backoff with jitter
                if (retryCount < maxRetries)
                {
                    var jitter = new Random().Next(0, 500); // 0-500ms of jitter
                    var delay = retryDelayMs + jitter;
                    await Task.Delay(delay);
                    retryDelayMs *= 2; // Double the delay for next attempt
                }
                
                retryCount++;
            }

            return string.Empty;
        }

        private bool IsRetryableStatusCode(System.Net.HttpStatusCode statusCode)
        {
            // Retry on rate limiting (429) and server errors (5xx)
            var code = (int)statusCode;
            return code == 429 || (code >= 500 && code < 600);
        }

        private string GetResponseHash(AssessmentResponseEntity responses, string categoryName)
        {
            // Create a simple hash based on the relevant question responses for the category
            var relevantAnswers = new List<int?>();
            
            switch (categoryName.ToUpperInvariant())
            {
                case "AI APPLICATION":
                    relevantAnswers.Add(responses.Question3Answer);
                    relevantAnswers.Add(responses.Question4Answer);
                    relevantAnswers.Add(responses.Question5Answer);
                    break;
                case "PEOPLE & ORGANIZATION":
                    relevantAnswers.Add(responses.Question6Answer);
                    relevantAnswers.Add(responses.Question7Answer);
                    relevantAnswers.Add(responses.Question8Answer);
                    break;
                case "TECH & DATA":
                    relevantAnswers.Add(responses.Question9Answer);
                    relevantAnswers.Add(responses.Question10Answer);
                    relevantAnswers.Add(responses.Question11Answer);
                    break;
            }
            
            return string.Join("_", relevantAnswers.Select(a => a?.ToString() ?? "null"));
        }

        private string GetSystemInstructions()
        {
            return @"You are an expert AI strategy consultant at Nunatak providing feedback directly to a client based on their organization's AI maturity self-assessment. Scores range from 1 (low maturity) to 5 (high maturity). Analyze the provided
 average score and specific answers within the specified category. Deliver a concise (around 200 words) evaluation in a professional and constructive tone, speaking directly to the client (your organization). Interpret the pattern of scores to identify 
 strengths, weaknesses, or inconsistencies, referring to the question topics (e.g., 'Developing New AI Products/Services') rather than question numbers. Carefully review the 'Potential Nunatak Offerings' listed for the category and select the single offering 
 most directly addressing the primary weakness based on specific scores. Mention this offering as an area where we (Nunatak) could provide valuable support for your organization's future development. Focus on the potential implications these scores suggest for 
 your organization. Do not list or repeat the scores. Do not use formatting symbols such as asterisks (*). Format the output as a single block of text suitable for display on a web results page.";
        }

        private ResponseApiRequest CreateRequestPayload(string userPromptContent, string systemInstructions)
        {
            return new ResponseApiRequest
            {
                Model = _modelName,
                Input = userPromptContent,
                Instructions = systemInstructions,
                Temperature = 0.6,
                MaxOutputTokens = 350
            };
        }

        private string GetFallbackEvaluation(string categoryName, double averageScore)
        {
            var evaluationService = new ResultEvaluationService();
            return evaluationService.GetEvaluation(categoryName, averageScore);
        }

        private string BuildPrompt(string categoryName, double averageScore, AssessmentResponseEntity responses)
{
    var promptBuilder = new StringBuilder();
    promptBuilder.AppendLine($"Analyze the AI maturity for the **{categoryName}** category.");
    promptBuilder.AppendLine($"The organization's average score in this category is **{averageScore:F1} out of 5.0 points.**.");
    promptBuilder.AppendLine("\nHere are the specific answers (scores 1-5) provided by the user for the questions in this category:");

    string GetAnswerString(int? answer) => answer?.ToString() ?? "N/A";

    // Initialize offeringsBuilder BEFORE the switch
    var offeringsBuilder = new StringBuilder();
    // Only add the header if we actually have offerings for the category
    bool hasOfferings = true; // Assume true unless default case is hit

    switch (categoryName.ToUpperInvariant())
    {
        case "AI APPLICATION":
            promptBuilder.AppendLine($"- Q3 (Developing New AI Products/Services): **{GetAnswerString(responses.Question3Answer)}**");
            promptBuilder.AppendLine($"- Q4 (Optimizing Internal Processes with AI): **{GetAnswerString(responses.Question4Answer)}**");
            promptBuilder.AppendLine($"- Q5 (Managing AI Impact & Value): **{GetAnswerString(responses.Question5Answer)}**");

            // Add offerings header
            offeringsBuilder.AppendLine("\nPotential Nunatak Offerings for this Category (Instructions: Based on the scores above, choose the single MOST relevant offering below to mention in your feedback):");
            // Add offerings for this category to offeringsBuilder
            offeringsBuilder.AppendLine($"- **Develop New AI Products and Services:** {GetOfferingDescription("Develop New AI Products and Services")}");
            offeringsBuilder.AppendLine($"- **Optimizing Internal Processes with AI:** {GetOfferingDescription("Optimizing Internal Processes with AI")}");
            offeringsBuilder.AppendLine($"- **Managing AI Impact and Value:** {GetOfferingDescription("Managing AI Impact and Value")}");
            break; // Added missing break

        case "PEOPLE & ORGANIZATION":
            promptBuilder.AppendLine($"- Q6 (AI Governance & Responsibility): **{GetAnswerString(responses.Question6Answer)}**");
            promptBuilder.AppendLine($"- Q7 (Organizational Culture & AI Adoption): **{GetAnswerString(responses.Question7Answer)}**");
            promptBuilder.AppendLine($"- Q8 (AI Skills & Competencies): **{GetAnswerString(responses.Question8Answer)}**");

            // Add offerings header
            offeringsBuilder.AppendLine("\nPotential Nunatak Offerings for this Category (Instructions: Based on the scores above, choose the single MOST relevant offering below to mention in your feedback):");
            // Add offerings for this category to offeringsBuilder
            offeringsBuilder.AppendLine($"- **AI Governance and Responsibility:** {GetOfferingDescription("AI Governance and Responsibility")}");
            offeringsBuilder.AppendLine($"- **Organizational Culture and AI Adoption:** {GetOfferingDescription("Organizational Culture and AI Adoption")}");
            offeringsBuilder.AppendLine($"- **AI Skills and Competencies:** {GetOfferingDescription("AI Skills and Competencies")}");
            break; // Added missing break

        case "DATA AND TOOLS": // Using your category name "Data and Tools"
            promptBuilder.AppendLine($"- Q9 (AI Tools & Platforms): **{GetAnswerString(responses.Question9Answer)}**");
            promptBuilder.AppendLine($"- Q10 (Data Infrastructure & Management for AI): **{GetAnswerString(responses.Question10Answer)}**");
            promptBuilder.AppendLine($"- Q11 (AI Security & Data Privacy): **{GetAnswerString(responses.Question11Answer)}**");

             // Add offerings header
            offeringsBuilder.AppendLine("\nPotential Nunatak Offerings for this Category (Instructions: Based on the scores above, choose the single MOST relevant offering below to mention in your feedback):");
           // Add offerings for this category to offeringsBuilder
            offeringsBuilder.AppendLine($"- **AI Tools & Platforms:** {GetOfferingDescription("AI Tools & Platforms")}");
            offeringsBuilder.AppendLine($"- **Data Infrastructure & Management:** {GetOfferingDescription("Data Infrastructure & Management")}");
            offeringsBuilder.AppendLine($"- **AI Security and Data Privacy:** {GetOfferingDescription("AI Security and Data Privacy")}");
            break; // Added missing break

        default:
             _logger.LogWarning("BuildPrompt called with unknown category name: {CategoryName}", categoryName);
             promptBuilder.AppendLine("- (No specific question scores available for this category name)");
             hasOfferings = false; // No offerings for unknown category
             // Clear offeringsBuilder in case it was initialized with header text mistakenly
             offeringsBuilder.Clear();
             break; // Added missing break
    }

    // Append the offerings list (if any were added)
    if (hasOfferings) {
        promptBuilder.Append(offeringsBuilder.ToString());
    }


    // Replace the original final instruction with the updated one guiding the AI to select an offering
    // Original line: promptBuilder.AppendLine("\nBased on both the average score and these specific answers, please provide your concise evaluation and actionable insights.");
    promptBuilder.AppendLine("\n\nBased on the average score and the specific answers provided above, please provide your concise evaluation and actionable insights. Remember to identify the primary area for improvement based on the scores and suggest how the *single most relevant* Nunatak offering (chosen from the list provided above, if any) could help address it.");

    return promptBuilder.ToString();
}

    // --- NEW HELPER METHOD ---
    // Place this method within the same OpenAIService class
    private string GetOfferingDescription(string offeringName)
    {
        var descriptions = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            // AI Application
            { "Develop New AI Products and Services", "Nunatak helps clients to explore, detail, and assess new AI Use Cases to identify high-potential opportunities for innovative AI products and services." },
            { "Optimizing Internal Processes with AI", "Nunatak helps clients to identify process automation opportunities and implement AI tools and agents to streamline workflows, boost efficiency, and free teams from repetitive tasks." },
            { "Managing AI Impact and Value", "Nunatak helps clients to establish a clear framework for monitoring the tangible business value generated by AI initiatives, ensuring a measurable return on investment." },

            // People and Organization
            { "AI Governance and Responsibility", "Nunatak helps clients to establish a tailored AI governance framework by defining clear responsibilities and ethical guidelines to ensure the responsible deployment of AI across the organization." },
            { "Organizational Culture and AI Adoption", "Nunatak helps clients to foster an AI-ready culture by empowering teams through interactive AI Experience Days and developing customized learning paths to drive adoption across all organizational levels." },
            { "AI Skills and Competencies", "Nunatak helps clients to understand existing capabilities and identify skill gaps, supporting them with capability assessments, leadership alignment, and customized upskilling and reskilling programs." },

            // Data and Tools (Using your exact category name and offerings)
            { "AI Tools & Platforms", "Nunatak helps clients navigate the complex AI tool landscape by first understanding their specific needs and privacy prerequisites, which forms the expert basis for selecting and integrating the most appropriate solutions." },
            { "Data Infrastructure & Management", "Nunatak helps clients to design scalable Data and AI architectures that integrate seamlessly into existing IT setups, providing a strong technological foundation for successful AI applications." },
            { "AI Security and Data Privacy", "Nunatak helps clients ensure the security of their AI systems and the protection of sensitive data throughout their AI journey by comprehensively considering data protection regulations, internal requirements, and stakeholder needs when implementing AI tools." }
        };

        if (descriptions.TryGetValue(offeringName, out var description))
        {
            return description;
        }

        // Log if an offering name is requested but not found (e.g., due to typo)
        _logger.LogWarning("No description found for offering: {OfferingName}", offeringName);
        return $"[Description for '{offeringName}' not found]"; // Return placeholder or empty string
    }

        // Helper Classes for JSON Serialization/Deserialization
        private class ResponseApiRequest
        {
            [JsonPropertyName("model")]
            public string Model { get; set; } = string.Empty;

            [JsonPropertyName("input")]
            public string Input { get; set; } = string.Empty;

            [JsonPropertyName("instructions")]
            public string? Instructions { get; set; }

            [JsonPropertyName("temperature")]
            public double? Temperature { get; set; }

            [JsonPropertyName("max_output_tokens")]
            public int? MaxOutputTokens { get; set; }
        }

        private class ResponseApiResponse
        {
            [JsonPropertyName("id")]
            public string? Id { get; set; }

            [JsonPropertyName("object")]
            public string? ObjectType { get; set; }

            [JsonPropertyName("created_at")]
            public long? CreatedAt { get; set; }

            [JsonPropertyName("status")]
            public string? Status { get; set; }

            [JsonPropertyName("model")]
            public string? Model { get; set; }

            [JsonPropertyName("output")]
            public List<ResponseOutputItem>? Output { get; set; }

            [JsonPropertyName("usage")]
            public ResponseUsage? Usage { get; set; }

            [JsonPropertyName("error")]
            public ResponseError? Error { get; set; }
        }

        private class ResponseOutputItem
        {
            [JsonPropertyName("type")]
            public string? Type { get; set; }

            [JsonPropertyName("id")]
            public string? Id { get; set; }

            [JsonPropertyName("status")]
            public string? Status { get; set; }

            [JsonPropertyName("role")]
            public string? Role { get; set; }

            [JsonPropertyName("content")]
            public List<ResponseContentItem>? Content { get; set; }
        }

        private class ResponseContentItem
        {
            [JsonPropertyName("type")]
            public string? Type { get; set; }

            [JsonPropertyName("text")]
            public string? Text { get; set; }
        }

        private class ResponseUsage
        {
            [JsonPropertyName("input_tokens")]
            public int? InputTokens { get; set; }
            
            [JsonPropertyName("output_tokens")]
            public int? OutputTokens { get; set; }
            
            [JsonPropertyName("total_tokens")]
            public int? TotalTokens { get; set; }
        }

        private class ResponseError
        {
            [JsonPropertyName("code")]
            public string? Code { get; set; }
            
            [JsonPropertyName("message")]
            public string? Message { get; set; }
        }
    }
}