using System.ComponentModel.DataAnnotations;

namespace AI_Maturity_Assessment.Models.Admin
{
    public class AdminLoginModel
    {
        [Required]
        public string Password { get; set; } = string.Empty;
    }
}