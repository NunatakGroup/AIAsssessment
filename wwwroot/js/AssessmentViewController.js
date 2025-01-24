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
                body: JSON.stringify({ questionId, answerId })
            });
            
            if (!response.ok) throw new Error('Failed to save answer');
            return await response.json();
        } catch (error) {
            console.error('Error saving answer:', error);
            throw error;
        }
    },

        async nextQuestion() {
            const selectedAnswer = document.querySelector('input[name="answer"]:checked');
            if (!selectedAnswer) {
                this.showNotification('Please select an answer', true);
                return;
            }
    
            const answerId = parseInt(selectedAnswer.value);
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
        } catch (error) {
            console.error('Error:', error);
        }
    },
 
    updateUI(question) {
        const panel = document.querySelector('.glass-panel');
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
        const imageContainer = document.querySelector('#questionImage');
        imageContainer.innerHTML = `<img src="${question.imagePath}" alt="Question visual">`;
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
            const answers = Array.from(this.userAnswers, ([questionId, answerId]) => ({
                questionId,
                answerId
            }));
            
            const response = await fetch('/Assessment/SubmitAnswers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(answers)
            });
    
            if (response.ok) {
                const result = await response.json();
                if (result.redirectUrl) {
                    window.location.href = result.redirectUrl;
                }
            }
        } catch (error) {
            this.showNotification('Error submitting assessment', true);
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