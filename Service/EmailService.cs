using Azure.Communication.Email;
using Microsoft.Extensions.Configuration;
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

        private string GenerateEmailContent(string recipientName, string company, AssessmentResultsDTO results)
        {
            return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>AI Maturity Assessment Results</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        body {{
            font-family: 'Inter', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #ffffff;
        }}

        .email-container {{
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }}

        .header {{
            background: linear-gradient(135deg, #A0D0CB 0%, #62B2A9 100%);
            color: #343E48;
            padding: 30px 20px;
            text-align: center;
            border-bottom: 3px solid #62B2A9;
        }}

        .header h1 {{
            margin: 0;
            font-size: 24px;
            font-weight: 600;
            color: #343E48;
        }}

        .header p {{
            margin-top: 8px;
            font-size: 18px;
            color: #343E48;
        }}

        .content {{
            padding: 30px;
        }}

        .scorecard {{
            background-color: #ffffff;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
            border: 1px solid #A0D0CB;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }}

        .score-item {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 10px 0;
            padding: 10px;
            border-bottom: 1px solid #A0D0CB;
        }}

        .score-label {{
            font-weight: 600;
            color: #343E48;
        }}

        .score-value {{
            font-weight: 700;
            color: #62B2A9;
            font-size: 1.2em;
        }}

        .category {{
            margin: 30px 0;
            padding: 20px;
            background-color: #ffffff;
            border: 1px solid #A0D0CB;
            border-radius: 8px;
        }}

        .category-title {{
            color: #343E48;
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #A0D0CB;
        }}

        .contact-info {{
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            margin-top: 30px;
            border: 1px solid #A0D0CB;
        }}

        .cta-button {{
            display: inline-block;
            background-color: #62B2A9;
            color: white;
            padding: 12px 25px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            transition: background-color 0.3s ease;
        }}

        .cta-button:hover {{
            background-color: #A0D0CB;
        }}

        .contact-person {{
            margin: 20px 0;
            padding: 20px;
            background-color: #ffffff;
            border-left: 4px solid #62B2A9;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }}

        .footer {{
            background: linear-gradient(135deg, #343E48 0%, #2C353D 100%);
            color: white;
            padding: 30px;
            text-align: center;
            margin-top: 40px;
        }}

        @media only screen and (max-width: 600px) {{
            .content {{
                padding: 15px;
            }}
            
            .header {{
                padding: 20px 15px;
            }}
            
            .header h1 {{
                font-size: 20px;
            }}
            
            .category {{
                padding: 15px;
            }}
        }}
    </style>
</head>
<body>
    <div class='email-container'>
        <div class='header'>
            <h1>AI Maturity Assessment Results</h1>
            <p>{company}</p>
        </div>

        <div class='content'>
            <p>Dear {recipientName},</p>
            
            <p>Thank you for completing Nunatak's AI Maturity Assessment. We have analyzed your responses and prepared a comprehensive evaluation of your organization's AI maturity across key dimensions.</p>

            <div class='scorecard'>
                <h2 style='margin-top:0;color:#343E48;'>Executive Summary</h2>
                <div class='score-item'>
                    <span class='score-label'>AI Application</span>
                    <span class='score-value'>{results.AIApplicationAverage:F1}/5.0</span>
                </div>
                <div class='score-item'>
                    <span class='score-label'>People & Organization</span>
                    <span class='score-value'>{results.PeopleOrgAverage:F1}/5.0</span>
                </div>
                <div class='score-item'>
                    <span class='score-label'>Tech & Data</span>
                    <span class='score-value'>{results.TechDataAverage:F1}/5.0</span>
                </div>
            </div>

            <div class='category'>
                <h3 class='category-title'>AI Application</h3>
                <p>{results.AIApplicationText}</p>
            </div>

            <div class='category'>
                <h3 class='category-title'>People & Organization</h3>
                <p>{results.PeopleOrgText}</p>
            </div>

            <div class='category'>
                <h3 class='category-title'>Tech & Data</h3>
                <p>{results.TechDataText}</p>
            </div>

            <div class='contact-person'>
                <h3 style='margin-top:0;color:#343E48;'>Your Direct Contact</h3>
                <p><strong>Manuel Halbing</strong><br>
                Managing Partner, Nunatak AI Lab<br>
                Email: <a href='mailto:manuel.halbing@nunatak.com' style='color:#62B2A9;'>manuel.halbing@nunatak.com</a><br>
                Phone: <a href='tel:+491732597151' style='color:#62B2A9;'>+49 173 2597151</a></p>
            </div>

            <div style='text-align:center;margin-top:30px;'>
                <a href='https://www.nunatak.com' class='cta-button'>Visit Nunatak.com</a>
            </div>
        </div>

        <div class='footer'>
            <p style='margin:0;'>© 2025 Nunatak Group</p>
            <p style='margin:5px 0;'>Transforming businesses through AI innovation</p>
        </div>
    </div>
</body>
</html>";
        }
    }
}