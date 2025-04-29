// wwwroot/js/Views/Results/ResultsViewController.js

/**
 * Handles interactive visual effects on the page, like glowing dots.
 */
const InteractiveEffects = {
    animationFrameId: null,
    resizeObserver: null,
    canvas: null,
    container: null,

    initialize() {
        this.initializeGlowingDots();
    },

    initializeGlowingDots() {
        this.canvas = document.createElement('canvas');
        this.container = document.querySelector('.results-container'); // Target container

        if (!this.container || !this.canvas) {
             console.warn("Glowing dots container or canvas couldn't be initialized.");
             return;
        }
        const ctx = this.canvas.getContext('2d');
        if (!ctx) {
             console.warn("Could not get 2D context for glowing dots canvas.");
             return;
        }

        this.container.style.position = 'relative'; // Ensure container can position the absolute canvas
        this.container.appendChild(this.canvas);
        this.canvas.className = 'glowing-dots'; // Assign class for potential CSS targeting
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%'; // Make canvas fill container width
        this.canvas.style.height = '100%'; // Make canvas fill container height
        this.canvas.style.pointerEvents = 'none'; // Allow clicks to pass through
        this.canvas.style.zIndex = '-1'; // Position behind content

        // Use arrow function to maintain 'this' context or bind explicitly
        const resize = () => {
            if (!this.container || !this.canvas) return; // Add check
            this.canvas.width = this.container.offsetWidth;
            this.canvas.height = this.container.offsetHeight;
             // console.log(`Glowing dots canvas resized to: ${this.canvas.width}x${this.canvas.height}`);
        };

        resize(); // Initial size
        // Use ResizeObserver for more reliable container resizing detection
        this.resizeObserver = new ResizeObserver(resize);
        this.resizeObserver.observe(this.container);
        // Fallback for window resize
        window.addEventListener('resize', resize);


        const dots = [];
        const numDots = Math.min(70, Math.floor(window.innerWidth / 30)); // Responsive number of dots
        const dotColor = 'rgba(160, 208, 203, 0.7)'; // Base color with alpha

        // Function to create a dot object
        const createDot = () => ({
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            radius: Math.random() * 1.2 + 0.4, // Slightly smaller, less variation
            vx: (Math.random() - 0.5) * 0.2, // Slower velocity
            vy: (Math.random() - 0.5) * 0.2,
            alpha: Math.random() * 0.3 + 0.2 // Lower alpha range
        });

        // Populate dots array
        for (let i = 0; i < numDots; i++) {
            dots.push(createDot());
        }

        // Animation loop
        const animate = () => {
            if (!this.canvas || !ctx) return; // Check if canvas exists
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            dots.forEach(dot => {
                dot.x += dot.vx; dot.y += dot.vy;
                // Boundary checks (wrap around)
                if (dot.x < -dot.radius) dot.x = this.canvas.width + dot.radius;
                if (dot.x > this.canvas.width + dot.radius) dot.x = -dot.radius;
                if (dot.y < -dot.radius) dot.y = this.canvas.height + dot.radius;
                if (dot.y > this.canvas.height + dot.radius) dot.y = -dot.radius;

                ctx.beginPath();
                ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(160, 208, 203, ${dot.alpha})`;
                ctx.fill();
            });
            this.animationFrameId = requestAnimationFrame(animate);
        };
        animate(); // Start animation

         // Ensure cleanup method uses correct 'this'
         this.stopGlowingDots = () => {
             if (this.animationFrameId) {
                 cancelAnimationFrame(this.animationFrameId);
             }
             window.removeEventListener('resize', resize); // Use the same resize function reference
             if (this.resizeObserver && this.container) {
                 this.resizeObserver.unobserve(this.container);
             }
             if (this.canvas && this.canvas.parentNode) {
                 this.canvas.parentNode.removeChild(this.canvas);
             }
             console.log("Glowing dots animation stopped and cleaned up.");
             this.canvas = null; // Clear references
             this.container = null;
             this.resizeObserver = null;
         };
    }
};

/**
 * Main controller for the Results page logic.
 */
const ResultsViewController = {
    contactOptInRequested: false,
    resultsData: null, // Cache results data

    /**
     * Determines the maturity level based on the score.
     * @param {number|null} score - The average score.
     * @returns {string} The maturity level string ('Exploring', 'Building', 'Pioneering', 'N/A').
     */
    getMaturityLevel(score) {
        if (score === null || score === undefined || isNaN(score)) return "N/A";
        // Adjust score thresholds if needed to match exact desired ranges
        if (score < 2.0) return "Exploring";
        if (score < 4.0) return "Building";
        return "Pioneering";
    },

    async initialize() {
        console.log('Initializing ResultsViewController');
        this.initializeModal(); // Setup modal listeners

        // --- START: ADD Loading Overlay Logic ---
        const loadingOverlay = document.getElementById('resultsLoadingOverlay');
        if (!loadingOverlay) {
            console.error("Loading overlay element not found!");
            // Handle error or proceed without overlay
        } else {
            // Make overlay visible BEFORE starting data load
            loadingOverlay.classList.add('visible'); 
        }
        // --- END: ADD Loading Overlay Logic ---

        let results = null; // Define results variable outside try block
        try {
            results = await this.loadResults(); // Fetch data (potentially triggers AI generation)

            if (results) {
                // Data loaded successfully, initialize UI components
                this.initializeChart(results);
                this.displayCategoryScores(results);
                // Accordion content is loaded later via showDetailedResults -> loadDetailedResults
            } else {
                // Failed to load results data (error handled in loadResults)
                console.error("Failed to load results, cannot initialize page components.");
                // displayErrorMessage is likely called within loadResults on error
            }

        } catch (error) {
             // Catch any unexpected errors during initialization *after* loadResults might have succeeded/failed
             console.error("Error during initialization after loading results:", error);
             this.displayErrorMessage("An unexpected error occurred while initializing the results display.");

        } finally {
             // --- START: ADD Hiding Overlay Logic ---
             // ALWAYS hide the overlay once processing is done or failed
             if (loadingOverlay) {
                 loadingOverlay.classList.remove('visible');
             }
             // --- END: ADD Hiding Overlay Logic ---
        }


        // Initialize non-data-dependent effects last (if any)
        InteractiveEffects.initialize();

    },

    /**
     * Fetches assessment results from the backend API.
     * Uses cached data if available.
     * @returns {Promise<object|null>} A promise that resolves with the results object or null on error.
     */
    async loadResults() {
        // Return cached data if available
        if (this.resultsData) {
            console.log('Returning cached results data.');
            return this.resultsData;
        }

        console.log('Attempting to load results from /Results/GetResults');
        try {
            const response = await fetch('/Results/GetResults');
            if (!response.ok) {
                let errorDetails = `HTTP status ${response.status} (${response.statusText})`;
                try {
                    const errorBody = await response.text();
                    console.error("Error response body:", errorBody);
                    // Try to parse common error structures if JSON
                    try { const jsonError = JSON.parse(errorBody); errorDetails = jsonError.error || jsonError.message || errorBody; } catch { errorDetails = errorBody || errorDetails; }
                } catch { /* Ignore if reading body fails */ }
                throw new Error(`Failed to load results: ${errorDetails}`);
            }
            const results = await response.json();
            console.log('Results loaded successfully:', results);

            // Basic validation of received data structure
            if (!results || typeof results !== 'object' || !results.userChartData || !results.benchmarkChartData || !results.categoryResults) {
                 console.error("Received results data structure is invalid:", results);
                 throw new Error("Received invalid results data from server.");
            }

            this.resultsData = results; // Cache the successfully loaded data
            return results;
        } catch (error) {
            console.error('Error loading results:', error);
            this.displayErrorMessage(`Error loading assessment results: ${error.message}`);
            return null; // Return null on failure
        }
    },

    /**
     * Displays category average scores with maturity labels.
     * Adds data-category attribute for styling.
     * @param {object} results - The results data object from the backend.
     */
    displayCategoryScores(results) {
        console.log('Displaying category scores with maturity levels');
        const scoresContainer = document.querySelector('.category-scores');
        if (!scoresContainer) { console.warn("Category scores container not found."); return; }
        if (!results?.categoryResults || !Array.isArray(results.categoryResults)) {
            console.error("Invalid or missing categoryResults data.");
            scoresContainer.innerHTML = '<p class="error-message">Could not display category scores.</p>';
            return;
        }

        // Generate HTML for each score item
        const categoryScores = results.categoryResults.map(category => {
            const average = typeof category.average === 'number' ? category.average : null;
            const averageFormatted = average !== null ? average.toFixed(1) : 'N/A';
            const name = category.name || 'Unnamed Category'; // Use the category name
            const maturityLevel = this.getMaturityLevel(average); 
            const maturityClass = maturityLevel.toLowerCase().replace(/\s+/g, '-'); 

            // --- Add data-category attribute here ---
            return `
                <div class="score-item" data-category="${name}"> 
                    <div class="score-label">${name}</div>
                    <div class="score-value-container">
                        <div class="score-value">${averageFormatted}/5.0</div>
                        <div class="score-maturity maturity-${maturityClass}">${maturityLevel}</div>
                    </div>
                </div>
            `;
            // --- End change ---
        }).join('');

        scoresContainer.innerHTML = categoryScores;
    },

    /**
     * Initializes the Radar Chart using Chart.js.
     * @param {object} results - The results data object.
     */
    initializeChart(results) {
        const canvasElement = document.getElementById('radarChart');
        if (!canvasElement) { console.error("Radar chart canvas element ('radarChart') not found!"); return; }
        const ctx = canvasElement.getContext('2d');
        if (!ctx) { console.error("Could not get 2D context for radar chart canvas."); return; }

        // Validate the necessary data exists and has correct length
        if (!results?.userChartData || !Array.isArray(results.userChartData) || results.userChartData.length !== 9 ||
            !results?.benchmarkChartData || !Array.isArray(results.benchmarkChartData) || results.benchmarkChartData.length !== 9) {
             console.error("Chart data (userChartData or benchmarkChartData) is missing, invalid, or has incorrect length:", results);
             this.displayErrorMessage("Could not display the comparison chart due to missing or invalid data.", canvasElement.closest('.glass-panel')); // Display error inside the chart panel
             // Optionally hide the canvas or show a placeholder
             canvasElement.style.display = 'none';
             return;
        }

        console.log("Initializing chart with User Data:", results.userChartData, "and Benchmark Data:", results.benchmarkChartData);

        const chartLabels = [
            'New AI Products (Q3)', 'Process Optimization (Q4)', 'Impact Management (Q5)',
            'AI Governance (Q6)', 'Organization Culture (Q7)', 'Skills & Competencies (Q8)',
            'AI Tools & Platform (Q9)', 'Data Infrastructure (Q10)', 'Security & Privacy (Q11)'
        ];

        const chartDatasets = [
            {
                label: 'Your Score', data: results.userChartData,
                backgroundColor: 'rgba(160, 208, 203, 0.25)', borderColor: '#A0D0CB',
                pointBackgroundColor: '#A0D0CB', pointBorderColor: '#fff', pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#62B2A9', borderWidth: 2, pointRadius: 4, pointHoverRadius: 6,
                fill: true, order: 1
            },
            {
                label: 'Benchmark', data: results.benchmarkChartData,
                backgroundColor: 'rgba(255, 255, 255, 0)', borderColor: 'rgba(255, 255, 255, 0.4)', // Slightly more visible benchmark line
                borderDash: [4, 4], pointRadius: 0, pointHoverRadius: 0, borderWidth: 1.5,
                fill: false, order: 2
            }
        ];

        const chartData = { labels: chartLabels, datasets: chartDatasets };

        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false, // Crucial for sizing within flex container
            plugins: {
                legend: {
                    display: true, position: 'bottom', align: 'center',
                    labels: { color: 'rgba(255, 255, 255, 0.9)', padding: 15, usePointStyle: true, pointStyle: 'circle', font: { size: 11 }, boxWidth: 8 }
                },
                tooltip: {
                    enabled: true, backgroundColor: 'rgba(0, 0, 0, 0.8)', titleFont: { size: 12 }, bodyFont: { size: 11 }, padding: 8,
                    callbacks: { label: (context) => `${context.dataset.label}: ${typeof context.raw === 'number' ? context.raw.toFixed(1) : 'N/A'} / 5` }
                }
            },
            scales: {
                r: { // Radial axis (0-5 scale)
                    beginAtZero: true, max: 5, min: 0,
                    ticks: { stepSize: 1, display: true, color: 'rgba(255, 255, 255, 0.6)', backdropColor: 'transparent', font: { size: 9 }, z: 1 },
                    grid: { circular: true, color: 'rgba(255, 255, 255, 0.1)', lineWidth: 1 },
                    pointLabels: { font: { size: (context) => context.chart.width < 400 ? 9 : 11 }, color: 'rgba(255, 255, 255, 0.8)', padding: 8 }, // Adjusted padding
                    angleLines: { color: 'rgba(255, 255, 255, 0.1)', lineWidth: 1 }
                }
            },
            elements: { line: { tension: 0.1 } } // Slight curve to lines
        };

        // Destroy previous chart instance if it exists
        let existingChart = Chart.getChart(canvasElement);
        if (existingChart) {
            console.log("Destroying existing chart instance before creating new one.");
            existingChart.destroy();
        }

        // Create the new chart instance
        try {
            console.log("Creating new Chart instance.");
            new Chart(ctx, { type: 'radar', data: chartData, options: chartOptions });
            canvasElement.style.display = ''; // Ensure canvas is visible if previously hidden
            console.log("Radar chart initialized successfully.");
        } catch (error) {
            console.error("Error creating Chart.js instance:", error);
            this.displayErrorMessage("An error occurred while displaying the comparison chart.", canvasElement.closest('.glass-panel'));
            canvasElement.style.display = 'none';
        }
    },

    /**
     * Sets up event listeners for the contact modal form and buttons.
     */
    initializeModal() {
        console.log('Initializing contact modal and buttons');
        const form = document.getElementById('contactForm');
        const modal = document.getElementById('contactModal');
        const openModalButton = document.getElementById('unlockResultsButton');
        const contactOptInButton = document.getElementById('contactOptInButton');
        const closeButton = modal?.querySelector('.close-modal-button'); // Use class selector

        if (form) {
            form.addEventListener('submit', this.handleModalSubmit.bind(this));
        } else { console.warn("Contact form (#contactForm) not found."); }

        if (modal) {
            // Ensure modal is hidden initially using CSS classes/styles
            modal.style.display = 'none';
            modal.classList.remove('active'); // If using class for display

            if (openModalButton) {
                 openModalButton.addEventListener('click', () => {
                     this.contactOptInRequested = false; // Ensure flag is reset
                     this.showContactModal();
                 });
             } else { console.warn("Unlock Results button (#unlockResultsButton) not found."); }

             if (contactOptInButton) {
                 contactOptInButton.addEventListener('click', this.handleOptInButtonClick.bind(this)); // Use specific handler
             } else { console.warn("Contact Opt-In button (#contactOptInButton) not found."); }

             // Close modal button listener
             if (closeButton) {
                 closeButton.addEventListener('click', () => this.hideModal());
             } else { console.warn("Close modal button (.close-modal-button) not found inside modal."); }

             // Optional: Close modal on background click
            modal.addEventListener('click', (event) => {
                // Check if the click is directly on the overlay (modal variable)
                if (event.target === modal) {
                    this.hideModal();
                }
            });

        } else { console.warn("Contact modal container (#contactModal) not found."); }
    },

    /**
     * Shows the contact modal using CSS transitions.
     */
    showContactModal() {
        console.log('Showing contact modal');
        const modalOverlay = document.getElementById('contactModal');
        if (modalOverlay) {
            modalOverlay.style.display = 'block';
            // Use requestAnimationFrame to ensure display:block is applied before adding class
            requestAnimationFrame(() => {
                modalOverlay.classList.add('active'); // Trigger fade-in/scale-up animation
            });
        }
    },

    /**
     * Hides the contact modal using CSS transitions.
     */
    hideModal() {
        console.log('Hiding contact modal');
        const modalOverlay = document.getElementById('contactModal');
        if (modalOverlay) {
            modalOverlay.classList.remove('active'); // Trigger fade-out/scale-down animation
            // Wait for transition to finish before setting display:none
            // Use event listener for transitionend for robustness
            const modalContent = modalOverlay.querySelector('.contact-modal'); // Get the inner modal
            const handleTransitionEnd = () => {
                modalOverlay.style.display = 'none';
                modalContent.removeEventListener('transitionend', handleTransitionEnd);
            };
            if (modalContent) {
                 modalContent.addEventListener('transitionend', handleTransitionEnd);
            } else {
                 // Fallback timeout if inner modal not found or transition doesn't fire
                 setTimeout(() => { modalOverlay.style.display = 'none'; }, 300); // Match CSS transition duration
            }
        }
    },

    /**
 * Handles the click on the "Contact Me" opt-in button.
 */
handleOptInButtonClick() {
    console.log('Contact Me & Opt-In button clicked.');
    const detailedResultsSection = document.querySelector('.detailed-results');

    // Check if detailed results are visible (unlocked)
    if (detailedResultsSection && !detailedResultsSection.classList.contains('hidden')) {
        console.log('Detailed results already unlocked. Sending opt-in update directly.');
        this.sendOptInUpdateRequest(true); // Send request to update opt-in to TRUE
    } else {
        console.log('Detailed results not yet unlocked. Showing modal with opt-in request.');
        this.contactOptInRequested = true; // Set flag BEFORE showing modal
        this.showContactModal();
    }
},

/**
 * Sends an asynchronous request to update the ContactOptIn flag.
 * Shows a loading state on the button during the request.
 * @param {boolean} optInValue - The value to set for ContactOptIn.
 */
async sendOptInUpdateRequest(optInValue) {
    const optInMessageElement = document.getElementById('optInMessage');
    if (optInMessageElement) optInMessageElement.style.display = 'none'; // Hide previous message

    // --- Get button elements ---
    const contactOptInButton = document.getElementById('contactOptInButton');
    // Ensure elements exist before proceeding
    if (!contactOptInButton) {
         console.error("Contact Me button (#contactOptInButton) not found.");
         // Optionally show an error to the user
         if (optInMessageElement) {
             optInMessageElement.textContent = 'Error: UI element missing.';
             optInMessageElement.className = 'opt-in-message error';
             optInMessageElement.style.display = 'block';
         }
         return; // Stop execution if button isn't found
    }
    const buttonText = contactOptInButton.querySelector('.button-text');
    const buttonLoading = contactOptInButton.querySelector('.button-loading');
     // Ensure inner spans exist
    if (!buttonText || !buttonLoading) {
         console.error("Required spans (.button-text, .button-loading) not found inside #contactOptInButton.");
         if (optInMessageElement) {
             optInMessageElement.textContent = 'Error: Button structure incorrect.';
             optInMessageElement.className = 'opt-in-message error';
             optInMessageElement.style.display = 'block';
         }
         return; // Stop execution
    }
    // --- End Get button elements ---


    console.log(`Sending request to update ContactOptIn to ${optInValue}`);

    // --- Start Loading State ---
    contactOptInButton.disabled = true;
    buttonText.classList.add('hidden');
    buttonLoading.classList.remove('hidden');
    let isSuccess = false; // Flag to track success for finally block
    // ---

    try {
        const response = await fetch('/Results/OptInContact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ContactOptIn: optInValue })
        });

        const result = await response.json(); // Always try to parse JSON response

        if (response.ok) {
            console.log('ContactOptIn update successful:', result.message);
            isSuccess = true; // Mark as successful

            // Display success notification with custom message
            if (result.notification) {
                this.showNotification(result.notification, 'success', 8000);
            } else {
                // Provide a default success message if needed
                 this.showNotification('Contact preference updated.', 'success', 5000); 
            }

            if (optInMessageElement) {
                optInMessageElement.textContent = result.message || 'Contact preference updated successfully.';
                optInMessageElement.className = 'opt-in-message success'; // Add class for styling
                optInMessageElement.style.display = 'block';
            }

            // Update button text content for when it's reshown
            buttonText.textContent = 'Preference Saved';

            // Button remains disabled on success (handled in finally)

        } else {
            // Handle specific known errors or general failure
            console.error(`ContactOptIn update failed (${response.status}):`, result?.error || 'Unknown server error');
            throw new Error(result?.error || `Request failed with status ${response.status}`);
        }
    } catch (error) {
        console.error('Error sending ContactOptIn update request:', error);
        isSuccess = false; // Mark as failed
        if (optInMessageElement) {
            optInMessageElement.textContent = `Error: ${error.message || 'Could not update preference.'}`;
            optInMessageElement.className = 'opt-in-message error'; // Add class for styling
            optInMessageElement.style.display = 'block';
        }
        // Restore original button text content for when it's reshown
         buttonText.textContent = 'Contact Me';

        // Re-enable button on error (handled in finally)
    } finally {
        // --- Stop Loading State ---
        buttonLoading.classList.add('hidden'); // Hide spinner/saving text
        buttonText.classList.remove('hidden'); // Show button text (either "Preference Saved" or "Contact Me")

        // Keep button disabled ONLY on success, otherwise re-enable it
        contactOptInButton.disabled = isSuccess;

         console.log(`Finished loading state for Contact Me button. Success: ${isSuccess}`);
        // ---
    }

    // Auto-hide message after a few seconds (if not showing notification or if desired regardless)
    if (optInMessageElement && optInMessageElement.style.display === 'block') {
        setTimeout(() => {
            if (optInMessageElement) {
                optInMessageElement.style.display = 'none';
            }
        }, 6000); // Hide after 6 seconds
    }
}, // End of sendOptInUpdateRequest


    /**
 * Shows a notification message to the user.
 * @param {string} message - The message to display.
 * @param {string} type - The notification type ('success', 'info', 'warning', 'error').
 * @param {number} duration - How long to show the notification in milliseconds.
 */
showNotification: function(message, type = 'success', duration = 5000) {
    const notificationId = 'results-notification';
    let notification = document.getElementById(notificationId);
    
    // Create notification element if it doesn't exist
    if (!notification) {
        notification = document.createElement('div');
        notification.id = notificationId;
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.maxWidth = '400px';
        notification.style.padding = '15px 20px';
        notification.style.borderRadius = '6px';
        notification.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        notification.style.zIndex = '9999';
        notification.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        document.body.appendChild(notification);
    }
    
    // Set styling based on notification type
    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#E8F5E9';
            notification.style.color = '#2E7D32';
            notification.style.borderLeft = '4px solid #2E7D32';
            break;
        case 'info':
            notification.style.backgroundColor = '#E3F2FD';
            notification.style.color = '#1565C0';
            notification.style.borderLeft = '4px solid #1565C0';
            break;
        case 'warning':
            notification.style.backgroundColor = '#FFF8E1';
            notification.style.color = '#F57F17';
            notification.style.borderLeft = '4px solid #F57F17';
            break;
        case 'error':
            notification.style.backgroundColor = '#FFEBEE';
            notification.style.color = '#C62828';
            notification.style.borderLeft = '4px solid #C62828';
            break;
    }
    
    // Set the message content
    notification.innerHTML = `
        <div style="display: flex; align-items: center;">
            <div style="flex-grow: 1; font-weight: 500;">${message}</div>
            <button style="background: none; border: none; cursor: pointer; font-size: 18px; margin-left: 10px; color: inherit; opacity: 0.7;"
                    onclick="document.getElementById('${notificationId}').style.opacity = '0';">&times;</button>
        </div>
    `;
    
    // Show the notification with animation
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 10);
    
    // Auto-hide after duration
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        
        // Remove from DOM after transition
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, duration);
},


    /**
 * Handles the submission of the contact form within the modal.
 * Reveals detailed results upon successful submission.
 * @param {Event} e - The form submission event.
 */
/**
 * Handles the submission of the contact form within the modal.
 * Reveals detailed results upon successful submission.
 * Adjusts prompt text and button visibility based on the initial trigger.
 * @param {Event} e - The form submission event.
 */
async handleModalSubmit(e) {
    e.preventDefault(); // Prevent default browser form submission

    const form = e.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const buttonText = submitButton?.querySelector('.button-text');
    const buttonLoading = submitButton?.querySelector('.button-loading');
    const scrollIndicator = document.querySelector('.scroll-indicator');

    // Get references to elements we might modify *before* the async call
    const unlockButton = document.getElementById('unlockResultsButton');
    const contactButton = document.getElementById('contactOptInButton');
    const unlockPromptDiv = document.querySelector('.unlock-prompt');
    const promptTextElement = unlockPromptDiv ? unlockPromptDiv.querySelector('p') : null;

    if (!submitButton || !buttonText || !buttonLoading) {
        console.error("Submit button or its text/loading elements not found in the form.");
        return; // Exit if elements are missing
    }

    console.log("Contact form submission started.");
    // Show loading state
    buttonText.classList.add('hidden');
    buttonLoading.classList.remove('hidden');
    submitButton.disabled = true;

    // Store the flag before the async call, as it might be reset in 'finally'
    const wasContactOptInRequested = this.contactOptInRequested;

    try {
        const formData = new FormData(form);

        // Append ContactOptIn flag based on the stored state
        if (wasContactOptInRequested) {
            formData.append('ContactOptIn', 'true');
            console.log("Appending ContactOptIn=true to form data.");
        } else {
            formData.append('ContactOptIn', 'false');
            console.log("Appending ContactOptIn=false to form data.");
        }

        // Make the fetch request to submit contact details
        const response = await fetch('/Results/SubmitContact', {
            method: 'POST',
            body: formData
            // Add CSRF token header if needed
        });

        console.log(`SubmitContact Response: Status=${response.status}, OK=${response.ok}`);

        if (response.ok) {
            console.log("Contact form submitted successfully.");
            const result = await response.json();

            // Show notification message if 'Contact Me' was clicked or if the response specifies one
            if (wasContactOptInRequested && (result.notification || wasContactOptInRequested)) {
                this.showNotification(
                    result.notification || "One of our Data & AI Lab Leads will contact you in the upcoming days",
                    'success',
                    8000
                );
            }

            // --- START: NEW PROMPT & BUTTON VISIBILITY LOGIC ---
            if (wasContactOptInRequested) {
                // Scenario B: 'Contact Me' was clicked initially. Hide the entire prompt section.
                if (unlockPromptDiv) {
                    unlockPromptDiv.style.display = 'none';
                    console.log("Hid the entire unlock prompt section because 'Contact Me' was the trigger.");
                } else {
                    console.warn("Unlock prompt div not found to hide.");
                }
            } else {
                // Scenario A: 'Unlock Full Results' was clicked. Adjust the prompt section.
                if (unlockPromptDiv) {
                    // Ensure the container is visible
                     unlockPromptDiv.style.display = ''; // Reset display style
                     console.log("Ensured prompt container div is visible.");

                    // Hide the 'Unlock' button
                    if (unlockButton) {
                        unlockButton.style.display = 'none';
                        console.log("Hid the 'Unlock Full Results' button.");
                    } else {
                         console.warn("'Unlock Full Results' button not found to hide.");
                    }

                    // Ensure 'Contact Me' button is visible
                    if (contactButton) {
                        contactButton.style.display = ''; // Reset display style
                        console.log("Ensured 'Contact Me' button is visible.");
                    } else {
                        console.warn("'Contact Me' button not found.");
                    }

                    // Change the prompt text
                    if (promptTextElement) {
                        promptTextElement.textContent = "Would you like to discuss your results?"; // Set the new text
                        console.log("Changed the prompt text.");
                    } else {
                        console.warn("Prompt text element not found to update.");
                    }
                } else {
                     console.warn("Unlock prompt div not found to adjust.");
                }
            }
            // --- END: NEW PROMPT & BUTTON VISIBILITY LOGIC ---


            this.hideModal(); // Close the modal
            await this.showDetailedResults(); // Show detailed results AND initialize accordion
            form.reset(); // Clear the form fields

            // Show scroll indicator logic (after a short delay)
            setTimeout(() => {
                if (scrollIndicator) {
                    scrollIndicator.style.display = 'block'; // Make it occupy space
                    requestAnimationFrame(() => {
                         scrollIndicator.classList.add('visible'); // Trigger fade-in/animation
                    });

                    // Auto-hide after delay or on scroll
                    const hideScrollIndicator = () => {
                        if (scrollIndicator.classList.contains('visible')) {
                            scrollIndicator.classList.remove('visible');
                            scrollIndicator.addEventListener('transitionend', () => {
                                scrollIndicator.style.display = 'none';
                            }, { once: true });
                            setTimeout(() => { scrollIndicator.style.display = 'none'; }, 500);
                        }
                        window.removeEventListener('scroll', hideScrollIndicator); // Clean up listener
                    };
                    window.addEventListener('scroll', hideScrollIndicator, { once: true }); // Hide on first scroll
                    setTimeout(hideScrollIndicator, 6000); // Auto-hide after 6s
                }
            }, 500); // Delay to allow detailed results to potentially render

        } else {
            // Handle server-side errors
            let errorText = `Server error (${response.status})`;
             try {
                 const errorBody = await response.text();
                 console.error("Server error response body:", errorBody);
                 try {
                     const jsonError = JSON.parse(errorBody);
                     errorText = jsonError.error || jsonError.message || (typeof errorBody === 'string' && errorBody.length < 100 ? errorBody : `Server error ${response.status}`);
                 } catch {
                     errorText = (typeof errorBody === 'string' && errorBody.length < 100 ? errorBody : errorText);
                 }
             } catch (readError) { console.error("Could not read error response body:", readError); }
            throw new Error(errorText);
        }
    } catch (error) {
        console.error("Error submitting contact form:", error);
        this.showNotification(`Failed to submit contact information: ${error.message}`, 'error', 8000);
    } finally {
        // Always restore button state and reset flag
        buttonText.classList.remove('hidden');
        buttonLoading.classList.add('hidden');
        if(submitButton) submitButton.disabled = false; // Check if submitButton exists before accessing property
        this.contactOptInRequested = false; // Reset flag AFTER using it in the try/catch blocks
    }
}, // End of handleModalSubmit

    /**
     * Makes the detailed results section visible and initializes its content/interactions.
     * Uses async/await to ensure content is loaded before initializing accordion.
     */
    async showDetailedResults() {
        console.log('Showing detailed results section');
        const detailedResultsSection = document.querySelector('.detailed-results');

        if (detailedResultsSection) {
            // Only proceed if it's currently hidden
            if (detailedResultsSection.classList.contains('hidden')) {
                detailedResultsSection.classList.remove('hidden');
                detailedResultsSection.style.display = 'block'; // Ensure display style allows visibility

                try {
                     // Load the content FIRST
                     await this.loadDetailedResults();
                     // THEN initialize the accordion interactions
                     this.initializeAccordion();
                } catch (error) {
                     console.error("Error loading or initializing detailed results:", error);
                     this.displayErrorMessage("Could not load detailed analysis. Please try again later.", detailedResultsSection);
                }

                // Optional: Scroll to the revealed section smoothly
                // setTimeout(() => { // Allow rendering before scrolling
                //    detailedResultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // }, 100);

            } else {
                 console.log("Detailed results section already visible.");
                 // If already visible, perhaps re-initialize accordion just in case?
                 this.initializeAccordion();
            }
        } else {
            console.warn("Detailed results section (.detailed-results) not found.");
        }
    },

    /**
     * Loads and displays the detailed text evaluations into the accordion content panels.
     * Targets the specific structure: .accordion-item -> .accordion-content -> .tab-content
     */
    async loadDetailedResults() {
        const results = await this.loadResults(); // Use cached or fetch results
        if (!results?.categoryResults) {
            console.error("Cannot load detailed results text, data missing.");
            // Optionally display an error within the accordion area
            const container = document.querySelector('.accordion-container');
            if (container) container.innerHTML = '<p class="error-message">Could not load detailed analysis content.</p>';
            throw new Error("Missing category results data for detailed view."); // Throw error to be caught by caller
        }

        console.log("Loading detailed results text into accordion panels.");
        const accordionItems = document.querySelectorAll('.accordion-item');

        if (accordionItems.length === 0) {
            console.warn("No accordion items found to load results into.");
            return;
        }

        accordionItems.forEach(item => {
            const categoryName = item.dataset.category;
            const result = results.categoryResults.find(r => r.name === categoryName);
            const contentElement = item.querySelector('.accordion-content .tab-content'); // Target the inner div for content

            // --- START: ADD THIS NEW BLOCK ---
            const headerElement = item.querySelector('.accordion-header');
            // Check if header exists and if score hasn't already been added
            if (headerElement && !headerElement.querySelector('.accordion-header-score')) {
                if (result && typeof result.average === 'number') {
                    const average = result.average;
                    const averageFormatted = average.toFixed(1);
                    const maturityLevel = this.getMaturityLevel(average); // Use the moved function via 'this.'
                    const maturityClass = maturityLevel.toLowerCase().replace(/\s+/g, '-');

                    // Create the container for score/level in the header
                    const scoreContainer = document.createElement('div');
                    // Add classes - reuse existing and add a specific one for header styling
                    scoreContainer.className = 'score-value-container accordion-header-score';

                    // Create the score element
                    const scoreDiv = document.createElement('div');
                    scoreDiv.className = 'score-value';
                    scoreDiv.textContent = `${averageFormatted}/5.0`;

                    // Create the maturity level element
                    const maturityDiv = document.createElement('div');
                    maturityDiv.className = `score-maturity maturity-${maturityClass}`;
                    maturityDiv.textContent = maturityLevel;

                    // Append score and maturity to their container
                    scoreContainer.appendChild(scoreDiv);
                    scoreContainer.appendChild(maturityDiv);

                    // Insert the score container into the header, before the icon
                    const iconElement = headerElement.querySelector('.accordion-icon');
                    if (iconElement) {
                        headerElement.insertBefore(scoreContainer, iconElement);
                    } else {
                        headerElement.appendChild(scoreContainer); // Fallback if icon not found
                    }
                } else {
                     // Optionally add a placeholder if score is missing for some reason
                     console.warn(`Score data missing for category: ${categoryName} in header.`);
                }
            }

            if (contentElement) {
                 if (result?.resultText) {
                     // Basic HTML formatting: replace newlines with paragraphs
                     const formattedText = '<p>' + result.resultText.trim().replace(/\n\s*\n/g, '</p><p>').replace(/\n/g, '<br>') + '</p>';
                     contentElement.innerHTML = formattedText;
                 } else {
                     console.warn(`No result text found for category: ${categoryName}`);
                     contentElement.innerHTML = `<p>Detailed evaluation is currently unavailable for this category.</p>`;
                 }
            } else {
                 console.error(`Accordion content inner div (.tab-content) not found for category: ${categoryName}`);
                 // ... (error handling) ...
            }
        });
        console.log("Finished loading text and header scores into accordion panels.");
    },

    /**
     * Initializes accordion functionality by adding click listeners to headers.
     * Ensures listeners are added only once.
     */
    initializeAccordion() {
        console.log("Initializing accordion functionality.");
        const accordionHeaders = document.querySelectorAll('.accordion-header');

        accordionHeaders.forEach(header => {
            // Check if listener already exists to prevent duplicates
            if (!header.hasAttribute('data-accordion-initialized')) {
                header.addEventListener('click', this.handleAccordionToggle.bind(this)); // Bind 'this' context
                header.setAttribute('data-accordion-initialized', 'true'); // Mark as initialized
            }
        });
    },

    /**
    * Handles the click event on an accordion header to toggle its content panel.
    */
    handleAccordionToggle(event) {
        const header = event.currentTarget;
        const content = header.nextElementSibling; // Assumes .accordion-content is the immediate next sibling
        const item = header.closest('.accordion-item');

        if (!content || !item || !content.classList.contains('accordion-content')) {
            console.error("Accordion structure invalid or content panel not found for header:", header);
            return;
        }

        const isExpanded = header.getAttribute('aria-expanded') === 'true';

        // --- Optional: Single-open accordion behaviour ---
        // If you want only one item open at a time, uncomment this block
        /*
        if (!isExpanded) { // Only run this if we are about to open the clicked item
            const allHeaders = item.closest('.accordion-container').querySelectorAll('.accordion-header');
            allHeaders.forEach(otherHeader => {
                if (otherHeader !== header && otherHeader.getAttribute('aria-expanded') === 'true') {
                    otherHeader.setAttribute('aria-expanded', 'false');
                    const otherContent = otherHeader.nextElementSibling;
                    if (otherContent) {
                        otherContent.classList.remove('active');
                        otherContent.style.maxHeight = null;
                    }
                }
            });
        }
        */
        // --- End Optional Block ---

        // Toggle the clicked item
        if (isExpanded) {
            // Collapse
            header.setAttribute('aria-expanded', 'false');
            content.classList.remove('active');
            content.style.maxHeight = null; // Collapse smoothly using CSS transition to max-height 0
            console.log(`Collapsed: ${item.dataset.category}`);
        } else {
            // Expand
            header.setAttribute('aria-expanded', 'true');
            content.classList.add('active');
            // Set max-height explicitly for the transition FROM 0 to work
            // scrollHeight gives the full height of the content, including padding
            content.style.maxHeight = (content.scrollHeight + 10) + "px";
            console.log(`Expanded: ${item.dataset.category} to ${content.scrollHeight}px`);

            // Optional: Handle cases where content height might change after opening
            // (e.g., images loading). Recalculate max-height after transition.
            content.addEventListener('transitionend', () => {
                // Check if it's still expanded before setting max-height to 'none'
                if (header.getAttribute('aria-expanded') === 'true') {
                   // content.style.maxHeight = 'none'; // Allow natural height (can cause jump if content reflows)
                   // Or recalculate if needed: content.style.maxHeight = content.scrollHeight + "px";
                }
            }, { once: true });
        }
    },


    /**
     * Helper to display error messages on the page, e.g., inside a specific container.
     * @param {string} message - The error message to display.
     * @param {HTMLElement|string|null} [targetElementOrSelector=null] - Optional container element or CSS selector to append/set the message in. Defaults to alert.
     */
    displayErrorMessage(message, targetElementOrSelector = null) {
        console.error("Displaying Error:", message);
        let errorContainer = null;

        if (typeof targetElementOrSelector === 'string') {
            errorContainer = document.querySelector(targetElementOrSelector);
        } else if (targetElementOrSelector instanceof HTMLElement) {
            errorContainer = targetElementOrSelector;
        }

        if (errorContainer) {
            // Create a dedicated error message element for consistent styling
            let errorDiv = errorContainer.querySelector('.error-message-runtime');
            if (!errorDiv) {
                 errorDiv = document.createElement('div');
                 errorDiv.className = 'error-message error-message-runtime'; // Use general error class + specific one
                 // Prepend or append based on context, prepend usually more visible
                 errorContainer.prepend(errorDiv);
            }
            errorDiv.textContent = message;
            errorDiv.style.display = 'block'; // Ensure visibility
        } else {
            // Fallback if no specific container found
            alert(`Error: ${message}`);
        }
    }
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed. Initializing components.');
    try {
        // Initialize the main controller which handles data loading and UI setup
        ResultsViewController.initialize();

        // Initialize non-data-dependent visual effects (like background) later if needed
        // InteractiveEffects.initialize(); // Moved to ResultsViewController.initialize

    } catch (error) {
        console.error("Critical error during initialization:", error);
        // Display a prominent error message if the core initialization fails
         const body = document.querySelector('body');
         if (body) {
             let errorDiv = document.getElementById('critical-error-message');
             if (!errorDiv) {
                errorDiv = document.createElement('div');
                errorDiv.id = 'critical-error-message';
                errorDiv.textContent = "A critical error occurred initializing the page. Please refresh or contact support.";
                errorDiv.style.cssText = 'color: #f8d7da; background-color: #721c24; border: 1px solid #f5c6cb; padding: 20px; position: fixed; top: 0; left: 0; width: 100%; z-index: 9999; text-align: center; font-family: sans-serif;';
                body.prepend(errorDiv);
             }
         }
    }
});

// Ensure Chart.js library is loaded before this script runs.
// It's included via <script> tag in Index.cshtml in this example.