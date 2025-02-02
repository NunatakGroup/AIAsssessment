const ResultsViewController = {
    async initialize() {
        console.log('Initializing ResultsViewController');
        const results = await this.loadResults();
        this.initializeModal();  // Just initialize the modal handlers
        if (results) {
            this.initializeChart(results);
            this.displayCategoryScores(results);
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
            datasets: [{
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
            }]
        };
    
        new Chart(ctx, {
            type: 'radar',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
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
                },
                animation: {
                    duration: 2000,
                    easing: 'easeOutQuart'
                },
                elements: {
                    line: {
                        tension: 0.1
                    }
                }
            }
        });
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
                    unlockPrompt.style.display = 'none';  // Using style.display for more forceful hiding
                }
                
                this.hideModal();
                this.showDetailedResults();
                form.reset();
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
});