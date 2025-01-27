using Microsoft.Extensions.Logging;

namespace AI_Maturity_Assessment.Middleware
{
    public class SessionDebugMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<SessionDebugMiddleware> _logger;

        public SessionDebugMiddleware(RequestDelegate next, ILogger<SessionDebugMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var sessionId = context.Session.GetString("AssessmentSessionId");
            _logger.LogInformation(
                "Request Path: {Path}, Method: {Method}, SessionId: {SessionId}, HasSessionCookie: {HasCookie}",
                context.Request.Path,
                context.Request.Method,
                sessionId,
                context.Request.Cookies.ContainsKey(".AspNetCore.Session")
            );

            await _next(context);
        }
    }

    // Extension method
    public static class SessionDebugMiddlewareExtensions
    {
        public static IApplicationBuilder UseSessionDebug(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<SessionDebugMiddleware>();
        }
    }
}