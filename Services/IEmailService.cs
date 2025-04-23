using System.Threading.Tasks;
using AI_Maturity_Assessment.Models.Assessment;

namespace AI_Maturity_Assessment.Services
{
    public interface IEmailService
    {
        // Existing method to send assessment results to the user
        Task SendAssessmentResultsAsync(string toEmail, string userName, string company, AssessmentResultsDTO results);
        
        // New method to send assessment results to the team with additional user information
        Task SendAssessmentResultsToTeamAsync(
            string teamMemberEmail,
            string userName,
            string userCompany,
            string userEmail,
            string businessSector,
            string companySize,
            AssessmentResultsDTO results);
    }
}