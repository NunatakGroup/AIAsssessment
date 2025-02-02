// Add this function at the bottom of your home.js
function checkScreenSizeAndScroll() {
    if (window.innerWidth <= 768) { // 768px is a common breakpoint for mobile devices
        window.scrollTo({
            top: 200,
            behavior: 'smooth'
        });
    }
}

// Add event listeners
document.addEventListener('DOMContentLoaded', checkScreenSizeAndScroll);
window.addEventListener('resize', checkScreenSizeAndScroll);