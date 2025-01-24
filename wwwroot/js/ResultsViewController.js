const ResultsViewController = {
    initialize() {
        this.setupEventListeners();
        this.loadResults();
        this.initializeModal();
        this.showModal();
        this.initializeChart();
    },

    initializeChart() {
        const ctx = document.getElementById('radarChart');
        if (!ctx) return;

        const data = {
            labels: ['Ai Products', 'New Business Models', 'AI Enhanced Processes', 
                    'Ai Impact Management', 'Ai Governance', 'Roles/ Skills / Competencies', 
                    'Security/ Privacy', 'Platform/ Tools', 'Data Infrastructure'],
            datasets: [{
                data: [4.2, 3.8, 3.5, 4.0, 3.2, 3.7, 3.9, 4.1, 3.6],
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
                            color: 'rgba(255, 255, 255, 0.7)'
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
                            color: 'rgba(255, 255, 255, 0.9)',
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
            this.updateUI(results);
            this.showModal();
        } catch (error) {
            console.error('Error loading results:', error);
        }
    },

    updateUI(results) {
        const categories = ['ambition', 'use-cases', 'enablers'];
        categories.forEach(category => {
            const content = document.querySelector(`[data-tab="${category}"] .tab-content`);
            if (content && results[category]) {
                content.innerHTML = this.generateCategoryContent(results[category]);
            }
        });
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