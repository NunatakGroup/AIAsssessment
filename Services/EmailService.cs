using Azure.Communication.Email;
using Microsoft.Extensions.Configuration;
using System;
using System.Threading.Tasks;
using AI_Maturity_Assessment.Models.Assessment;

namespace AI_Maturity_Assessment.Services
{
    public class EmailService : IEmailService
    {
        private readonly EmailClient _emailClient;
        private readonly string _senderEmail;

        public EmailService(IConfiguration configuration)
        {
            var connectionString = configuration["AzureCommunication:ConnectionString"]
                ?? throw new ArgumentNullException("Azure Communication connection string is missing");
            
            _senderEmail = configuration["AzureCommunication:SenderEmail"]
                ?? throw new ArgumentNullException("Sender email is missing");

            _emailClient = new EmailClient(connectionString);
        }

        public async Task SendAssessmentResultsAsync(string recipientEmail, string recipientName, string company, AssessmentResultsDTO results)
        {
            var subject = $"Your AI Maturity Assessment Results - {company} | Nunatak";
            
            var htmlContent = GenerateEmailContent(recipientName, company, results);

            try
            {
                await _emailClient.SendAsync(
                    Azure.WaitUntil.Completed,
                    senderAddress: _senderEmail,
                    recipientAddress: recipientEmail,
                    subject: subject,
                    htmlContent: htmlContent);
            }
            catch (Exception ex)
            {
                throw new ApplicationException("Failed to send assessment results email", ex);
            }
        }

        public async Task SendAssessmentResultsToTeamAsync(
            string teamMemberEmail,
            string userName,
            string userCompany,
            string userEmail,
            string businessSector,
            string companySize,
            AssessmentResultsDTO results)
        {
            var subject = $"[ACTION REQUIRED] New AI Assessment Contact Request: {userName} from {userCompany}";
            
            var htmlContent = GenerateTeamEmailContent(userName, userCompany, userEmail, businessSector, companySize, results);

            try
            {
                await _emailClient.SendAsync(
                    Azure.WaitUntil.Completed,
                    senderAddress: _senderEmail,
                    recipientAddress: teamMemberEmail,
                    subject: subject,
                    htmlContent: htmlContent);
            }
            catch (Exception ex)
            {
                throw new ApplicationException("Failed to send team notification email", ex);
            }
        }

        private string GenerateTeamEmailContent(
            string userName, 
            string userCompany, 
            string userEmail, 
            string businessSector, 
            string companySize, 
            AssessmentResultsDTO results)
        {
            // Create score bars for visualization - table-based approach for maximum compatibility
            string CreateScoreBar(double score, double maxScore = 5.0)
            {
                int percentage = (int)Math.Round((score / maxScore) * 100);
                string bgColor = "#A0D0CB";
                
                return $@"
                <table width='100%' cellpadding='0' cellspacing='0' border='0' style='margin-top:10px;'>
                    <tr>
                        <td style='background-color:#f2f2f2;border-radius:5px;padding:0;'>
                            <table width='{percentage}%' cellpadding='0' cellspacing='0' border='0' style='border-radius:5px;'>
                                <tr>
                                    <td height='10' bgcolor='{bgColor}' style='border-radius:5px;font-size:0;line-height:0;'>&nbsp;</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>";
            }

            // Format category text with a better structure
            string FormatCategoryText(string text)
            {
                if (string.IsNullOrEmpty(text))
                {
                    return "<p style='margin:10px 0;color:#4a4a4a;line-height:1.7;'>No detailed assessment available for this category.</p>";
                }

                // Split by periods to create multiple paragraphs
                var paragraphs = text.Split('.')
                    .Where(p => !string.IsNullOrWhiteSpace(p))
                    .Select(p => $"<p style='margin:10px 0;color:#4a4a4a;line-height:1.7;'>{p.Trim()}.</p>");

                return string.Join("", paragraphs);
            }

            return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>AI Maturity Assessment - Contact Request</title>
</head>
<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #343E48; margin: 0; padding: 0; background-color: #f5f5f5;'>
    <table width='100%' cellpadding='0' cellspacing='0' border='0' style='background-color: #f5f5f5;'>
        <tr>
            <td align='center' style='padding: 20px 0;'>
                <table width='600' cellpadding='0' cellspacing='0' border='0' style='background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);'>
                    <!-- Header Section -->
                    <tr>
                        <td bgcolor='#A0D0CB' style='padding: 30px 20px; text-align: center;'>
                            <h1 style='margin: 0; font-size: 26px; font-weight: 700; color:rgb(255, 255, 255); letter-spacing: -0.5px;'>New Contact Request</h1>
                            <p style='margin-top: 10px; font-size: 18px; color:rgb(255, 255, 255); font-weight: 500;'>AI Maturity Assessment</p>
                        </td>
                    </tr>
                    
                    <!-- Content Section -->
                    <tr>
                        <td style='padding: 30px 25px;'>
                            <p style='color: #343E48; font-weight: bold; font-size: 16px;'>A user has requested to be contacted about their AI Maturity Assessment results.</p>
                            
                            <!-- User Information Card -->
                            <table width='100%' cellpadding='0' cellspacing='0' border='0' style='margin: 25px 0; background-color: #f9f9f9; border-radius: 8px; border: 1px solid #eaeaea; box-shadow: 0 2px 10px rgba(0,0,0,0.03);'>
                                <tr>
                                    <td style='padding: 20px 25px;'>
                                        <h2 style='margin-top:0; color:#343E48; font-size:20px; border-bottom: 1px solid #eaeaea; padding-bottom: 10px;'>User Information</h2>
                                        
                                        <table width='100%' cellpadding='4' cellspacing='0' border='0'>
                                            <tr>
                                                <td width='150' style='color: #666666; font-weight: 600;'>Name:</td>
                                                <td style='color: #333333; font-weight: 400;'>{userName}</td>
                                            </tr>
                                            <tr>
                                                <td width='150' style='color: #666666; font-weight: 600;'>Company:</td>
                                                <td style='color: #333333; font-weight: 400;'>{userCompany}</td>
                                            </tr>
                                            <tr>
                                                <td width='150' style='color: #666666; font-weight: 600;'>Email:</td>
                                                <td style='color: #333333; font-weight: 400;'>
                                                    <a href='mailto:{userEmail}' style='color:#62B2A9; text-decoration: none;'>{userEmail}</a>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td width='150' style='color: #666666; font-weight: 600;'>Business Sector:</td>
                                                <td style='color: #333333; font-weight: 400;'>{businessSector}</td>
                                            </tr>
                                            <tr>
                                                <td width='150' style='color: #666666; font-weight: 600;'>Company Size:</td>
                                                <td style='color: #333333; font-weight: 400;'>{companySize}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Assessment Summary Card -->
                            <table width='100%' cellpadding='0' cellspacing='0' border='0' style='margin-bottom: 30px; background-color: transparent; border-radius: 8px; border: 1px solid #cccccc; box-shadow: 0 2px 10px rgba(0,0,0,0.03);'>
                                <tr>
                                    <td style='padding: 20px 25px;'>
                                        <h2 style='margin-top:0; color:#343E48; font-size:20px; border-bottom: 1px solid #eaeaea; padding-bottom: 10px;'>Assessment Results</h2>
                                        
                                        <!-- AI Application Score -->
                                        <table width='100%' cellpadding='0' cellspacing='0' border='0' style='margin: 15px 0; background-color: transparent; border: 1px solid #cccccc; border-radius: 6px;'>
                                            <tr>
                                                <td style='padding: 15px;'>
                                                    <table width='100%' cellpadding='0' cellspacing='0' border='0'>
                                                        <tr>
                                                            <td style='font-weight: 600; color: #343E48; font-size: 16px;'>AI Application</td>
                                                            <td align='right' style='font-weight: 700; color: #62B2A9; font-size: 18px;'>{results.AIApplicationAverage:F1}/5.0</td>
                                                        </tr>
                                                    </table>
                                                    {CreateScoreBar(results.AIApplicationAverage)}
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- People & Organization Score -->
                                        <table width='100%' cellpadding='0' cellspacing='0' border='0' style='margin: 15px 0; background-color: transparent; border: 1px solid #cccccc; border-radius: 6px;'>
                                            <tr>
                                                <td style='padding: 15px;'>
                                                    <table width='100%' cellpadding='0' cellspacing='0' border='0'>
                                                        <tr>
                                                            <td style='font-weight: 600; color: #343E48; font-size: 16px;'>People & Organization</td>
                                                            <td align='right' style='font-weight: 700; color: #62B2A9; font-size: 18px;'>{results.PeopleOrgAverage:F1}/5.0</td>
                                                        </tr>
                                                    </table>
                                                    {CreateScoreBar(results.PeopleOrgAverage)}
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- Tech & Data Score -->
                                        <table width='100%' cellpadding='0' cellspacing='0' border='0' style='margin: 15px 0; background-color: transparent; border: 1px solid #cccccc; border-radius: 6px;'>
                                            <tr>
                                                <td style='padding: 15px;'>
                                                    <table width='100%' cellpadding='0' cellspacing='0' border='0'>
                                                        <tr>
                                                            <td style='font-weight: 600; color: #343E48; font-size: 16px;'>Tech & Data</td>
                                                            <td align='right' style='font-weight: 700; color: #62B2A9; font-size: 18px;'>{results.TechDataAverage:F1}/5.0</td>
                                                        </tr>
                                                    </table>
                                                    {CreateScoreBar(results.TechDataAverage)}
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- AI Application Section -->
                            <table width='100%' cellpadding='0' cellspacing='0' border='0' style='margin: 25px 0; background-color: #ffffff; border-radius: 8px; border: 1px solid #eaeaea; box-shadow: 0 2px 10px rgba(0,0,0,0.03);'>
                                <tr>
                                    <td style='padding: 20px 25px;'>
                                        <table width='100%' cellpadding='0' cellspacing='0' border='0'>
                                            <tr>
                                                <td>
                                                    <h3 style='color: #A0D0CB; font-size: 18px; font-weight: 600; margin-top: 0; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #A0D0CB;'>AI Application</h3>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    {FormatCategoryText(results.AIApplicationText)}
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- People & Organization Section -->
                            <table width='100%' cellpadding='0' cellspacing='0' border='0' style='margin: 25px 0; background-color: #ffffff; border-radius: 8px; border: 1px solid #eaeaea; box-shadow: 0 2px 10px rgba(0,0,0,0.03);'>
                                <tr>
                                    <td style='padding: 20px 25px;'>
                                        <table width='100%' cellpadding='0' cellspacing='0' border='0'>
                                            <tr>
                                                <td>
                                                    <h3 style='color: #6282a7; font-size: 18px; font-weight: 600; margin-top: 0; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #6282a7;'>People & Organization</h3>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    {FormatCategoryText(results.PeopleOrgText)}
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Tech & Data Section -->
                            <table width='100%' cellpadding='0' cellspacing='0' border='0' style='margin: 25px 0; background-color: #ffffff; border-radius: 8px; border: 1px solid #eaeaea; box-shadow: 0 2px 10px rgba(0,0,0,0.03);'>
                                <tr>
                                    <td style='padding: 20px 25px;'>
                                        <table width='100%' cellpadding='0' cellspacing='0' border='0'>
                                            <tr>
                                                <td>
                                                    <h3 style='color: #ab7171; font-size: 18px; font-weight: 600; margin-top: 0; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #ab7171;'>Tech & Data</h3>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    {FormatCategoryText(results.TechDataText)}
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Action Required Section -->
                            <table width='100%' cellpadding='0' cellspacing='0' border='0' style='margin: 25px 0; background-color: #FFF7ED; border-radius: 8px; border: 1px solid #FFD7AE; box-shadow: 0 2px 10px rgba(0,0,0,0.03);'>
                                <tr>
                                    <td width='6' bgcolor='#FF9933' style='border-radius: 8px 0 0 8px;'></td>
                                    <td style='padding: 20px 25px;'>
                                        <h3 style='margin-top:0; font-size:18px; color: #C65102;'>Action Required</h3>
                                        <p style='color: #343E48; line-height: 1.6;'>
                                            Please reach out to <strong>{userName}</strong> within the next 2 business days to discuss their assessment results and potential next steps.
                                        </p>
                                        <p style='margin-top: 20px;'>
                                            <a href='mailto:{userEmail}?subject=Your%20AI%20Maturity%20Assessment%20-%20Next%20Steps&body=Dear%20{userName},%0A%0AThank%20you%20for%20completing%20our%20AI%20Maturity%20Assessment.%0A%0AI%20would%20like%20to%20discuss%20your%20results%20and%20possible%20next%20steps%20for%20your%20AI%20journey.%20Would%20you%20be%20available%20for%20a%20call%20this%20week%3F%0A%0ABest%20regards,'
                                               style='display: inline-block; background-color: #62B2A9; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: 600; letter-spacing: 0.5px;'>
                                                Email {userName}
                                            </a>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer Section -->
                    <tr>
                        <td bgcolor='#343E48' style='padding: 30px 25px; text-align: center; color: white;'>
                            <p style='margin:0; font-size:14px;'>© 2025 The Nunatak Group</p>
                            <p style='margin:8px 0; font-size:15px; font-weight:300;'>Transforming businesses through AI innovation</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>";
        }

        private string GenerateEmailContent(string recipientName, string company, AssessmentResultsDTO results)
        {
            // Create score bars for visualization - table-based approach for maximum compatibility
            string CreateScoreBar(double score, double maxScore = 5.0)
            {
                int percentage = (int)Math.Round((score / maxScore) * 100);
                string bgColor = "#A0D0CB";
                
                return $@"
                <table width='100%' cellpadding='0' cellspacing='0' border='0' style='margin-top:10px;'>
                    <tr>
                        <td style='background-color:#f2f2f2;border-radius:5px;padding:0;'>
                            <table width='{percentage}%' cellpadding='0' cellspacing='0' border='0' style='border-radius:5px;'>
                                <tr>
                                    <td height='10' bgcolor='{bgColor}' style='border-radius:5px;font-size:0;line-height:0;'>&nbsp;</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>";
            }

            // Format category text with a better structure
            string FormatCategoryText(string text)
            {
                if (string.IsNullOrEmpty(text))
                {
                    return "<p style='margin:10px 0;color:#4a4a4a;line-height:1.7;'>No detailed assessment available for this category.</p>";
                }

                // Split by periods to create multiple paragraphs
                var paragraphs = text.Split('.')
                    .Where(p => !string.IsNullOrWhiteSpace(p))
                    .Select(p => $"<p style='margin:10px 0;color:#4a4a4a;line-height:1.7;'>{p.Trim()}.</p>");

                return string.Join("", paragraphs);
            }

            return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>AI Maturity Assessment Results</title>
</head>
<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #343E48; margin: 0; padding: 0; background-color: #f5f5f5;'>
    <table width='100%' cellpadding='0' cellspacing='0' border='0' style='background-color: #f5f5f5;'>
        <tr>
            <td align='center' style='padding: 20px 0;'>
                <table width='600' cellpadding='0' cellspacing='0' border='0' style='background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);'>
                    <!-- Header Section -->
                    <tr>
                        <td bgcolor='#A0D0CB' style='padding: 30px 20px; text-align: center;'>
                            <h1 style='margin: 0; font-size: 26px; font-weight: 700; color:rgb(255, 255, 255); letter-spacing: -0.5px;'>AI Maturity Assessment Results</h1>
                            <p style='margin-top: 10px; font-size: 18px; color:rgb(255, 255, 255); font-weight: 500;'>{company}</p>
                        </td>
                    </tr>
                    
                    <!-- Content Section -->
                    <tr>
                        <td style='padding: 30px 25px;'>
                            <p style='color: #343E48;'>Dear {recipientName},</p>
                            
                            <p style='color: #343E48;'>Thank you for completing Nunatak's AI Maturity Assessment. We have analyzed your responses and prepared a comprehensive evaluation of your organization's AI maturity across key dimensions.</p>

                            <!-- Executive Summary Card -->
                            <table width='100%' cellpadding='0' cellspacing='0' border='0' style='margin-bottom: 30px; background-color: transparent; border-radius: 8px; border: 1px solid #cccccc; box-shadow: 0 2px 10px rgba(0,0,0,0.03);'>
                                <tr>
                                    <td style='padding: 20px 25px;'>
                                        <h2 style='margin-top:0; color:#343E48; font-size:20px; border-bottom: 1px solid #eaeaea; padding-bottom: 10px;'>Executive Summary</h2>
                                        
                                        <!-- AI Application Score -->
                                        <table width='100%' cellpadding='0' cellspacing='0' border='0' style='margin: 15px 0; background-color: transparent; border: 1px solid #cccccc; border-radius: 6px;'>
                                            <tr>
                                                <td style='padding: 15px;'>
                                                    <table width='100%' cellpadding='0' cellspacing='0' border='0'>
                                                        <tr>
                                                            <td style='font-weight: 600; color: #343E48; font-size: 16px;'>AI Application</td>
                                                            <td align='right' style='font-weight: 700; color: #62B2A9; font-size: 18px;'>{results.AIApplicationAverage:F1}/5.0</td>
                                                        </tr>
                                                    </table>
                                                    {CreateScoreBar(results.AIApplicationAverage)}
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- People & Organization Score -->
                                        <table width='100%' cellpadding='0' cellspacing='0' border='0' style='margin: 15px 0; background-color: transparent; border: 1px solid #cccccc; border-radius: 6px;'>
                                            <tr>
                                                <td style='padding: 15px;'>
                                                    <table width='100%' cellpadding='0' cellspacing='0' border='0'>
                                                        <tr>
                                                            <td style='font-weight: 600; color: #343E48; font-size: 16px;'>People & Organization</td>
                                                            <td align='right' style='font-weight: 700; color: #62B2A9; font-size: 18px;'>{results.PeopleOrgAverage:F1}/5.0</td>
                                                        </tr>
                                                    </table>
                                                    {CreateScoreBar(results.PeopleOrgAverage)}
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- Tech & Data Score -->
                                        <table width='100%' cellpadding='0' cellspacing='0' border='0' style='margin: 15px 0; background-color: transparent; border: 1px solid #cccccc; border-radius: 6px;'>
                                            <tr>
                                                <td style='padding: 15px;'>
                                                    <table width='100%' cellpadding='0' cellspacing='0' border='0'>
                                                        <tr>
                                                            <td style='font-weight: 600; color: #343E48; font-size: 16px;'>Tech & Data</td>
                                                            <td align='right' style='font-weight: 700; color: #62B2A9; font-size: 18px;'>{results.TechDataAverage:F1}/5.0</td>
                                                        </tr>
                                                    </table>
                                                    {CreateScoreBar(results.TechDataAverage)}
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- AI Application Section -->
                            <table width='100%' cellpadding='0' cellspacing='0' border='0' style='margin: 25px 0; background-color: #ffffff; border-radius: 8px; border: 1px solid #eaeaea; box-shadow: 0 2px 10px rgba(0,0,0,0.03);'>
                                <tr>
                                    <td style='padding: 20px 25px;'>
                                        <table width='100%' cellpadding='0' cellspacing='0' border='0'>
                                            <tr>
                                                <td>
                                                    <h3 style='color: #A0D0CB; font-size: 18px; font-weight: 600; margin-top: 0; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #A0D0CB;'>AI Application</h3>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    {FormatCategoryText(results.AIApplicationText)}
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- People & Organization Section -->
                            <table width='100%' cellpadding='0' cellspacing='0' border='0' style='margin: 25px 0; background-color: #ffffff; border-radius: 8px; border: 1px solid #eaeaea; box-shadow: 0 2px 10px rgba(0,0,0,0.03);'>
                                <tr>
                                    <td style='padding: 20px 25px;'>
                                        <table width='100%' cellpadding='0' cellspacing='0' border='0'>
                                            <tr>
                                                <td>
                                                    <h3 style='color: #6282a7; font-size: 18px; font-weight: 600; margin-top: 0; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #6282a7;'>People & Organization</h3>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    {FormatCategoryText(results.PeopleOrgText)}
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Tech & Data Section -->
                            <table width='100%' cellpadding='0' cellspacing='0' border='0' style='margin: 25px 0; background-color: #ffffff; border-radius: 8px; border: 1px solid #eaeaea; box-shadow: 0 2px 10px rgba(0,0,0,0.03);'>
                                <tr>
                                    <td style='padding: 20px 25px;'>
                                        <table width='100%' cellpadding='0' cellspacing='0' border='0'>
                                            <tr>
                                                <td>
                                                    <h3 style='color: #ab7171; font-size: 18px; font-weight: 600; margin-top: 0; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #ab7171;'>Tech & Data</h3>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    {FormatCategoryText(results.TechDataText)}
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Contact Person Section -->
                            <table width='100%' cellpadding='0' cellspacing='0' border='0' style='margin: 25px 0; background-color: #ffffff; border-radius: 8px; border: 1px solid #eaeaea; box-shadow: 0 2px 10px rgba(0,0,0,0.03);'>
                                <tr>
                                    <td width='6' bgcolor='#A0D0CB' style='border-radius: 8px 0 0 8px;'></td>
                                    <td style='padding: 20px 25px;'>
                                        <h3 style='margin-top:0; font-size:18px; color: #343E48;'>Do your have any questions or would you like to discuss your results?</h3>
                                        <p style='color: #343E48; line-height: 1.6;'>
                                            <strong>Manuel Halbing</strong><br>
                                            AI Lab Managing Director<br>
                                            Email: <a href='mailto:manuel.halbing@nunatak.com' style='color:#62B2A9; text-decoration: none;'>manuel.halbing@nunatak.com</a><br>
                                            Phone: <a href='tel:+49%2089%20997%20436%20700' style='color:#62B2A9; text-decoration: none;'>+49 89 997 436 700</a>
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <!-- CTA Button -->
                            <table width='100%' cellpadding='0' cellspacing='0' border='0' style='margin-top: 30px;'>
                                <tr>
                                    <td align='center'>
                                        <a href='https://www.nunatak.com' style='display: inline-block; background-color: #62B2A9; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: 600; letter-spacing: 0.5px;'>Visit Nunatak.com</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer Section -->
                    <tr>
                        <td bgcolor='#343E48' style='padding: 30px 25px; text-align: center; color: white;'>
                            <p style='margin:0; font-size:14px;'>© 2025 The Nunatak Group</p>
                            <p style='margin:8px 0; font-size:15px; font-weight:300;'>Transforming businesses through AI innovation</p>
                            
                            <table width='100%' cellpadding='0' cellspacing='0' border='0' style='margin: 15px 0;'>
                                <tr>
                                    <td align='center'>
                                        <a href='https://www.nunatak.com/en/meta/legal-notice' style='color: #A0D0CB; text-decoration: none; margin: 0 10px; font-size: 13px;'>Legal Notice</a>
                                        <a href='https://www.nunatak.com/en/meta/privacy-policy' style='color: #A0D0CB; text-decoration: none; margin: 0 10px; font-size: 13px;'>Privacy Policy</a>
                                    </td>
                                </tr>
                            </table>
                            
                           <p style='font-style: italic; margin: 20px auto; max-width: 80%; color: rgba(255,255,255,0.8); font-size: 13px; line-height: 1.5;'>
                                Nu|na|tak ['nu:natak]<br>
                                Nunataks are mountains which stick up above the level of a glacier. In Inuit language Nunataks resemble signposts which lead the way.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>";
        }
    }
}