// wwwroot/js/Views/Results/ResultsViewController.js

/**
 * Handles interactive visual effects on the page, like glowing dots.
 */
const InteractiveEffects = {
    initialize() {
        // Optional effects can be enabled/disabled here
        //this.initializeParallax();
        //this.initializeHoverEffects();
        this.initializeGlowingDots();
    },

    /**
     * Optional: Initializes parallax effect on glass panels based on mouse movement.
     */
    initializeParallax() {
        document.addEventListener('mousemove', (e) => {
            const moveX = (e.clientX - window.innerWidth / 2) * 0.01;
            const moveY = (e.clientY - window.innerHeight / 2) * 0.01;

            document.querySelectorAll('.glass-panel').forEach(panel => {
                // Apply subtle transform - ensure this doesn't conflict with other transforms
                panel.style.transform = `translate(${moveX}px, ${moveY}px)`;
            });
        });
    },

    /**
     * Optional: Initializes hover scale effect on score items.
     */
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

    /**
     * Initializes animated glowing dots background effect within the results container.
     */
    initializeGlowingDots() {
        const canvas = document.createElement('canvas');
        const container = document.querySelector('.results-container'); // Target container

        if (!container || !canvas) {
             console.warn("Glowing dots container or canvas couldn't be initialized.");
             return;
        }
        const ctx = canvas.getContext('2d');
        if (!ctx) {
             console.warn("Could not get 2D context for glowing dots canvas.");
             return;
        }

        container.style.position = 'relative'; // Ensure container can position the absolute canvas
        container.appendChild(canvas);
        canvas.className = 'glowing-dots'; // Assign class for potential CSS targeting
        // Style canvas to overlay the container
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%'; // Make canvas fill container width
        canvas.style.height = '100%'; // Make canvas fill container height
        canvas.style.pointerEvents = 'none'; // Allow clicks to pass through
        canvas.style.zIndex = '-1'; // Position behind content (adjust if needed)

        // Resize canvas function
        const resize = () => {
            canvas.width = container.offsetWidth;
            canvas.height = container.offsetHeight;
             console.log(`Glowing dots canvas resized to: ${canvas.width}x${canvas.height}`);
        };

        resize(); // Initial size
        // Use ResizeObserver for more reliable container resizing detection
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(container);
        // Fallback for window resize
        window.addEventListener('resize', resize);


        const dots = [];
        const numDots = 50; // Number of dots
        const dotColor = 'rgba(160, 208, 203, 0.7)'; // Base color with alpha

        // Function to create a dot object
        const createDot = () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 1.5 + 0.5, // Smaller radius range
            vx: (Math.random() - 0.5) * 0.3, // Slower velocity
            vy: (Math.random() - 0.5) * 0.3,
            alpha: Math.random() * 0.4 + 0.3 // Alpha range for variability
        });

        // Populate dots array
        for (let i = 0; i < numDots; i++) {
            dots.push(createDot());
        }

        let animationFrameId = null;
        // Animation loop
        const animate = () => {
            // Clear canvas efficiently
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Update and draw each dot
            dots.forEach(dot => {
                dot.x += dot.vx;
                dot.y += dot.vy;

                // Boundary checks (wrap around)
                if (dot.x < -dot.radius) dot.x = canvas.width + dot.radius;
                if (dot.x > canvas.width + dot.radius) dot.x = -dot.radius;
                if (dot.y < -dot.radius) dot.y = canvas.height + dot.radius;
                if (dot.y > canvas.height + dot.radius) dot.y = -dot.radius;

                // Draw dot
                ctx.beginPath();
                ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
                // Use dynamic alpha for pulsing/fading effect (optional)
                // ctx.fillStyle = `rgba(160, 208, 203, ${dot.alpha * (0.75 + Math.sin(Date.now() * 0.001 + dot.x) * 0.25)})`;
                ctx.fillStyle = `rgba(160, 208, 203, ${dot.alpha})`; // Simpler alpha
                ctx.fill();
            });

            // Request next frame
            animationFrameId = requestAnimationFrame(animate);
        };

        // Start animation
        animate();

         // Cleanup function (optional but good practice if controller can be re-initialized)
         this.stopGlowingDots = () => {
             if (animationFrameId) {
                 cancelAnimationFrame(animationFrameId);
             }
             window.removeEventListener('resize', resize);
             resizeObserver.unobserve(container);
             if (canvas.parentNode) {
                 canvas.parentNode.removeChild(canvas);
             }
             console.log("Glowing dots animation stopped and cleaned up.");
         };
    }
};

/**
 * Optional helper for debugging image loading issues.
 */
const ImageDebugHelper = {
     initialize() {
        console.log('Initializing ImageDebugHelper');
        this.checkImages();
    },

    checkImages() {
        const images = document.querySelectorAll('.avatar-image'); // Target specific images if needed
        console.log(`Found ${images.length} avatar images.`);

        images.forEach((img, index) => {
            const placeholder = img.parentElement?.querySelector('.avatar-placeholder');
            const imgSrc = img.src || 'Source not set'; // Handle cases where src might be missing
            console.log(`Image ${index}: Initial src='${imgSrc}', complete=${img.complete}, naturalWidth=${img.naturalWidth}`);

            // Function to show placeholder and hide image
            const showErrorState = () => {
                 console.error(`Image ${index} failed to load: ${imgSrc}`);
                 img.style.display = 'none'; // Hide broken image element
                 if (placeholder) {
                     placeholder.style.display = 'flex'; // Show placeholder
                     placeholder.style.zIndex = '3'; // Ensure placeholder is on top
                 }
            };

             // Function to show image and hide placeholder
             const showSuccessState = () => {
                 console.log(`Image ${index} loaded successfully: ${imgSrc}`);
                 img.style.display = 'block'; // Ensure image is visible
                 if (placeholder) {
                     placeholder.style.display = 'none'; // Hide placeholder
                 }
             };

            // Check status for already completed images (e.g., from cache)
            if (img.complete) {
                if (img.naturalWidth > 0) {
                    showSuccessState(); // Already loaded successfully
                } else if (imgSrc && imgSrc !== window.location.href) { // Avoid logging errors for unset src
                    showErrorState(); // Completed but failed (e.g., 404)
                }
            }

            // Add event listeners for images yet to load
            img.addEventListener('load', () => showSuccessState());
            img.addEventListener('error', () => showErrorState());
        });
    }
};


/**
 * Main controller for the Results page logic.
 */
const ResultsViewController = {
    /**
     * Initializes the results page: loads data, sets up chart, scores, gauge, modal.
     */
    async initialize() {
        console.log('Initializing ResultsViewController');

        // Optional: Initialize image debugging early
        // this.initializeImageHandling();

        const results = await this.loadResults(); // Fetch data from backend
        this.initializeModal(); // Setup contact form modal listeners

        if (results) {
            // Data loaded successfully, initialize UI components
            this.initializeChart(results); // Setup the radar chart
            this.displayCategoryScores(results); // Display average scores
            this.updatePerceptionGauge(results); // Update the self-perception gauge
        } else {
            // Failed to load results data
            console.error("Failed to load results, cannot initialize page components.");
            this.displayErrorMessage("Failed to load assessment results. Please try refreshing the page or contact support if the problem persists.");
        }
    },

    /**
     * Displays category average scores.
     * @param {object} results - The results data object from the backend.
     */
    displayCategoryScores(results) {
        console.log('Displaying category scores');
        const scoresContainer = document.querySelector('.category-scores');
        if (!scoresContainer) {
            console.warn("Category scores container not found.");
            return;
        }
        if (!results || !results.categoryResults || !Array.isArray(results.categoryResults)) {
            console.error("Invalid or missing categoryResults data.");
            scoresContainer.innerHTML = '<p class="error-message">Could not display category scores.</p>';
            return;
        }

        // Generate HTML for each score item
        const categoryScores = results.categoryResults.map(category => {
            const average = typeof category.average === 'number' ? category.average.toFixed(1) : 'N/A';
            const name = category.name || 'Unnamed Category';
            return `
                <div class="score-item glass-effect">
                    <div class="score-label">${name}</div>
                    <div class="score-value">${average}/5.0</div>
                </div>
            `;
        }).join('');

        scoresContainer.innerHTML = categoryScores;
    },

    /**
     * Initializes the Radar Chart using Chart.js.
     * @param {object} results - The results data object containing userChartData and benchmarkChartData.
     */
    initializeChart(results) {
        const canvasElement = document.getElementById('radarChart');
        if (!canvasElement) {
            console.error("Radar chart canvas element ('radarChart') not found!");
            return;
        }
        const ctx = canvasElement.getContext('2d');
        if (!ctx) {
             console.error("Could not get 2D context for radar chart canvas.");
             return;
        }

        // Validate the necessary data exists
        if (!results || !Array.isArray(results.userChartData) || !Array.isArray(results.benchmarkChartData)) {
             console.error("Chart data (userChartData or benchmarkChartData) is missing or invalid in results object:", results);
             this.displayErrorMessage("Could not display the comparison chart due to missing data.", canvasElement.parentElement); // Display error near chart
             return;
        }
        // Ensure data arrays have the expected length (9 for Q3-Q11)
        if (results.userChartData.length !== 9 || results.benchmarkChartData.length !== 9) {
             console.error(`Chart data arrays have incorrect length. User: ${results.userChartData.length}, Benchmark: ${results.benchmarkChartData.length}. Expected 9.`);
             this.displayErrorMessage("Could not display the comparison chart due to inconsistent data.", canvasElement.parentElement);
             return;
        }


        console.log("Initializing chart with User Data:", results.userChartData, "and Benchmark Data:", results.benchmarkChartData);

        // Define chart labels corresponding to Q3-Q11
        const chartLabels = [
            'New AI Products (Q3)',
            'Process Optimization (Q4)',
            'Impact Management (Q5)',
            'AI Governance (Q6)',
            'Organization Culture (Q7)',
            'Skills & Competencies (Q8)',
            'AI Tools & Platform (Q9)',
            'Data Infrastructure (Q10)',
            'Security & Privacy (Q11)'
        ];

        // Define chart datasets
        const chartDatasets = [
            {
                label: 'Your Score', // User's results
                data: results.userChartData,
                backgroundColor: 'rgba(160, 208, 203, 0.2)', // More subtle fill
                borderColor: '#A0D0CB', // Nunatak Teal border
                pointBackgroundColor: '#A0D0CB', // Point fill color
                pointBorderColor: '#fff', // White point border
                pointHoverBackgroundColor: '#fff', // White point on hover
                pointHoverBorderColor: '#62B2A9', // Darker teal border on hover
                borderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true, // Fill area under the line
                order: 1 // Draw user score on top
            },
            {
                label: 'Benchmark', // Admin-defined benchmarks
                data: results.benchmarkChartData,
                backgroundColor: 'rgba(255, 255, 255, 0)', // No fill
                borderColor: 'rgba(255, 255, 255, 0.5)', // Light grey/white dashed border
                borderDash: [4, 4], // Dashed line style
                pointRadius: 0, // No points shown for benchmark line
                pointHoverRadius: 0,
                borderWidth: 1.5, // Thinner line for benchmark
                fill: false,
                order: 2 // Draw benchmark behind user score
            }
        ];

        // Prepare chart data structure
        const chartData = {
            labels: chartLabels,
            datasets: chartDatasets
        };

        // Prepare chart options
        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    align: 'center',
                    labels: {
                        color: 'rgba(255, 255, 255, 0.9)',
                        padding: 20, // Padding around legend items
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: { size: 12 },
                        boxWidth: 10 // Size of the color box
                    },
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: { size: 13 },
                    bodyFont: { size: 12 },
                    padding: 10,
                    callbacks: {
                        label: function(context) {
                            // Format tooltip: "Label: Score / 5"
                            const score = typeof context.raw === 'number' ? context.raw.toFixed(1) : 'N/A';
                            return `${context.dataset.label}: ${score} / 5`;
                        }
                    }
                }
            },
            scales: {
                r: { // Radial axis (0-5 scale)
                    beginAtZero: true,
                    max: 5,
                    min: 0,
                    ticks: {
                        stepSize: 1,
                        display: true,
                        color: 'rgba(255, 255, 255, 0.6)', // Tick label color
                        backdropColor: 'transparent',
                        font: { size: 10 },
                        z: 1
                    },
                    grid: {
                        circular: true,
                        color: 'rgba(255, 255, 255, 0.1)', // Grid line color
                        lineWidth: 1
                    },
                    pointLabels: { // Labels around the chart (Q3, Q4...)
                        font: {
                            size: (context) => { // Responsive font size
                                const width = context.chart.width;
                                return width < 400 ? 9 : width < 600 ? 10 : 12;
                            }
                        },
                        color: 'rgba(255, 255, 255, 0.8)', // Point label color
                        padding: 10 // Distance from chart edge
                    },
                    angleLines: { // Lines from center to edge
                        color: 'rgba(255, 255, 255, 0.1)', // Angle line color
                        lineWidth: 1
                    }
                }
            },
            // Ensure elements are drawn in the correct order
            elements: {
                line: {
                    tension: 0.1 // Slight curve to lines
                }
            }
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
            new Chart(ctx, {
                type: 'radar',
                data: chartData,
                options: chartOptions
            });
            console.log("Radar chart initialized successfully.");
        } catch (error) {
            console.error("Error creating Chart.js instance:", error);
            this.displayErrorMessage("An error occurred while displaying the comparison chart.", canvasElement.parentElement);
        }
    },

    /**
     * Optional: Helper for debugging image loading.
     */
    initializeImageHandling() {
        console.log('Setting up image handling for avatars.');
        ImageDebugHelper.initialize(); // Call the helper's init
    },

    /**
     * Optional: Helper for testing image paths.
     */
    checkSpecificImage() {
        // Example usage if needed for debugging specific image path issues
        console.log('Checking specific image paths (for debugging)...');
        const paths = ['/images/manuel-halbing.jpg', '/images/lea-klick.png', '/images/oliver-zindler.png'];
        paths.forEach(path => {
            const img = new Image();
            img.onload = () => console.log(`Debug SUCCESS loading: ${path}`);
            img.onerror = () => console.error(`Debug FAILED loading: ${path}`);
            img.src = path;
        });
    },

    /**
     * Updates the self-perception gauge based on the difference between
     * the initial ambition score (Q1) and the average of the detailed scores (Q3-Q11).
     * @param {object} results - The results data object.
     */
    updatePerceptionGauge(results) {
        if (!results || typeof results.ambition?.score !== 'number' || !Array.isArray(results.userChartData) || results.userChartData.length === 0) {
            console.warn("Cannot update perception gauge due to missing or invalid data.", results);
            return;
        }

        // Calculate average of Q3-Q11 scores
        const validScores = results.userChartData.filter(score => typeof score === 'number');
        if (validScores.length === 0) {
            console.warn("No valid user scores found to calculate average for perception gauge.");
            return;
        }
        const actualAverage = validScores.reduce((a, b) => a + b, 0) / validScores.length;
        const perception = results.ambition.score;

        // Calculate difference percentage relative to the max score (5)
        const difference = perception - actualAverage; // Raw difference
        const differencePercent = (difference / 5) * 100; // Difference as percentage of max score

        console.log(`Perception Gauge: Perception=${perception}, Average=${actualAverage.toFixed(1)}, Difference=${difference.toFixed(1)}, Diff%=${differencePercent.toFixed(1)}%`);

        // Map difference to gauge percentage (0% = highly underestimated, 50% = accurate, 100% = highly overestimated)
        // Let's map -2 to +2 difference onto 0 to 1 (adjust mapping range if needed)
        const mappedValue = (difference + 2) / 4; // Maps -2 -> 0, 0 -> 0.5, +2 -> 1
        const percentage = Math.max(0, Math.min(1, mappedValue)); // Clamp between 0 and 1

        const gaugeFill = document.querySelector('.gauge-fill');
        const needle = document.querySelector('.gauge-needle');
        const differenceElement = document.querySelector('.perception-difference');

        if (gaugeFill && needle && differenceElement) {
            gaugeFill.style.setProperty('--percentage', percentage);
            needle.style.setProperty('--percentage', percentage);

            // Display the percentage difference
            const differenceText = differencePercent > 0 ? `+${differencePercent.toFixed(0)}%` : `${differencePercent.toFixed(0)}%`;
            differenceElement.textContent = differenceText;

            // Set color based on magnitude of difference (optional)
            const absDifferencePercent = Math.abs(differencePercent);
            let color = 'var(--accent-green)'; // Accurate
            if (absDifferencePercent > 40) { // Large difference (e.g., > 2 points)
                color = 'var(--accent-red)';
            } else if (absDifferencePercent > 20) { // Moderate difference (e.g., > 1 point)
                color = 'var(--accent-blue)'; // Using blue for moderate instead of yellow
            }
            differenceElement.style.color = color;
             console.log(`Gauge percentage set to ${percentage.toFixed(2)}, Difference text: ${differenceText}, Color: ${color}`);
        } else {
             console.warn("Gauge elements (fill, needle, or difference text) not found.");
        }
    },

    /**
     * Fetches assessment results from the backend API.
     * @returns {Promise<object|null>} A promise that resolves with the results object or null on error.
     */
    async loadResults() {
        console.log('Attempting to load results from /Results/GetResults');
        try {
            const response = await fetch('/Results/GetResults');
            if (!response.ok) {
                // Log detailed error status
                let errorDetails = `HTTP status ${response.status} (${response.statusText})`;
                try {
                    const errorBody = await response.text();
                    console.error("Error response body:", errorBody);
                    // Try to parse common error structures
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
            return results;
        } catch (error) {
            console.error('Error loading results:', error);
            // Display user-friendly error on the page here if needed
            this.displayErrorMessage(`Error loading results: ${error.message}`);
            return null;
        }
    },

    

    /**
     * Sets up event listeners for the contact modal form.
     */
    initializeModal() {
        console.log('Initializing contact modal');
        const form = document.getElementById('contactForm');
        const modal = document.getElementById('contactModal');
        const openButton = document.querySelector('.unlock-prompt button'); // Button to open modal
        const closeButton = modal?.querySelector('.close-modal-button'); // Close button inside modal

        if (form) {
            form.addEventListener('submit', this.handleModalSubmit.bind(this));
        } else {
            console.warn("Contact form not found.");
        }

        if (modal) {
            // Ensure modal is hidden initially
            modal.style.display = 'none';
            modal.classList.remove('active');

             // Open modal button listener
             if (openButton) {
                 openButton.addEventListener('click', () => this.showContactModal());
             } else {
                 console.warn("Open modal button not found.");
             }

             // Close modal button listener
             if (closeButton) {
                 closeButton.addEventListener('click', () => this.hideModal());
             } else {
                 console.warn("Close modal button not found.");
             }

             // Optional: Close modal on background click
            modal.addEventListener('click', (event) => {
                if (event.target === modal) { // Check if click is on the background itself
                    this.hideModal();
                }
            });

        } else {
            console.warn("Contact modal container not found.");
        }
    },

    /**
     * Shows the contact modal.
     */
    showContactModal() {
        console.log('Showing contact modal');
        const modal = document.getElementById('contactModal');
        if (modal) {
            modal.style.display = 'block';
            // Use requestAnimationFrame to ensure display:block is applied before adding class for transition
            requestAnimationFrame(() => {
                modal.classList.add('active');
            });
        }
    },

    /**
     * Hides the contact modal.
     */
    hideModal() {
        console.log('Hiding contact modal');
        const modal = document.getElementById('contactModal');
        if (modal) {
            modal.classList.remove('active');
            // Wait for transition to finish before setting display:none
            // Adjust timeout to match CSS transition duration
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300); // Assuming 0.3s transition
        }
    },

    /**
     * Handles the submission of the contact form within the modal.
     * @param {Event} e - The form submission event.
     */
    async handleModalSubmit(e) {
        e.preventDefault(); // Prevent default browser form submission

        const form = e.target;
        const submitButton = form.querySelector('button[type="submit"]');
        const buttonText = submitButton?.querySelector('.button-text');
        const buttonLoading = submitButton?.querySelector('.button-loading');
        const scrollIndicator = document.querySelector('.scroll-indicator'); // For showing after success

        if (!submitButton || !buttonText || !buttonLoading) {
            console.error("Submit button or its text/loading elements not found in the form.");
            return;
        }

        console.log("Contact form submission started.");
        // Show loading state
        buttonText.classList.add('hidden');
        buttonLoading.classList.remove('hidden');
        submitButton.disabled = true;

        try {
            const formData = new FormData(form);

            // Log form data being sent (optional, for debugging)
            // console.log("Form data being sent:");
            // for (let pair of formData.entries()) { console.log(pair[0] + ': ' + pair[1]); }

            // Send data to the backend endpoint
            const response = await fetch('/Results/SubmitContact', {
                method: 'POST',
                body: formData
                // Headers usually not needed for FormData unless specific requirements like CSRF tokens
            });

            console.log(`SubmitContact Response: Status=${response.status}, OK=${response.ok}`);

            if (response.ok) {
                console.log("Contact form submitted successfully.");
                // Hide the prompt/button that opened the modal
                const unlockPrompt = document.querySelector('.unlock-prompt');
                if (unlockPrompt) {
                    unlockPrompt.style.display = 'none';
                }

                this.hideModal(); // Close the modal
                this.showDetailedResults(); // Show the detailed results section
                form.reset(); // Clear the form fields

                // Show scroll indicator after a short delay
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
                                setTimeout(() => { scrollIndicator.style.display = 'none'; }, 300); // Hide after fade
                            }
                            window.removeEventListener('scroll', hideScrollIndicator); // Clean up listener
                        };
                        window.addEventListener('scroll', hideScrollIndicator, { once: true }); // Hide on first scroll
                        setTimeout(hideScrollIndicator, 6000); // Auto-hide after 6s
                    }
                }, 500); // Delay to allow detailed results to render

            } else {
                // Handle server-side errors
                let errorText = `Server error (${response.status})`;
                try {
                    const errorBody = await response.text();
                    console.error("Server error response body:", errorBody);
                    // Try to parse common error structures
                    try { const jsonError = JSON.parse(errorBody); errorText = jsonError.error || jsonError.message || errorBody; }
                    catch { errorText = errorBody || errorText; } // Use text if not JSON or no specific field
                } catch (readError) { console.error("Could not read error response body:", readError); }
                throw new Error(errorText);
            }
        } catch (error) {
            console.error("Error submitting contact form:", error);
            // Display error to the user (e.g., using an alert or a dedicated error message area in the modal)
            alert(`Failed to submit contact information. Please try again.\nError: ${error.message}`);
        } finally {
            // Restore button state
            buttonText.classList.remove('hidden');
            buttonLoading.classList.add('hidden');
            submitButton.disabled = false;
        }
    },

    /**
     * Makes the detailed results section visible.
     */
    showDetailedResults() {
        console.log('Showing detailed results section');
        const detailedResultsSection = document.querySelector('.detailed-results');
        if (detailedResultsSection) {
            detailedResultsSection.classList.remove('hidden'); // Remove class that hides it
            detailedResultsSection.style.display = 'block'; // Ensure display style allows visibility
            // Optionally scroll to this section
            // detailedResultsSection.scrollIntoView({ behavior: 'smooth' });
        } else {
            console.warn("Detailed results section not found.");
        }
        // Load the actual text content for the results
        this.loadDetailedResults();
    },

    /**
     * Loads and displays the detailed text evaluations for each category.
     */
    async loadDetailedResults() {
        const results = await this.loadResults(); // Re-fetch or use cached results if available
        if (!results || !results.categoryResults) {
            console.error("Cannot load detailed results text, data missing.");
            return;
        }

        console.log("Loading detailed results text into tabs.");
        const tabs = document.querySelectorAll('.result-tab');
        tabs.forEach(tab => {
            const categoryName = tab.dataset.category; // Get category name from data attribute
            const result = results.categoryResults.find(r => r.name === categoryName); // Find matching result

            if (result && typeof result.resultText === 'string') {
                const contentElement = tab.querySelector('.tab-content');
                if (contentElement) {
                    // Sanitize resultText before inserting if it might contain HTML
                    // For simplicity, assuming plain text here. Use a sanitizer if needed.
                    contentElement.innerHTML = `<p>${result.resultText}</p>`; // Display text
                } else {
                    console.warn(`Tab content element not found for category: ${categoryName}`);
                }
            } else {
                 console.warn(`No result text found for category: ${categoryName}`);
                 const contentElement = tab.querySelector('.tab-content');
                 if (contentElement) contentElement.innerHTML = `<p>Detailed evaluation not available.</p>`; // Placeholder
            }
        });
    },

    /**
     * Helper to display error messages on the page.
     * @param {string} message - The error message to display.
     * @param {HTMLElement|null} [container=null] - Optional container to append the message to. Defaults to a specific error div.
     */
    displayErrorMessage(message, container = null) {
        console.error("Displaying Error:", message);
        let errorContainer = container;
        if (!errorContainer) {
            errorContainer = document.getElementById('resultsErrorContainer'); // Default error container
        }

        if (errorContainer) {
            // Simple text display, clear previous errors
            errorContainer.textContent = message;
            errorContainer.style.display = 'block'; // Make sure it's visible
            errorContainer.classList.add('error-message'); // Apply error styling
        } else {
            // Fallback if no container found
            alert(`Error: ${message}`);
        }
    }
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed. Initializing components.');
    try {
        ResultsViewController.initialize(); // Initialize main controller
        InteractiveEffects.initialize(); // Initialize visual effects
        // ImageDebugHelper.initialize(); // Uncomment if image debugging is needed
    } catch (error) {
        console.error("Error during initialization:", error);
        // Display a critical error message if initialization fails
         const body = document.querySelector('body');
         if (body) {
             const errorDiv = document.createElement('div');
             errorDiv.textContent = "A critical error occurred while loading the page. Please refresh or contact support.";
             errorDiv.style.color = 'red'; errorDiv.style.padding = '20px'; errorDiv.style.backgroundColor = 'black';
             body.prepend(errorDiv);
         }
    }
});

// Ensure Chart.js library is loaded before this script runs.
// Typically included via a <script> tag in the main HTML layout (_Layout.cshtml) or the specific view (Results/Index.cshtml).
// Example: <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
// Note: Check Chart.js version compatibility if needed.
