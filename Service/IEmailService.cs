using System.Threading.Tasks;
using AI_Maturity_Assessment.Models.Assessment;

namespace AI_Maturity_Assessment.Services
{
    public interface IEmailService
    {
        /// <summary>
        /// Sends assessment results to the specified recipient
        /// </summary>
        /// <param name="recipientEmail">Email address of the recipient</param>
        /// <param name="recipientName">Name of the recipient</param>
        /// <param name="company">Company name</param>
        /// <param name="results">Assessment results data</param>
        Task SendAssessmentResultsAsync(string recipientEmail, string recipientName, string company, AssessmentResultsDTO results);
    }
}