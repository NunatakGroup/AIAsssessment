const InteractiveEffects = {
    initialize() {
        this.initializeParallax();
        this.initializeHoverEffects();
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

const ResultsViewController = {
    async initialize() {
        console.log('Initializing ResultsViewController');
        const results = await this.loadResults();
        this.initializeModal();  // Just initialize the modal handlers
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
                            pointStyle: 'circle'
                        }
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
        
        try {
            buttonText.classList.add('hidden');
            buttonLoading.classList.remove('hidden');
            button.disabled = true;
            
            const formData = new FormData(form);
            const response = await fetch('/Results/SubmitContact', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
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
                throw new Error('Failed to submit form');
            }
        } catch (error) {
            alert('Failed to send results. Please try again.');
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
});