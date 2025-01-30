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
            <div class="score-item">
                <span class="score-label">${category.name}</span>
                <span class="score-value">${category.average.toFixed(1)}/5.0</span>
            </div>
        `).join('');

        scoresContainer.innerHTML = categoryScores;
    },

    initializeChart(results) {
        const ctx = document.getElementById('radarChart');
        if (!ctx) return;

        const data = {
            labels: ['AI Products', 'New Business Models', 'AI Enhanced Processes', 
                    'AI Impact Management', 'AI Governance', 'Roles/Skills/Competencies', 
                    'Security/Privacy', 'Platform/Tools', 'Data Infrastructure'],
            datasets: [{
                data: results.chartData,
                backgroundColor: 'rgba(160, 208, 203, 0.2)',
                borderColor: '#A0D0CB',
                pointBackgroundColor: '#62B2A9',
                borderWidth: 2,
                pointRadius: 4
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
                        ticks: {
                            stepSize: 1,
                            display: true,
                            color: 'rgb(255, 255, 255)'
                        },
                        grid: {
                            circular: true,
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        pointLabels: {
                            font: {
                                size: (context) => {
                                    const width = context.chart.width;
                                    return width < 400 ? 8 : 
                                           width < 600 ? 10 : 
                                           width < 800 ? 12 : 14;
                                }
                            },
                            color: 'rgb(255, 255, 255)',
                            padding: (context) => {
                                const width = context.chart.width;
                                return width < 400 ? 2 : 
                                       width < 600 ? 4 : 
                                       width < 800 ? 6 : 8;
                            }
                        }
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
        console.log('Handling modal submit');
        
        const formData = new FormData(e.target);
        try {
            const response = await fetch('/Results/SubmitContact', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                this.hideModal();
                this.showDetailedResults();
                e.target.reset();
            }
        } catch (error) {
            console.error('Error submitting form:', error);
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