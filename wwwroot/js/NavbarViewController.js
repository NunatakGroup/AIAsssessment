class NavbarViewController {
    constructor() {
        this.navToggle = document.querySelector('.nav-toggle');
        this.navLinks = document.querySelector('.nav-links');
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Toggle menu
        this.navToggle.addEventListener('click', () => this.toggleMenu());

        // Close menu when clicking outside
        document.addEventListener('click', (event) => this.handleOutsideClick(event));

        // Close menu when clicking links
        const links = document.querySelectorAll('.nav-links a');
        links.forEach(link => {
            link.addEventListener('click', () => this.closeMenu());
        });
    }

    toggleMenu() {
        this.navToggle.classList.toggle('active');
        this.navLinks.classList.toggle('active');
    }

    closeMenu() {
        this.navToggle.classList.remove('active');
        this.navLinks.classList.remove('active');
    }

    handleOutsideClick(event) {
        if (!event.target.closest('.main-nav')) {
            this.closeMenu();
        }
    }
}

// Initialize the controller when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NavbarViewController();
});