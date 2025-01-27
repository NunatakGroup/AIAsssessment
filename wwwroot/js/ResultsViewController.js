const ResultsViewController = {
    async initialize() {
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
                            color: 'rgb(0, 0, 0)'
                        },
                        grid: {
                            circular: true,
                            color: 'rgb(255, 255, 255)'
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

    async loadResults() {
        try {
            const response = await fetch('/Results/GetResults');
            const results = await response.json();
            
            if (!results || !results.categoryResults) {
                console.error('No category results found');
                return null;
            }

            const tabs = document.querySelectorAll('.result-tab');
            results.categoryResults.forEach(category => {
                const tab = Array.from(tabs).find(t => t.dataset.category === category.Name);
                if (tab) {
                    const content = tab.querySelector('.tab-content');
                    const score = Math.round(category.Average * 10) / 10;
                    
                    content.innerHTML = `
                        <div class="category-score">Score: ${score}/5</div>
                        <div class="category-details">${category.ResultText}</div>
                    `;
                    
                    // Add click handler for expandable content
                    tab.querySelector('.tab-header').addEventListener('click', () => {
                        const isActive = tab.classList.contains('active');
                        content.style.maxHeight = isActive ? '0' : content.scrollHeight + 'px';
                        content.style.opacity = isActive ? '0' : '1';
                        tab.classList.toggle('active');
                    });
                }
            });
    
            return results;
        } catch (error) {
            console.error('Error:', error);
            return null;
        }
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
    console.log('DOM loaded');
    ResultsViewController.initialize();
});