const InteractiveEffects = {
    initialize() {
        //this.initializeParallax();
        //this.initializeHoverEffects();
        this.initializeGlowingDots();
    },

    initializeParallax() {
        document.addEventListener('mousemove', (e) => {
            const moveX = (e.clientX - window.innerWidth / 2) * 0.01;
            const moveY = (e.clientY - window.innerHeight / 2) * 0.01;

            document.querySelectorAll('.glass-panel').forEach(panel => {
                panel.style.transform = `translate(${moveX}px, ${moveY}px)`;
            });
        });
    },

    initializeHoverEffects() {
        document.querySelectorAll('.score-item').forEach(item => {
            item.addEventListener('mouseenter', () => {
                const value = item.querySelector('.score-value');
                if (value) {
                    value.style.transform = 'scale(1.1)';
                    value.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
                }
            });

            item.addEventListener('mouseleave', () => {
                const value = item.querySelector('.score-value');
                if (value) {
                    value.style.transform = 'scale(1)';
                }
            });
        });
    },

    initializeGlowingDots() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const container = document.querySelector('.results-container');
        
        if (!container) return;
        
        container.appendChild(canvas);
        canvas.className = 'glowing-dots';
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '1';
        
        const resize = () => {
            canvas.width = container.offsetWidth;
            canvas.height = container.offsetHeight;
        };
        
        resize();
        window.addEventListener('resize', resize);
        
        const dots = [];
        const createDot = () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 2 + 1,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            alpha: Math.random() * 0.5 + 0.5
        });
        
        for (let i = 0; i < 50; i++) {
            dots.push(createDot());
        }
        
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            dots.forEach(dot => {
                dot.x += dot.vx;
                dot.y += dot.vy;
                
                if (dot.x < 0) dot.x = canvas.width;
                if (dot.x > canvas.width) dot.x = 0;
                if (dot.y < 0) dot.y = canvas.height;
                if (dot.y > canvas.height) dot.y = 0;
                
                ctx.beginPath();
                ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(160, 208, 203, ${dot.alpha})`;
                ctx.fill();
            });
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
};

const ImageDebugHelper = {
    initialize() {
        console.log('Initializing ImageDebugHelper');
        this.checkImages();
    },

    checkImages() {
        // Find all images
        const images = document.querySelectorAll('.avatar-image');
        
        images.forEach(img => {
            console.log('Image source:', img.src);
            
            // Add event handlers
            img.addEventListener('load', function() {
                console.log('Image loaded successfully:', this.src);
                // Hide placeholder when image loads
                const placeholder = this.parentElement.querySelector('.avatar-placeholder');
                if (placeholder) placeholder.style.display = 'none';
            });
            
            img.addEventListener('error', function() {
                console.error('Image failed to load:', this.src);
                // Show placeholder when image fails to load
                const placeholder = this.parentElement.querySelector('.avatar-placeholder');
                if (placeholder) placeholder.style.display = 'flex';
                this.style.display = 'none';
            });
        });
    }
};

const ResultsViewController = {
    async initialize() {
        console.log('Initializing ResultsViewController');
    
    // Initialize image handling first for better debugging
    this.initializeImageHandling();
    
    const results = await this.loadResults();
    this.initializeModal();
    
    if (results) {
        this.initializeChart(results);
        this.displayCategoryScores(results);
        this.updatePerceptionGauge(results);
    }
    },

    displayCategoryScores(results) {
        console.log('Displaying category scores');
        const scoresContainer = document.querySelector('.category-scores');
        if (!scoresContainer) return;
    
        const categoryScores = results.categoryResults.map(category => `
            <div class="score-item glass-effect">
                <div class="score-label">${category.name}</div>
                <div class="score-value">${category.average.toFixed(1)}/5.0</div>
            </div>
        `).join('');
    
        scoresContainer.innerHTML = categoryScores;
    },

    initializeChart(results) {
        const ctx = document.getElementById('radarChart');
        if (!ctx) return;
    
        const data = {
            labels: [
                'AI Products', 
                'New Business Models', 
                'AI Enhanced Processes',
                'AI Impact Management', 
                'AI Governance', 
                'Roles/Skills/Competencies',
                'Security/Privacy', 
                'Platform/Tools', 
                'Data Infrastructure'
            ],
            datasets: [
                {
                    label: 'Your Assessment Results',
                    data: results.chartData,
                    backgroundColor: 'rgba(160, 208, 203, 0.15)',
                    borderColor: '#A0D0CB',
                    pointBackgroundColor: '#62B2A9',
                    pointHoverBackgroundColor: '#ffffff',
                    borderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBorderColor: '#ffffff',
                    pointHoverBorderColor: '#A0D0CB',
                    fill: true
                },
                {
                    label: 'Your Initial Perception',
                    data: Array(9).fill(results.ambition.score), // Creates array with perception score
                    backgroundColor: 'rgba(255, 255, 255, 0)',
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    borderDash: [5, 5],
                    pointRadius: 0,
                    borderWidth: 2,
                    fill: false
                }
            ]
        };
    
        new Chart(ctx, {
            type: 'radar',
            data: data,
            layout: {
                padding: {
                    bottom: 70 // Reserve space for the legend
                }
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            color: 'rgba(255, 255, 255, 0.9)',
                            padding: 20,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            font: {
                                size: 12 // Adjust font size for better fit
                            },
                            boxWidth: 10 // Smaller color boxes for the legend
                        },
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.raw.toFixed(1)}/5.0`;
                            }
                        }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 5,
                        min: 0,
                        ticks: {
                            stepSize: 1,
                            display: true,
                            color: 'rgba(255, 255, 255, 0.7)',
                            backdropColor: 'transparent',
                            z: 2
                        },
                        grid: {
                            circular: true,
                            color: 'rgba(255, 255, 255, 0.1)',
                            lineWidth: 1
                        },
                        pointLabels: {
                            font: {
                                family: 'HKGrotesk',
                                size: (context) => {
                                    const width = context.chart.width;
                                    return width < 400 ? 10 : 
                                           width < 600 ? 12 : 
                                           width < 800 ? 14 : 16;
                                }
                            },
                            color: 'rgba(255, 255, 255, 0.9)',
                            padding: 20
                        },
                        angleLines: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
    },

    initializeImageHandling() {
        console.log('Setting up improved image handling');
        
        // Select all avatar images
        const images = document.querySelectorAll('.avatar-image');
        
        images.forEach(img => {
            // For images that are already loaded (from cache)
            if (img.complete) {
                if (img.naturalWidth === 0) {
                    // Image failed to load (error state but complete)
                    console.log('Image already failed:', img.src);
                    // Show placeholder
                    const placeholder = img.parentElement.querySelector('.avatar-placeholder');
                    if (placeholder) placeholder.style.zIndex = 3; // Move above image
                }
            }
            
            // For images still loading
            img.addEventListener('load', function() {
                console.log('Image loaded successfully:', this.src);
                // Image loaded successfully - make sure it's visible
                this.style.display = 'block';
                // Keep placeholder behind
                const placeholder = this.parentElement.querySelector('.avatar-placeholder');
                if (placeholder) placeholder.style.zIndex = 1;
            });
            
            img.addEventListener('error', function() {
                console.error('Image failed to load:', this.src);
                // Show placeholder when image fails
                const placeholder = this.parentElement.querySelector('.avatar-placeholder');
                if (placeholder) placeholder.style.zIndex = 3; // Move above image
            });
        });
    },

    checkSpecificImage() {
        // Try to load the specific image that's failing
        const testImg = new Image();
        
        // Log paths to check
        console.log('Current page URL:', window.location.href);
        console.log('Application root:', window.location.origin);
        
        // Try different paths to see which one works
        const paths = [
            '/images/AI_Wheel_Q1.png',
            '/images/AI_Wheel_Q9.png',
            'images/AI_Wheel_Q1.png',
            window.location.origin + '/images/AI_Wheel_Q1.png'
        ];
        
        paths.forEach(path => {
            const img = new Image();
            img.onload = () => console.log('SUCCESS LOADING:', path);
            img.onerror = () => console.error('FAILED LOADING:', path);
            img.src = path;
            console.log('Attempting to load:', path);
        });
    },

    updatePerceptionGauge(results) {
        const actualAverage = results.chartData.reduce((a, b) => a + b, 0) / results.chartData.length;
        const perception = results.ambition.score;
        const difference = ((perception - actualAverage) / 5) * 100;
        
        // Calculate percentage for gauge (0.5 is middle/accurate)
        let percentage = 0.5 + (difference / 200); // Normalize to 0-1 range
        percentage = Math.max(0, Math.min(1, percentage)); // Clamp between 0 and 1
        
        const gauge = document.querySelector('.gauge-fill');
        const needle = document.querySelector('.gauge-needle');
        const differenceElement = document.querySelector('.perception-difference');
        
        if (gauge && needle && differenceElement) {
            gauge.style.setProperty('--percentage', percentage);
            needle.style.setProperty('--percentage', percentage);
            
            // Update difference text
            const differenceText = difference > 0 
                ? `+${difference.toFixed(1)}%` 
                : `${difference.toFixed(1)}%`;
            differenceElement.textContent = differenceText;
            
            // Add color based on accuracy
            const accuracy = Math.abs(difference);
            let color = 'var(--accent-green)';
            if (accuracy > 30) {
                color = 'var(--accent-red)';
            } else if (accuracy > 15) {
                color = 'var(--accent-blue)';
            }
            differenceElement.style.color = color;
        }
    },

    async loadResults() {
        try {
            console.log('Loading results...');
            const response = await fetch('/Results/GetResults');
            
            if (!response.ok) {
                console.error('Results response not OK:', response.status);
                return null;
            }
            
            const results = await response.json();
            console.log('Results loaded successfully');
            
            return results;
        } catch (error) {
            console.error('Error loading results:', error);
            return null;
        }
    },

    initializeModal() {
        console.log('Initializing modal');
        const form = document.getElementById('contactForm');
        if (form) {
            form.addEventListener('submit', this.handleModalSubmit.bind(this));
        }
        // Ensure modal is hidden initially
        const modal = document.getElementById('contactModal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('active');
        }
        const businessSectorDropdown = document.getElementById('businessSector');
        const otherSectorGroup = document.getElementById('otherSectorGroup');
        const otherBusinessSector = document.getElementById('otherBusinessSector');
        
        if (businessSectorDropdown && otherSectorGroup && otherBusinessSector) {
            businessSectorDropdown.addEventListener('change', function() {
                if (this.value === 'Other') {
                    otherSectorGroup.style.display = 'block';
                    otherBusinessSector.setAttribute('required', 'required');
                } else {
                    otherSectorGroup.style.display = 'none';
                    otherBusinessSector.removeAttribute('required');
                    otherBusinessSector.value = '';
                }
            });
        }
    },

    showContactModal() {
        console.log('Showing contact modal');
        const modal = document.getElementById('contactModal');
        modal.classList.add('active');
        modal.style.display = 'block';
    },

    hideModal() {
        console.log('Hiding modal');
        const modal = document.getElementById('contactModal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('active');
        }
    },

    async handleModalSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const button = form.querySelector('.submit-button');
        const buttonText = button.querySelector('.button-text');
        const buttonLoading = button.querySelector('.button-loading');
        const scrollIndicator = document.querySelector('.scroll-indicator');
        
        const businessSector = form.querySelector('#businessSector').value;
        const otherBusinessSector = form.querySelector('#otherBusinessSector');
        
        if (businessSector === 'Other' && (!otherBusinessSector.value || otherBusinessSector.value.trim() === '')) {
            alert('Please specify your business sector');
            return;
        }
        
        try {
            buttonText.classList.add('hidden');
            buttonLoading.classList.remove('hidden');
            button.disabled = true;
    
            // Create form data and add dummy value if needed
            const formData = new FormData(form);
            
            // If business sector is not "Other", add a dummy value for OtherBusinessSector
            if (businessSector !== 'Other') {
                formData.set('OtherBusinessSector', 'NotApplicable');
            }
            
            // Debug: log form data
            console.log("Form data being sent:");
            for (let pair of formData.entries()) {
                console.log(pair[0] + ': ' + pair[1]);
            }
            
            // Send the form data
            const response = await fetch('/Results/SubmitContact', {
                method: 'POST',
                body: formData
            });
            
            // Debug: log response details
            console.log("Response status:", response.status);
            console.log("Response status text:", response.statusText);
            
            if (response.ok) {
                console.log("Form submitted successfully");
                const unlockPrompt = document.querySelector('.unlock-prompt');
                if (unlockPrompt) {
                    unlockPrompt.style.display = 'none';
                }
                
                this.hideModal();
                this.showDetailedResults();
                form.reset();
    
                // Show scroll indicator after detailed results are shown
                setTimeout(() => {
                    if (scrollIndicator) {
                        scrollIndicator.style.display = 'block';
                        requestAnimationFrame(() => {
                            scrollIndicator.classList.add('visible');
                        });
    
                        // Hide scroll indicator when user scrolls
                        const handleScroll = () => {
                            scrollIndicator.classList.remove('visible');
                            setTimeout(() => {
                                scrollIndicator.style.display = 'none';
                            }, 300);
                            window.removeEventListener('scroll', handleScroll);
                        };
                        
                        window.addEventListener('scroll', handleScroll);
                        
                        // Auto-hide after 6 seconds if no scroll
                        setTimeout(() => {
                            if (scrollIndicator.classList.contains('visible')) {
                                scrollIndicator.classList.remove('visible');
                                setTimeout(() => {
                                    scrollIndicator.style.display = 'none';
                                }, 300);
                            }
                        }, 6000);
                    }
                }, 500); // Slight delay after content loads
            } else {
                // Try to get detailed error information
                let errorText = "Unknown error";
                try {
                    errorText = await response.text();
                    console.error("Server error response:", errorText);
                    
                    // Try to parse as JSON if possible
                    try {
                        const jsonError = JSON.parse(errorText);
                        console.error("Parsed JSON error:", jsonError);
                    } catch {
                        // Not JSON, use as plain text
                    }
                } catch (readError) {
                    console.error("Could not read error response:", readError);
                }
                
                throw new Error(`Server returned ${response.status}: ${errorText}`);
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            alert('Failed to send results. Please try again. Error: ' + error.message);
        } finally {
            buttonText.classList.remove('hidden');
            buttonLoading.classList.add('hidden');
            button.disabled = false;
        }
    },

    showDetailedResults() {
        console.log('Showing detailed results');
        const detailedResults = document.querySelector('.detailed-results');
        if (detailedResults) {
            detailedResults.classList.remove('hidden');
        }
        this.loadDetailedResults();
    },

    async loadDetailedResults() {
        const results = await this.loadResults();
        if (!results) return;

        const tabs = document.querySelectorAll('.result-tab');
        tabs.forEach(tab => {
            const categoryName = tab.dataset.category;
            const result = results.categoryResults.find(r => r.name === categoryName);
            
            if (result) {
                const content = tab.querySelector('.tab-content');
                if (content) {
                    content.innerHTML = `
                        <div class="category-text">
                            <p>${result.resultText}</p>
                        </div>
                    `;
                }
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing ResultsViewController');
    ResultsViewController.initialize();
    InteractiveEffects.initialize();
    ImageDebugHelper.initialize();
});