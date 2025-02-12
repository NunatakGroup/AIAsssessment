const GlobalEffects = {
    initialize() {
        this.initializeParallax();
        this.initializeHoverEffects();
        this.initializeBackgroundInteraction();
    },

    initializeParallax() {
        document.addEventListener('mousemove', (e) => {
            requestAnimationFrame(() => {
                const mouseX = e.clientX;
                const mouseY = e.clientY;
                
                // Get all interactive elements
                const elements = document.querySelectorAll('.glass-panel, .score-item, .perception-gauge, .result-tab');
                
                elements.forEach(element => {
                    const rect = element.getBoundingClientRect();
                    const elementX = rect.left + rect.width / 2;
                    const elementY = rect.top + rect.height / 2;
                    
                    // Calculate distance from mouse to element center
                    const distanceX = mouseX - elementX;
                    const distanceY = mouseY - elementY;
                    
                    // Calculate movement (closer elements move more)
                    const movement = 15; // max pixels to move
                    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
                    const maxDistance = 500; // distance at which movement begins to decrease
                    
                    let movementFactor = Math.max(0, 1 - distance / maxDistance);
                    movementFactor = movementFactor * movementFactor; // Square for smoother falloff
                    
                    const moveX = (distanceX / maxDistance) * movement * movementFactor;
                    const moveY = (distanceY / maxDistance) * movement * movementFactor;
                    
                    // Apply transform with transition
                    element.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
                    element.style.transform = `translate(${moveX}px, ${moveY}px)`;
                });
            });
        });
    },

    initializeHoverEffects() {
        const interactiveElements = document.querySelectorAll('.glass-panel, .score-item, .perception-gauge, .result-tab');
        
        interactiveElements.forEach(element => {
            element.addEventListener('mouseenter', () => {
                element.style.transform = 'translateY(-5px)';
                element.style.boxShadow = '0 8px 20px rgba(160, 208, 203, 0.2)';
            });

            element.addEventListener('mouseleave', () => {
                element.style.transform = 'translateY(0)';
                element.style.boxShadow = '';
            });
        });
    },

    initializeBackgroundInteraction() {
        let mouseX = 0;
        let mouseY = 0;
        
        document.addEventListener('mousemove', (e) => {
            mouseX = (e.clientX / window.innerWidth) - 0.5;
            mouseY = (e.clientY / window.innerHeight) - 0.5;
            
            requestAnimationFrame(() => {
                document.querySelectorAll('.gradient-sphere').forEach((sphere, index) => {
                    const speed = (index + 1) * 20;
                    sphere.style.transform = `translate(${mouseX * speed}px, ${mouseY * speed}px)`;
                });
            });
        });
    }
};

// Initialize effects when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    GlobalEffects.initialize();
});