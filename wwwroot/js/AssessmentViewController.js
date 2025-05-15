// Views/Assessment/AssessmentViewController.js
// @ts-nocheck

const AssessmentViewController = {
    currentQuestionId: 1, // Starts at 1, but might be skipped (DO NOT CHANGE FOR LOGIC)
    displayQuestionNumber: 0, // --- NEW: Number shown in the UI ---
    totalQuestions: 0, // Actual total from backend (DO NOT CHANGE FOR LOGIC)
    displayTotalQuestions: 0, // --- NEW: Total shown in the UI ---
    userAnswers: new Map(),
    sessionId: localStorage.getItem('assessmentSessionId') || null, // Load session ID on init
    // Cache DOM references that are used repeatedly
    elements: {
        questionPanel: null,
        imageContainer: null,
        notificationArea: null,
        progressFill: null
    },

    async initialize() {
        localStorage.removeItem('assessmentSessionId'); // Ensure a fresh start every time page loads
        this.sessionId = null; // Reset internal state too
        this.cacheElements();
        await this.getTotalQuestions(); // Fetches the *actual* total

        // --- MODIFICATION START: Calculate display total ---
        this.displayTotalQuestions = this.totalQuestions > 0 ? this.totalQuestions - 1 : 0;

        // --- MODIFICATION START: Skip Question 1 on initial load ---
        if (this.currentQuestionId === 1) {
            await this.skipQuestion1AndLoadNext(); // Skip Q1 and load Q2 directly
        } else {
            // If resuming later (needs more logic for full resume, but set display number if needed)
            this.displayQuestionNumber = this.currentQuestionId > 1 ? this.currentQuestionId - 1 : 0; // Adjust display number if resuming past Q1
            await this.loadQuestion(this.currentQuestionId);
        }

        this.setupEventListeners();
    },

    // Cache DOM elements to avoid repeated queries
    cacheElements() {
        this.elements.questionPanel = document.getElementById('questionPanel');
        this.elements.imageContainer = document.getElementById('questionImage');
        this.elements.notificationArea = document.getElementById('notificationArea');
    },

    // --- MODIFICATION START: New function to handle skipping Q1 ---
    async skipQuestion1AndLoadNext() {
        try {
            const questionIdToSkip = 1;
            const defaultAnswerId = 1; // Default answer for the skipped slider

            await this.saveAnswer(questionIdToSkip, defaultAnswerId);
            this.userAnswers.set(questionIdToSkip, defaultAnswerId); // Keep track locally

            // Move to the next question (Question 2)
            this.currentQuestionId = 2;
            await this.loadQuestion(this.currentQuestionId);

        } catch (error) {
            console.error('Error during skipQuestion1AndLoadNext:', error);
            this.showNotification('Failed to start the assessment correctly. Please refresh.', true);
        }
    },
    // --- MODIFICATION END: New function to handle skipping Q1 ---

    async saveAnswer(questionId, answerId) {
        try {
            const response = await fetch('/Assessment/SaveAnswer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin',
                body: JSON.stringify({ questionId, answerId })
            });

            // Check for non-OK response status (e.g., 4xx, 5xx)
            if (!response.ok) {
                 // Try to get error details from the response body
                let errorDetails = `HTTP status ${response.status}`;
                try {
                    const errorResult = await response.json();
                    errorDetails = errorResult.message || errorResult.error || JSON.stringify(errorResult);
                } catch (e) {
                    // If response is not JSON, use status text
                    errorDetails = response.statusText || errorDetails;
                }
                throw new Error(`Failed to save answer. Server responded with: ${errorDetails}`);
            }

            const result = await response.json();

            // Store the session ID locally if returned
            if (result.sessionId) {
                this.sessionId = result.sessionId; // Store in controller instance
                localStorage.setItem('assessmentSessionId', result.sessionId);
            }
            return result;
        } catch (error) {
            console.error(`Error saving answer for Q${questionId}:`, error);
            throw error; // Re-throw error to be handled by caller
        }
    },

    async nextQuestion() {
        let answerId;

        if (this.currentQuestionId === 2) { // Handle Demographics submission
            const success = await this.saveDemographics();
            if (!success) return; // Stop if saving failed
        }
        // Handle standard questions (Q3 onwards)
        else {
            const selectedAnswer = document.querySelector('input[name="answer"]:checked');
            if (!selectedAnswer) {
                this.showNotification('Please select an answer', true);
                return; // Don't proceed if no answer selected
            }
            answerId = parseInt(selectedAnswer.value);

            // Save the standard answer
            try {
                await this.saveAnswer(this.currentQuestionId, answerId);
                this.userAnswers.set(this.currentQuestionId, answerId); // Keep track locally
            } catch (error) {
                this.showNotification('Error saving your answer. Please try again.', true);
                return; // Stop if saving failed
            }
        }

        // Proceed to next question or submit
        if (this.currentQuestionId === this.totalQuestions) {
            await this.submitAssessment();
        } else {
            this.currentQuestionId++;
            this.displayQuestionNumber++; // Increment display number for UI
            await this.loadQuestion(this.currentQuestionId);
        }
    },

    async getTotalQuestions() {
        try {
            const response = await fetch('/Assessment/GetTotalQuestions');
            if (!response.ok) throw new Error('Failed to get total questions count');
            this.totalQuestions = await response.json();
            // Update total in UI only if the element exists (might not on initial skip)
            const totalEl = document.getElementById('totalQuestions');
            if (totalEl) totalEl.textContent = this.totalQuestions;
        } catch (error) {
            console.error('Error getting total questions:', error);
            this.showNotification('Error loading assessment configuration.', true);
        }
    },

    async loadQuestion(id) {
        const panel = this.elements.questionPanel;
        if (!panel) {
             console.error("Question panel not found!");
             return;
        }
        panel.style.opacity = '0';
        panel.style.transform = 'translateY(20px)';

        try {
            const response = await fetch(`/Assessment/GetQuestion/${id}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch question ${id}. Status: ${response.status}`);
            }
            const question = await response.json();

            // Use requestAnimationFrame for smoother transitions
            requestAnimationFrame(() => {
                this.updateUI(question);
                // Use another requestAnimationFrame to ensure the previous style changes have taken effect
                requestAnimationFrame(() => {
                    panel.style.opacity = '1';
                    panel.style.transform = 'translateY(0)';
                });
            });

        } catch (error) {
            console.error('Error loading question:', error);
            this.showNotification('Error loading the next question. Please try refreshing.', true);
            panel.style.opacity = '1';
            panel.style.transform = 'translateY(0)';
            panel.innerHTML = `<p class="error-message">Could not load question. Please try again later.</p>`;
        }
    },

    // createDemographicsUI remains the same
    createDemographicsUI(question) {
        return `
            <div class="progress-container">
                <div class="progress-bar">
                    <div class="progress-fill" id="progressFill"></div>
                </div>
                <div class="progress-text">
                    Question <span id="currentQuestionNumber">${this.displayQuestionNumber}</span> of <span id="totalQuestions">${this.displayTotalQuestions}</span>
                </div>
            </div>
            <div class="question-header">
                <div class="question-content">
                    <div class="chapter-label">${question.chapter}</div>
                    <h2>${question.questionText}</h2>
                </div>
                </div>
            <div class="demographics-container">
                <div class="form-group">
                    <label for="businessSector">Business Sector</label>
                    <select id="businessSector" class="form-control" required>
                        <option value="" disabled selected>Select your business sector</option>
                        <option value="Aerospace-Defense">Aerospace & Defense</option>
                        <option value="Agriculture">Agriculture</option>
                        <option value="Automotive">Automotive</option>
                        <option value="Chemical">Chemical</option>
                        <option value="Communications">Communications</option>
                        <option value="Construction">Construction</option>
                        <option value="Consulting">Consulting</option>
                        <option value="E-Commerce">E-Commerce</option>
                        <option value="Education">Education</option>
                        <option value="Energy-Utilities">Energy & Utilities</option>
                        <option value="Fashion-Apparel">Fashion & Apparel</option>
                        <option value="Finance">Finance</option>
                        <option value="Food-Beverage">Food & Beverage</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Hospitality">Hospitality</option>
                        <option value="Insurance">Insurance</option>
                        <option value="IT-Technology">IT & Technology</option>
                        <option value="Logistics-Transportation">Logistics & Transportation</option>
                        <option value="Manufacturing">Manufacturing</option>
                        <option value="Media-Entertainment">Media & Entertainment</option>
                        <option value="Pharmaceuticals">Pharmaceuticals</option>
                        <option value="Real-Estate">Real Estate</option>
                        <option value="Retail">Retail</option>
                        <option value="Sports-Fitness">Sports & Fitness</option>
                        <option value="Telecommunications">Telecommunications</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div class="form-group" id="otherSectorGroup" style="display: none;">
                    <label for="otherBusinessSector">Please specify</label>
                    <input type="text" id="otherBusinessSector" class="form-control">
                </div>
                <div class="form-group">
                    <label for="companySize">Company Size</label>
                    <select id="companySize" class="form-control" required>
                        <option value="" disabled selected>Select your company size</option>
                        <option value="1-50">1-50 employees</option>
                        <option value="51-200">51-200 employees</option>
                        <option value="201-1000">201-1000 employees</option>
                        <option value="1001+">1001+ employees</option>
                    </select>
                </div>
            </div>
            <div class="button-container">
                ${this.currentQuestionId > 2 ? `<button class="back-button" onclick="AssessmentViewController.previousQuestion()">Back</button>` : ''}
                <button class="continue-button" onclick="AssessmentViewController.nextQuestion()">
                    Continue
                </button>
            </div>`;
    },

    // createStandardQuestionUI remains the same
    createStandardQuestionUI(question) {
        return `
            <div class="progress-container">
                <div class="progress-bar">
                    <div class="progress-fill" id="progressFill"></div>
                </div>
                <div class="progress-text">
                    Question <span id="currentQuestionNumber">${this.displayQuestionNumber}</span> of <span id="totalQuestions">${this.displayTotalQuestions}</span>
                </div>
            </div>
            <div class="question-header">
                <div class="question-content">
                    <div class="chapter-label">${question.chapter}</div>
                    <h2>${question.questionText}</h2>
                </div>
                </div>
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
                ${this.currentQuestionId > 2 ? `<button class="back-button" onclick="AssessmentViewController.previousQuestion()">Back</button>` : ''}
                <button class="continue-button" onclick="AssessmentViewController.nextQuestion()">
                    ${this.currentQuestionId === this.totalQuestions ? 'Complete' : 'Continue'}
                </button>
            </div>`;
    },

    updateUI(question) {
        const panel = this.elements.questionPanel;
        const imageContainer = this.elements.imageContainer;
        if (!panel || !imageContainer) return; // Exit if elements not found

        // Update progress bar elements if they exist
        const currentNumEl = document.getElementById('currentQuestionNumber');
        const totalNumEl = document.getElementById('totalQuestions');
        if (currentNumEl) currentNumEl.textContent = this.currentQuestionId;
        if (totalNumEl) totalNumEl.textContent = this.totalQuestions;
        
        // Preserve existing classes that might be important for styling
        // Only remove chapter-specific classes
        panel.classList.remove('chapter-1', 'chapter-2', 'chapter-3');
        // Add the appropriate chapter class
        panel.classList.add(`chapter-${this.determineCurrentChapter()}`);

        let questionHtml = '';
        let showImage = true;

        if (question.type === 1) { // Demographics (Question 2 in the new flow)
            questionHtml = this.createDemographicsUI(question);
            showImage = true;

            // Defer event binding to next tick to ensure DOM is ready
            setTimeout(() => {
                const businessSector = document.getElementById('businessSector');
                const otherSectorGroup = document.getElementById('otherSectorGroup');
                if (businessSector && otherSectorGroup) {
                    businessSector.addEventListener('change', function() {
                        otherSectorGroup.style.display = (this.value === 'Other') ? 'block' : 'none';
                    });
                    if (businessSector.value === 'Other') {
                       businessSector.dispatchEvent(new Event('change'));
                    }
                }
            }, 0);
        }
        // Standard questions (Q3 onwards)
        else {
            questionHtml = this.createStandardQuestionUI(question);
            showImage = true;

            // Defer event binding to next tick to ensure DOM is ready
            setTimeout(() => {
                // Restore previously selected answer if exists
                if (this.userAnswers.has(this.currentQuestionId)) {
                    const previousAnswerId = this.userAnswers.get(this.currentQuestionId);
                    const radioToCheck = document.querySelector(`input[name="answer"][value="${previousAnswerId}"]`);
                    if (radioToCheck) {
                        radioToCheck.checked = true;
                        const optionItem = radioToCheck.closest('.option-item');
                        if (optionItem) optionItem.classList.add('selected');
                    }
                }

                // Add event listeners for radio buttons
                const radioButtons = document.querySelectorAll('input[type="radio"][name="answer"]');
                radioButtons.forEach(radio => {
                    radio.addEventListener('change', (e) => {
                        // First remove selected class from all options
                        document.querySelectorAll('.option-item').forEach(item => item.classList.remove('selected'));
                        
                        // Add selected class to the checked option
                        if (e.target.checked) {
                            const optionItem = e.target.closest('.option-item');
                            if (optionItem) optionItem.classList.add('selected');
                        }
                        
                        // Add option-selected class to continue button
                        const continueButton = document.querySelector('.continue-button');
                        if (continueButton) continueButton.classList.add('option-selected');
                    });
                });
            }, 0);
        }

        panel.innerHTML = questionHtml;

        // Update image container
        if (showImage && question.imagePath) {
            imageContainer.innerHTML = `<img src="${question.imagePath}" alt="Question visual">`;
            imageContainer.style.display = '';
        } else {
            imageContainer.innerHTML = '';
            imageContainer.style.display = 'none';
        }

        this.updateProgressBar(); // Update progress bar after content injection
    },

    updateProgressBar() {
        const progressFill = document.getElementById('progressFill');
        if (!progressFill || this.displayTotalQuestions <= 0) {
            if (progressFill) progressFill.style.width = '0%';
            return;
        }
        
        const percentage = Math.max(0, ((this.displayQuestionNumber - 1) / this.displayTotalQuestions) * 100);
        progressFill.style.width = `${percentage}%`;

        const chapterNumber = this.determineCurrentChapter();
        document.documentElement.style.setProperty(
            '--current-chapter-gradient',
            `var(--chapter${chapterNumber}-gradient)`
        );
    },

    determineCurrentChapter() {
        if (this.currentQuestionId <= 5) return 1; // Q1(skipped), Q2(Demo), Q3, Q4, Q5 -> Chapter 1 color
        if (this.currentQuestionId <= 8) return 2; // Q6, Q7, Q8 -> Chapter 2 color
        return 3; // Q9, Q10, Q11 -> Chapter 3 color
    },

    previousQuestion() {
        // Only allow going back if the current question ID is greater than 2
        if (this.currentQuestionId > 2) {
            this.currentQuestionId--;
            this.displayQuestionNumber--; // Decrement display number for UI
            this.loadQuestion(this.currentQuestionId);
        }
    },

    async saveDemographics() {
        try {
            const businessSectorEl = document.getElementById('businessSector');
            const otherBusinessSectorEl = document.getElementById('otherBusinessSector');
            const companySizeEl = document.getElementById('companySize');

            if (!businessSectorEl || !companySizeEl) {
                this.showNotification('Error: Form fields not found', true);
                return false;
            }

            const businessSector = businessSectorEl.value;
            const companySize = companySizeEl.value;
            const otherBusinessSector = (businessSector === 'Other' && otherBusinessSectorEl) ? otherBusinessSectorEl.value : null;

            if (!businessSector) { 
                this.showNotification('Please select a Business Sector', true); 
                return false; 
            }
            if (businessSector === 'Other' && !otherBusinessSector) { 
                this.showNotification('Please specify your Business Sector', true); 
                return false; 
            }
            if (!companySize) { 
                this.showNotification('Please select a Company Size', true); 
                return false; 
            }

            const demographicData = {
                businessSector: businessSector,
                otherBusinessSector: otherBusinessSector,
                companySize: companySize,
                sessionId: this.sessionId
            };

            const response = await fetch('/Assessment/SaveDemographics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify(demographicData)
            });

            if (!response.ok) { 
                const errorText = await response.text(); 
                throw new Error(`Failed to save demographics: ${errorText}`); 
            }
            
            const result = await response.json();

            if (result.sessionId) { 
                this.sessionId = result.sessionId; 
                localStorage.setItem('assessmentSessionId', result.sessionId); 
            }
            return true;
        } catch (error) {
            console.error('Error saving demographics:', error);
            this.showNotification(`Error saving demographic information: ${error.message}`, true);
            return false;
        }
    },

    async submitAssessment() {
        try {
            if (!this.userAnswers.has(1)) {
                 this.userAnswers.set(1, 3); // Ensure default Q1 answer is included
            }

            const answers = Array.from(this.userAnswers, ([questionId, answerId]) => ({
                questionId, answerId, sessionId: this.sessionId
            }));

            const response = await fetch('/Assessment/SubmitAnswers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify(answers)
            });

            if (!response.ok) {
                const errorData = await response.text();
                let errorMessage = `Submission failed (Status: ${response.status}).`;
                try { 
                    const errorJson = JSON.parse(errorData); 
                    errorMessage = errorJson.error || errorJson.message || errorMessage; 
                }
                catch (e) { 
                    errorMessage = errorData || errorMessage; 
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();

            if (result.redirectUrl) { 
                window.location.href = result.redirectUrl; 
            }
            else { 
                throw new Error('Submission completed, but failed to redirect.'); 
            }
        } catch (error) {
            console.error('Error in submitAssessment:', error);
            this.showNotification(`Error submitting assessment: ${error.message}. Please try again.`, true);
        }
    },

    showNotification(message, isError = false) {
        const notificationArea = this.elements.notificationArea || document.getElementById('notificationArea');
        if (!notificationArea) {
            alert(message);
            return;
        }
        
        const notification = document.createElement('div');
        notification.className = `notification ${isError ? 'is-error' : 'is-info'}`;
        notification.textContent = message;
        notificationArea.appendChild(notification);
        
        // Use setTimeout to automatically remove notification after 5 seconds
        setTimeout(() => notification.remove(), 5000);
    },

    setupEventListeners() {
        // Remove existing event listeners before adding new ones to prevent duplicates
        document.removeEventListener('keydown', this.boundHandleKeyDown);
        
        // Bind methods once and store references to avoid creating new functions on each call
        this.boundHandleKeyDown = this.handleKeyDown.bind(this);
        document.addEventListener('keydown', this.boundHandleKeyDown);
    },

    handleKeyDown(e) {
        if (e.key === 'Enter') {
            if (e.target.tagName === 'INPUT' && e.target.type !== 'radio' && e.target.type !== 'checkbox') {
                 e.preventDefault();
            }
            if (document.activeElement?.tagName !== 'TEXTAREA' && document.activeElement?.tagName !== 'SELECT') {
                const continueButton = document.querySelector('.continue-button');
                if (continueButton) { continueButton.click(); }
            }
        }
    }
};

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    AssessmentViewController.initialize();
});