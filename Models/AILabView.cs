using System.Collections.Generic;

namespace AI_Maturity_Assessment.Models
{
    public class AILabViewModel
    {
        public List<ContactPerson> Contacts { get; set; }
        public List<Paper> Papers { get; set; }
    }

    public class ContactPerson
    {
        public string Name { get; set; }
        public string Role { get; set; }
        public string Email { get; set; }
        public string ImagePath { get; set; }
    }

    public class Paper
    {
        public string Title { get; set; }
        public string Date { get; set; }
        public string Description { get; set; }
        public string ImagePath { get; set; }
        public string Link { get; set; }
    }
}