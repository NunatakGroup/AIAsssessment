using System.ComponentModel.DataAnnotations;

namespace AI_Maturity_Assessment.Models
{
    public class ContactFormModel
    {
        [Required]
        public string Name { get; set; } = null!;
        
        [Required]
        public string Company { get; set; } = null!;
        
        [Required]
        [EmailAddress]
        public string Email { get; set; } = null!;
    }
}