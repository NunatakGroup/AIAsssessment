// Views/Assessment/AssessmentViewController.js
// @ts-nocheck

const AssessmentViewController = {
    currentQuestionId: 1,
    totalQuestions: 0,
    userAnswers: new Map(),

    async initialize() {
        await this.getTotalQuestions();
        await this.loadQuestion(this.currentQuestionId);
        this.setupEventListeners();
    },

    async saveAnswer(questionId, answerId) {
        try {
            const response = await fetch('/Assessment/SaveAnswer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin',  // Add this line
                body: JSON.stringify({ questionId, answerId })
            });
            
            if (!response.ok) throw new Error('Failed to save answer');
            const result = await response.json();
            
            // Store the session ID locally if returned
            if (result.sessionId) {
                localStorage.setItem('assessmentSessionId', result.sessionId);
            }
            
            return result;
        } catch (error) {
            console.error('Error saving answer:', error);
            throw error;
        }
    },

    async nextQuestion() {
        let answerId;
        
        if (this.currentQuestionId === 1) {
            const slider = document.querySelector('#maturitySlider');
            if (!slider) {
                this.showNotification('Error: Slider not found', true);
                return;
            }
            answerId = parseInt(slider.value);
        } else {
            const selectedAnswer = document.querySelector('input[name="answer"]:checked');
            if (!selectedAnswer) {
                this.showNotification('Please select an answer', true);
                return;
            }
            answerId = parseInt(selectedAnswer.value);
        }
    
        await this.saveAnswer(this.currentQuestionId, answerId);
        this.userAnswers.set(this.currentQuestionId, answerId);
    
        if (this.currentQuestionId === this.totalQuestions) {
            await this.submitAssessment();
        } else {
            this.currentQuestionId++;
            await this.loadQuestion(this.currentQuestionId);
        }
    },
 
    async getTotalQuestions() {
        const response = await fetch('/Assessment/GetTotalQuestions');
        this.totalQuestions = await response.json();
        this.updateProgressBar();
    },
 
    async loadQuestion(id) {
        try {
            console.log('Fetching question:', id);
            const response = await fetch(`/Assessment/GetQuestion/${id}`);
            console.log('Response:', response);
            const question = await response.json();
            console.log('Question:', question);
            this.updateUI(question);
            panel.style.opacity = '1';
        panel.style.transform = 'translateY(0)';
    } catch (error) {
        console.error('Error:', error);
    }
    },

    createSliderUI(question) {
        return `
            <div class="chapter-label">${question.chapter}</div>
            <h2>${question.questionText}</h2>
            <div class="slider-container">
                <div class="slider-wrapper">
                    <input type="range" 
                        class="custom-slider" 
                        min="1" 
                        max="5" 
                        step="1" 
                        value="${this.userAnswers.get(1) || 3}"
                        id="maturitySlider">
                    <div class="slider-markers">
                        ${Array.from({length: 5}, (_, i) => 
                            `<div class="slider-marker" data-value="${i + 1}"></div>`
                        ).join('')}
                    </div>
                </div>
                <div class="slider-labels">
                    ${question.answers.map((answer, index) => 
                        `<div class="slider-label" data-value="${index + 1}">
                            ${answer.answerText}
                        </div>`
                    ).join('')}
                </div>
            </div>
            <div class="button-container">
                <button class="continue-button" onclick="AssessmentViewController.nextQuestion()">
                    Continue
                </button>
            </div>`;
    },
 
    updateUI(question) {
        const panel = document.querySelector('.glass-panel');
        
        // Check if it's the first question
        if (this.currentQuestionId === 1) {
            panel.innerHTML = this.createSliderUI(question);
            
            // Add slider event listener
            const slider = document.querySelector('#maturitySlider');
            const labels = document.querySelectorAll('.slider-label');
            const markers = document.querySelectorAll('.slider-marker');
            
            slider.addEventListener('input', function() {
                // Update labels and markers
                labels.forEach(label => {
                    label.classList.toggle('active', 
                        parseInt(label.dataset.value) === parseInt(this.value));
                });
                markers.forEach(marker => {
                    marker.classList.toggle('active', 
                        parseInt(marker.dataset.value) <= parseInt(this.value));
                });
            });
    
            // Trigger initial state
            slider.dispatchEvent(new Event('input'));
        } else {
            // Original question UI for questions 2-10
            panel.innerHTML = `
                <div class="progress-container">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(this.currentQuestionId - 1) / this.totalQuestions * 100}%"></div>
                    </div>
                    <div class="progress-text">Question ${this.currentQuestionId} of ${this.totalQuestions}</div>
                </div>
                <div class="chapter-label">${question.chapter}</div>
                <h2>${question.questionText}</h2>
                <div class="options-container">
                    ${question.answers.map(answer => `
                        <label class="option-item">
                            <input type="radio" name="answer" value="${answer.id}">
                            <span class="option-text">
                                <div class="option-text-content">${answer.answerText}</div>
                                ${answer.description ? `<span class="option-description">${answer.description}</span>` : ''}
                            </span>
                        </label>
                    `).join('')}
                </div>
                <div class="button-container">
                    ${this.currentQuestionId > 1 ? `<button class="back-button" onclick="AssessmentViewController.previousQuestion()">Back</button>` : ''}
                    <button class="continue-button" onclick="AssessmentViewController.nextQuestion()">
                        ${this.currentQuestionId === this.totalQuestions ? 'Complete' : 'Continue'}
                    </button>
                </div>`;
    
            if (this.userAnswers.has(this.currentQuestionId)) {
                const previousAnswer = this.userAnswers.get(this.currentQuestionId);
                document.querySelector(`input[value="${previousAnswer}"]`).checked = true;
            }
        }
    
        const imageContainer = document.querySelector('#questionImage');
        imageContainer.innerHTML = `<img src="${question.imagePath}" alt="Question visual">`;

        document.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', () => {
                const continueButton = document.querySelector('.continue-button');
                continueButton.classList.add('option-selected');
            });
        });
    },
 
    updateProgressBar() {
        const progress = document.querySelector('.progress-fill');
        if (progress) {
            progress.style.width = `${(this.currentQuestionId - 1) / this.totalQuestions * 100}%`;
        }
    },
 
    previousQuestion() {
        if (this.currentQuestionId > 1) {
            this.currentQuestionId--;
            this.loadQuestion(this.currentQuestionId);
        }
    },
 
    async submitAssessment() {
        try {
            console.log('Starting submission...');
            const answers = Array.from(this.userAnswers, ([questionId, answerId]) => ({
                questionId,
                answerId
            }));
            
            console.log('Submitting answers:', answers);
            
            const response = await fetch('/Assessment/SubmitAnswers', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'same-origin',  // Add this line
                body: JSON.stringify(answers)
            });
    
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                const errorData = await response.text();
                console.error('Submit error:', errorData);
                throw new Error(`Submission failed: ${errorData}`);
            }
    
            const result = await response.json();
            console.log('Submit result:', result);
            
            if (result.redirectUrl) {
                window.location.href = result.redirectUrl;
            } else {
                throw new Error('No redirect URL in response');
            }
        } catch (error) {
            console.error('Error in submitAssessment:', error);
            this.showNotification('Error submitting assessment. Please try again.', true);
        }
    },
 
    showNotification(message, isError = false) {
        // Implementation depends on your notification system
    },
 
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.nextQuestion();
            }
        });
    }
 };
 
 document.addEventListener('DOMContentLoaded', () => {
    AssessmentViewController.initialize();
 });