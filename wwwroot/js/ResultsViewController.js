const ResultsViewController = {
    async initialize() {
        this.setupEventListeners();
        const results = await this.loadResults();
        this.initializeModal();
        this.showModal();
        if (results) {
            this.initializeChart(results);
        }
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
                            centerPointLabels: true,
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

    setupEventListeners() {
        document.querySelectorAll('.result-tab').forEach(tab => {
            tab.addEventListener('click', () => this.toggleTab(tab));
        });
    },

    toggleTab(tab) {
        const isActive = tab.classList.contains('active');
        document.querySelectorAll('.result-tab').forEach(t => {
            t.classList.remove('active');
            t.querySelector('.tab-content').style.maxHeight = null;
        });

        if (!isActive) {
            tab.classList.add('active');
            const content = tab.querySelector('.tab-content');
            content.style.maxHeight = content.scrollHeight + "px";
        }
    },

    async loadResults() {
        try {
            const response = await fetch('/Results/GetResults');
            if (!response.ok) throw new Error('Failed to load results');
            const results = await response.json();
            console.log('Results:', results);  // Debug log
            this.updateUI(results);
            return results;
        } catch (error) {
            console.error('Error loading results:', error);
            return null;
        }
    },

    updateUI(results) {
        if (results.categoryResults) {
            results.categoryResults.forEach(category => {
                const tabElement = document.querySelector(`[data-category="${category.Name}"] .tab-content`);
                if (tabElement) {
                    tabElement.innerHTML = `
                        <div class="category-score">
                            Average Score: ${category.Average.toFixed(1)}
                        </div>
                        <div class="category-details">
                            ${category.ResultText}
                        </div>
                    `;
                }
            });
        }
    },

    generateCategoryContent(categoryData) {
        return `
            <div class="category-score">
                Score: ${categoryData.score}%
            </div>
            <div class="category-details">
                ${categoryData.details}
            </div>
        `;
    },

    initializeModal() {
        const form = document.getElementById('contactForm');
        form?.addEventListener('submit', this.handleModalSubmit.bind(this));
    },

    showModal() {
        const modal = document.getElementById('contactModal');
        modal.classList.add('active');
        modal.style.display = 'block';
    },

    hideModal() {
        const modal = document.getElementById('contactModal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('active');
            document.body.classList.remove('modal-open');
        }
    },

    async handleModalSubmit(e) {
        e.preventDefault();
        console.log('Submit handler triggered');
        
        const formData = new FormData(e.target);
        try {
            const response = await fetch('/Results/SubmitContact', {
                method: 'POST',
                body: formData
            });
            console.log('Response status:', response.status);
            
            if (response.ok) {
                this.hideModal();
                e.target.reset();
                console.log('Modal should be hidden now');
            }
        } catch (error) {
            console.error('Error:', error);
        }
        return false;
    },

    showNotification(message, isError = false) {
        console.log(message);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    ResultsViewController.initialize();
});