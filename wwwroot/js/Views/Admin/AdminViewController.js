// wwwroot/js/Views/Admin/AdminViewController.js

const AdminViewController = {
    isAuthenticated: false,
    assessmentData: [], // Stores the full dataset from the backend
    sortField: 'timestamp', // Default sort field (camelCase from JSON)
    sortDirection: 'desc', // Default sort direction
    activeFilter: null, // Tracks the active filter ('clicks', 'q3', 'q11', 'leads', or null) - Updated from 'q1'

    /**
     * Initializes the controller, sets up event listeners, and checks authentication.
     */
    async initialize() {
        this.setupEventListeners();
        this.checkAuthentication();
    },

    /**
     * Sets up all necessary event listeners for the page elements.
     */
    setupEventListeners() {
        // Login form submission
        const loginForm = document.getElementById('adminLoginForm');
        if (loginForm) loginForm.addEventListener('submit', this.handleLogin.bind(this));

        // Table header sorting clicks
        document.querySelectorAll('.sortable').forEach(header => {
            header.addEventListener('click', this.handleSort.bind(this));
        });

        // Export button click
        const exportButton = document.getElementById('exportButton');
        if (exportButton) exportButton.addEventListener('click', this.exportToCSV.bind(this));

        // Logout button click
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) logoutButton.addEventListener('click', this.handleLogout.bind(this));

        // --- Benchmark Form Submission ---
        const benchmarkForm = document.getElementById('benchmarkForm');
        if (benchmarkForm) benchmarkForm.addEventListener('submit', this.handleSaveBenchmarks.bind(this));
        // --- End Benchmark Form ---

        // Modal close button click
        const closeButton = document.querySelector('.close-modal');
        if (closeButton) {
            closeButton.onclick = () => {
                const modal = document.getElementById('detailsModal');
                if (modal) modal.style.display = 'none';
            };
        }
        // Modal close on background click
        window.onclick = (event) => {
            const modal = document.getElementById('detailsModal');
            if (event.target === modal && modal) modal.style.display = 'none';
        };

        // Funnel step filter clicks (using event delegation on the container)
        const funnelContainer = document.getElementById('funnelVisualizationContainer');
        if (funnelContainer) {
            // Tab switching functionality
            const tabButtons = document.querySelectorAll('.tab-button');
            if (tabButtons.length > 0) {
                // Set initial active tab based on class
                let initialTabId = 'settings'; // Default
                tabButtons.forEach(button => {
                    if (button.classList.contains('active')) {
                        initialTabId = button.getAttribute('data-tab');
                    }
                });
                // Show initial content
                const initialTabContent = document.getElementById(initialTabId + 'Tab');
                if (initialTabContent) initialTabContent.classList.add('active');

                // Add event listeners
                tabButtons.forEach(button => {
                    button.addEventListener('click', () => {
                        // Get the tab ID from data attribute
                        const tabId = button.getAttribute('data-tab');

                        // Remove active class from all tabs and buttons
                        document.querySelectorAll('.tab-content').forEach(tab => {
                            tab.classList.remove('active');
                        });
                        tabButtons.forEach(btn => {
                            btn.classList.remove('active');
                        });

                        // Add active class to clicked button and corresponding tab
                        button.classList.add('active');
                        const tabContent = document.getElementById(tabId + 'Tab');
                        if (tabContent) {
                            tabContent.classList.add('active');
                        }
                    });
                });
            }
            // Funnel click listener
            funnelContainer.addEventListener('click', this.handleFunnelFilterClick.bind(this));
        }

        // Table action buttons (View/Delete) using event delegation on the table body
        const tableBody = document.querySelector('#assessmentTable tbody');
        if (tableBody) {
            tableBody.addEventListener('click', (event) => {
                const target = event.target;
                if (target.classList.contains('view-button') || target.closest('.view-button')) {
                    const button = target.closest('.view-button');
                    if (button) this.handleViewDetailsClick(button);
                } else if (target.classList.contains('delete-button') || target.closest('.delete-button')) {
                     const button = target.closest('.delete-button');
                    if (button) this.handleDeleteClick(button);
                }
            });
        }
    },


    // --- Funnel Filter Handling ---
    handleFunnelFilterClick(event) {
        const clickedStep = event.target.closest('.funnel-step');
        if (!clickedStep) return; // Exit if click wasn't on a step element

        const filterType = clickedStep.dataset.filter; // Read data-filter attribute
        if (!filterType) {
             console.warn("Clicked funnel step is missing data-filter attribute.");
             return; // Exit if no filter type defined
        }

        // Toggle filter: if same filter clicked again, or 'clicks' clicked, remove filter
        if (this.activeFilter === filterType || filterType === 'clicks') {
            this.activeFilter = null;
        } else {
            this.activeFilter = filterType; // Set the new filter
        }

        console.log("Active filter set to:", this.activeFilter);
        this.updateFunnelHighlighting(); // Update visual highlight on funnel
        this.renderDataTable(); // Re-render table with the filter applied
    },

    updateFunnelHighlighting() {
        document.querySelectorAll('.funnel-step').forEach(step => {
             // Check if the step's filter matches the active filter AND the active filter is not null
             const isActive = step.dataset.filter === this.activeFilter && this.activeFilter !== null;
             step.classList.toggle('funnel-step-active', isActive);
        });
    },

    // --- Authentication and View Management ---
    checkAuthentication() {
        const authToken = localStorage.getItem('adminAuthToken');
        if (authToken) {
            this.isAuthenticated = true;
            this.showAdminPanel();
            Promise.all([
                this.loadAssessmentData(),
                this.loadBenchmarks()
            ]).catch(error => {
                console.error("Error during initial data/benchmark load:", error);
                // Maybe display error in panel?
            });
        } else {
            this.isAuthenticated = false;
            this.showLoginForm();
        }
    },

    async handleLogin(event) {
        event.preventDefault();
        const passwordInput = document.getElementById('adminPassword');
        const errorMessage = document.getElementById('loginError');
        const submitButton = document.querySelector('#adminLoginForm button');
        if (!passwordInput || !errorMessage || !submitButton) {
            console.error("Login form elements not found!"); return;
        }
        const originalButtonText = submitButton.textContent;

        try {
            submitButton.disabled = true;
            submitButton.textContent = 'Verifying...';
            errorMessage.textContent = '';
            errorMessage.classList.remove('visible');

            const response = await fetch('/Admin/Authenticate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: passwordInput.value })
            });

            if (response.ok) {
                const result = await response.json();
                localStorage.setItem('adminAuthToken', result.token);
                this.isAuthenticated = true;
                this.showAdminPanel();
                await Promise.all([
                    this.loadAssessmentData(),
                    this.loadBenchmarks()
                ]);
            } else {
                errorMessage.textContent = response.status === 401
                    ? 'Invalid password. Please try again.'
                    : 'Authentication failed. Please try again.';
                errorMessage.classList.add('visible');
                passwordInput.value = '';
                passwordInput.focus();
            }
        } catch (error) {
            console.error('Login error:', error);
            errorMessage.textContent = 'An error occurred during login. Check connection and try again.';
            errorMessage.classList.add('visible');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    },

    handleLogout() {
        localStorage.removeItem('adminAuthToken');
        this.isAuthenticated = false;
        this.assessmentData = [];
        this.activeFilter = null;
        this.showLoginForm();
        const tableBody = document.querySelector('#assessmentTable tbody');
        if (tableBody) tableBody.innerHTML = '';
        this.clearFunnelVisualization();
        this.updateFunnelHighlighting(); // Reset highlight
        this.clearBenchmarkForm();
        this.sortField = 'timestamp';
        this.sortDirection = 'desc';
    },

    showLoginForm() {
        const loginContainer = document.getElementById('adminLoginContainer');
        const adminPanel = document.getElementById('adminPanelContainer');
        if (loginContainer) loginContainer.style.display = 'flex';
        if (adminPanel) adminPanel.style.display = 'none';
        const passwordInput = document.getElementById('adminPassword');
        const errorMessage = document.getElementById('loginError');
        if (passwordInput) passwordInput.value = '';
        if (errorMessage) {
            errorMessage.textContent = '';
            errorMessage.classList.remove('visible');
        }
        this.clearBenchmarkForm();
    },

    showAdminPanel() {
        const loginContainer = document.getElementById('adminLoginContainer');
        const adminPanel = document.getElementById('adminPanelContainer');
        if (loginContainer) loginContainer.style.display = 'none';
        if (adminPanel) adminPanel.style.display = 'block';
    },

    // --- Data Loading and Processing ---
    async loadAssessmentData() {
        const loadingIndicator = document.getElementById('dataLoadingIndicator');
        const errorMessage = document.getElementById('dataErrorMessage');
        const funnelContainer = document.getElementById('funnelVisualizationContainer');
        if (!loadingIndicator || !errorMessage) { console.error("Data status elements missing!"); return; }

        try {
            loadingIndicator.style.display = 'flex';
            errorMessage.style.display = 'none';
            this.activeFilter = null; // Reset filter on load
            this.clearFunnelVisualization(); // Clear old funnel numbers

            const authToken = localStorage.getItem('adminAuthToken');
            if (!authToken) {
                this.handleLogout(); // Logout if no token
                return;
            }

            const response = await fetch('/Admin/GetAllAssessments', { headers: { 'Authorization': `Bearer ${authToken}` } });

            if (response.ok) {
                const rawData = await response.json();
                this.assessmentData = Array.isArray(rawData) ? rawData : [];
                console.log(`Loaded ${this.assessmentData.length} assessment entries.`);

                // Calculate metrics, render funnel, then render table
                const funnelMetrics = this.calculateFunnelMetrics();
                this.renderFunnelVisualization(funnelMetrics);
                this.renderDataTable(); // Initial render (no filter)
                this.updateFunnelHighlighting(); // Ensure no highlight initially

            } else if (response.status === 401) {
                console.warn("Authentication failed (401) during data load.");
                this.handleLogout();
            } else {
                const errorText = await response.text();
                console.error(`Failed to load data. Status: ${response.status}`, errorText);
                throw new Error(`Server error ${response.status}`);
            }
        } catch (error) {
            console.error('Error loading assessment data:', error);
            errorMessage.textContent = `Failed to load data: ${error.message}. Please refresh or log in again.`;
            errorMessage.style.display = 'block';
            this.assessmentData = [];
            this.activeFilter = null;
            this.clearFunnelVisualization();
            this.updateFunnelHighlighting();
            this.renderDataTable(); // Render empty table state
        } finally {
            loadingIndicator.style.display = 'none';
            // Only show funnel if authenticated and potentially if data loaded
            if (funnelContainer) { funnelContainer.style.display = this.isAuthenticated ? 'flex' : 'none'; }
        }
         this.calculateQuestionAverages(); // Calculate averages after data is loaded/processed
    },

    calculateFunnelMetrics() {
        // UPDATED: Use 'responsesQ3' instead of 'responsesQ1'
        const metrics = { clicks: 0, responsesQ3: 0, responsesQ11: 0, leads: 0 };
        const data = this.assessmentData;
        if (!Array.isArray(data) || data.length === 0) return metrics;

        metrics.clicks = data.length; // Total entries represent 'clicks' or sessions started

        data.forEach(item => {
            // --- Check for Q3 answer ---
            if (this.getQuestionAnswer(item, 3) !== null) {
                 metrics.responsesQ3++; // Increment the count for Q3 answers
            }
            // --- End Check for Q3 ---

            // Q11 and leads logic remains the same
            if (this.getQuestionAnswer(item, 11) !== null) {
                metrics.responsesQ11++;
            }
            if (item?.name && String(item.name).trim() !== '') {
                 metrics.leads++;
            }
        });
        console.log("Calculated Funnel Metrics:", metrics); // Log updated metrics
        return metrics;
    },

    renderFunnelVisualization(metrics) {
        const funnelContainer = document.getElementById('funnelVisualizationContainer');
        if (!funnelContainer) { console.error("Funnel container not found!"); return; }

        // --- UPDATED: Target Q3 elements instead of Q1 ---
        const elements = {
            valClicks: document.getElementById('funnelValueClicks'),
            valQ3: document.getElementById('funnelValueQ3'), // Changed from valQ1
            valQ11: document.getElementById('funnelValueQ11'),
            valLeads: document.getElementById('funnelValueLeads'),
            percClicks: document.getElementById('funnelPercClicks'),
            percQ3: document.getElementById('funnelPercQ3'), // Changed from percQ1
            percQ11: document.getElementById('funnelPercQ11'),
            percLeads: document.getElementById('funnelPercLeads')
        };
        // --- END UPDATE ---

        // Check if all elements were found
        if (Object.values(elements).some(el => !el)) {
             for (const key in elements) {
                 if (!elements[key]) {
                     console.error(`Funnel element not found: ID expected '${key.replace('val', 'funnelValue').replace('perc', 'funnelPerc')}' (approximated ID)`);
                 }
             }
             console.error("One or more funnel value/percentage elements not found! Check HTML IDs.");
             return;
        }

        const totalClicks = metrics.clicks;

        // --- UPDATED: Use metrics.responsesQ3 ---
        const percQ3Val = totalClicks > 0 ? (metrics.responsesQ3 / totalClicks * 100) : 0;
        // --- END UPDATE ---
        const percQ11Val = totalClicks > 0 ? (metrics.responsesQ11 / totalClicks * 100) : 0;
        const percLeadsVal = totalClicks > 0 ? (metrics.leads / totalClicks * 100) : 0;

        elements.valClicks.textContent = metrics.clicks;
        // --- UPDATED: Use metrics.responsesQ3 and elements.valQ3/percQ3 ---
        elements.valQ3.textContent = metrics.responsesQ3;
        elements.percQ3.textContent = `${percQ3Val.toFixed(1)}%`;
        // --- END UPDATE ---
        elements.valQ11.textContent = metrics.responsesQ11;
        elements.valLeads.textContent = metrics.leads;
        elements.percClicks.textContent = '100%'; // Clicks is always the 100% base
        elements.percQ11.textContent = `${percQ11Val.toFixed(1)}%`;
        elements.percLeads.textContent = `${percLeadsVal.toFixed(1)}%`;

        funnelContainer.style.display = this.isAuthenticated ? 'flex' : 'none';
    },

    clearFunnelVisualization() {
        // UPDATED: Clear Q3 instead of Q1
        const ids = ['Clicks', 'Q3', 'Q11', 'Leads']; // Changed 'Q1' to 'Q3'
        ids.forEach(id => {
            const valEl = document.getElementById(`funnelValue${id}`);
            const percEl = document.getElementById(`funnelPerc${id}`);
            if (valEl) valEl.textContent = '0';
            if (percEl) percEl.textContent = '- %';
        });
        // Ensure clicks percentage is reset if it wasn't covered above
        const percClicksEl = document.getElementById('funnelPercClicks');
        if(percClicksEl) percClicksEl.textContent = '- %';

        const funnelContainer = document.getElementById('funnelVisualizationContainer');
        if (funnelContainer) { funnelContainer.style.display = this.isAuthenticated ? 'flex' : 'none'; }
    },

    // --- Benchmark Handling ---
    async loadBenchmarks() {
        const statusElement = document.getElementById('benchmarkStatus');
        this.clearBenchmarkForm();
        if (statusElement) statusElement.textContent = 'Loading benchmarks...';

        try {
            const authToken = localStorage.getItem('adminAuthToken');
            if (!authToken) throw new Error("Not authenticated");

            const response = await fetch('/Admin/GetBenchmarks', { headers: { 'Authorization': `Bearer ${authToken}` } });

            if (response.ok) {
                const benchmarks = await response.json();
                console.log("Benchmarks loaded:", benchmarks);
                for (let i = 3; i <= 11; i++) {
                    const input = document.getElementById(`benchmarkQ${i}`);
                    // Use lowercase 'q' as JSON properties are often camelCased from C#
                    const key = `q${i}Benchmark`;
                    if (input && benchmarks && benchmarks.hasOwnProperty(key)) {
                         // Handle potential null values from backend (if nullable doubles are used)
                         input.value = benchmarks[key] !== null ? Number(benchmarks[key]).toFixed(1) : ''; // Format to 1 decimal place if not null
                    } else if (input) {
                        input.value = ''; // Clear if key not found
                    }
                }
                if (statusElement) {
                    statusElement.textContent = 'Benchmarks loaded.';
                    statusElement.classList.remove('error', 'visible');
                     setTimeout(() => { statusElement.classList.remove('visible'); statusElement.textContent = ''; }, 3000);
                }
            } else {
                if (response.status === 401) this.handleLogout();
                const errorText = await response.text();
                console.error(`Failed to load benchmarks. Status: ${response.status}`, errorText);
                throw new Error(`Server error ${response.status}`);
            }
        } catch (error) {
            console.error('Error loading benchmarks:', error);
            if (statusElement) {
                statusElement.textContent = `Error loading benchmarks: ${error.message}`;
                statusElement.classList.add('error', 'visible');
            }
        }
    },

    async handleSaveBenchmarks(event) {
        event.preventDefault();
        const statusElement = document.getElementById('benchmarkStatus');
        const saveButton = document.getElementById('saveBenchmarksButton');
        if (!statusElement || !saveButton) return;

        const originalButtonText = saveButton.textContent;
        saveButton.disabled = true;
        saveButton.textContent = 'Saving...';
        statusElement.textContent = '';
        statusElement.classList.remove('visible', 'error');

        const benchmarkData = {};
        let isValid = true;

        // Collect and validate data (ensure step="0.1" is on input fields)
        for (let i = 3; i <= 11; i++) {
            const input = document.getElementById(`benchmarkQ${i}`);
            if (!input) { isValid = false; console.error(`Input benchmarkQ${i} not found!`); break; }

            const valueString = input.value.trim();
             if (valueString === '') {
                 // Handle empty input if needed (e.g., treat as null or require value)
                 // Currently, the parseFloat below will result in NaN, triggering validation.
                 // If empty should be allowed and saved as null, handle here.
             }

            const value = parseFloat(valueString); // Use parseFloat for decimals

            if (isNaN(value) || value < 1.0 || value > 5.0) {
                isValid = false;
                input.style.borderColor = '#e74c3c';
                // Updated validation message for decimals
                statusElement.textContent = `Invalid value for Q${i}. Must be a number between 1.0 and 5.0.`;
                statusElement.classList.add('error', 'visible');
                break;
            } else {
                input.style.borderColor = '';
                 // Use lowercase 'q' to match C# property naming conventions after JSON serialization
                 benchmarkData[`q${i}Benchmark`] = value;
            }
        }

        if (!isValid) {
            saveButton.disabled = false;
            saveButton.textContent = originalButtonText;
            return;
        }

        // Send data to backend
        try {
            const authToken = localStorage.getItem('adminAuthToken');
            if (!authToken) throw new Error("Not authenticated");

            console.log("Saving benchmarks:", benchmarkData);

            const response = await fetch('/Admin/SaveBenchmarks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(benchmarkData)
            });

            if (response.ok) {
                statusElement.textContent = 'Benchmarks saved successfully!';
                statusElement.classList.remove('error');
                statusElement.classList.add('visible');
                setTimeout(() => { statusElement.classList.remove('visible'); statusElement.textContent = ''; }, 3000);
            } else {
                 if (response.status === 401) this.handleLogout();
                 const errorText = await response.text();
                 console.error(`Failed to save benchmarks. Status: ${response.status}`, errorText);
                 throw new Error(`Save failed. Server responded with status ${response.status}.`);
            }
        } catch (error) {
            console.error('Error saving benchmarks:', error);
            statusElement.textContent = `Error saving benchmarks: ${error.message}`;
            statusElement.classList.add('error', 'visible');
        } finally {
            saveButton.disabled = false;
            saveButton.textContent = originalButtonText;
        }
    },

    clearBenchmarkForm() {
        for (let i = 3; i <= 11; i++) {
            const input = document.getElementById(`benchmarkQ${i}`);
            if (input) {
                input.value = '';
                input.style.borderColor = ''; // Reset validation highlight
            }
            // Also clear average display if needed
             const averageElement = document.getElementById(`q${i}Average`);
             if (averageElement) averageElement.textContent = 'Current avg: -';
             const avgContainer = document.getElementById(`q${i}AverageContainer`);
             if (avgContainer) avgContainer.style.display = 'none'; // Hide container
        }
        const statusElement = document.getElementById('benchmarkStatus');
        if (statusElement) {
            statusElement.textContent = '';
            statusElement.classList.remove('visible', 'error');
        }
    },

    // --- Data Table Rendering ---
    renderDataTable() {
        const tableBody = document.querySelector('#assessmentTable tbody');
        if (!tableBody) { console.error("Table body (#assessmentTable tbody) not found!"); return; }

        let dataToRender = [];

        // Filter data based on the active funnel step
        if (!this.activeFilter || this.activeFilter === 'clicks') {
            dataToRender = [...this.assessmentData]; // Show all if no filter or 'clicks'
        } else {
            dataToRender = this.assessmentData.filter(item => {
                switch (this.activeFilter) {
                    // --- UPDATED: Filter by 'q3' ---
                    case 'q3':
                        return this.getQuestionAnswer(item, 3) !== null; // Check Q3
                    // --- END UPDATE ---
                    case 'q11':
                        return this.getQuestionAnswer(item, 11) !== null;
                    case 'leads':
                        return item?.name && String(item.name).trim() !== '';
                    default:
                        console.warn("Unknown filter applied:", this.activeFilter);
                        return true; // Show all if filter is unknown
                }
            });
        }

        // Sort the filtered data
        this.sortData(dataToRender);

        // Render the table rows
        tableBody.innerHTML = ''; // Clear previous rows
        if (dataToRender.length === 0) {
            const colCount = document.querySelectorAll('#assessmentTable thead th').length || 12; // Get number of columns
            const emptyMessage = this.activeFilter && this.activeFilter !== 'clicks'
                ? `No assessment data matches the filter: ${this.activeFilter}`
                : (this.assessmentData.length === 0 ? 'No assessment data available' : 'No data matches the current filter/sort.');
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `<td colspan="${colCount}" class="empty-message">${emptyMessage}</td>`;
            tableBody.appendChild(emptyRow);
        } else {
            dataToRender.forEach(assessment => {
                // Calculate averages (handle potential nulls/zeros carefully if needed)
                const appAvg = Number(assessment.aiApplicationAverage) || 0;
                const orgAvg = Number(assessment.peopleOrgAverage) || 0;
                const techAvg = Number(assessment.techDataAverage) || 0;
                const validAvgs = [appAvg, orgAvg, techAvg].filter(avg => avg > 0); // Filter out 0s before averaging
                const totalAvg = validAvgs.length > 0 ? validAvgs.reduce((a, b) => a + b, 0) / validAvgs.length : 0;

                const q1Answer = this.getQuestionAnswer(assessment, 1); // Still display Q1
                const timestamp = assessment.timestamp ? new Date(assessment.timestamp) : null;
                // Format date reliably (e.g., YYYY-MM-DD) or use locale string
                const formattedDate = timestamp ? timestamp.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' }) : 'N/A';

                const row = document.createElement('tr');
                // Corrected template literal for innerHTML:
                row.innerHTML = `
                    <td>${assessment.name || ''}</td>
                    <td>${assessment.email || ''}</td>
                    <td>${assessment.company || ''}</td>
                    <td>${assessment.businessSector || ''}</td>
                    <td>${assessment.companySize || ''}</td>
                    <td>${q1Answer !== null ? q1Answer : ''}</td>
                    <td>${appAvg > 0 ? appAvg.toFixed(1) : ''}</td>
                    <td>${orgAvg > 0 ? orgAvg.toFixed(1) : ''}</td>
                    <td>${techAvg > 0 ? techAvg.toFixed(1) : ''}</td>
                    <td>${totalAvg > 0 ? totalAvg.toFixed(1) : ''}</td>
                    <td>${formattedDate}</td>
                    <td class="table-actions">
                        <button class="view-button" data-id="${assessment.partitionKey || ''}" title="View Details">Details</button>
                        <button class="delete-button" data-id="${assessment.partitionKey || ''}" title="Delete Entry">Delete</button>
                    </td>`;
                tableBody.appendChild(row);
            });
        }
        this.updateSortIndicators(); // Update sorting arrows
    },

    getQuestionAnswer(assessment, questionId) {
        // Ensure property names match the JSON received from backend (likely camelCase)
        const propertyName = `question${questionId}Answer`;
        if (assessment && assessment.hasOwnProperty(propertyName)) {
             const value = assessment[propertyName];
             // Check for null or undefined explicitly
             if (value !== null && value !== undefined) {
                 const stringValue = String(value).trim();
                 if (stringValue !== '') {
                     const numberValue = Number(value);
                     // Return the number if it's valid, otherwise null
                     return !isNaN(numberValue) ? numberValue : null;
                 }
             }
        }
        return null; // Return null if property doesn't exist or value is null/undefined/empty string
    },

    // --- Sorting ---
    sortData(dataToSort) {
        if (!dataToSort || dataToSort.length === 0) return;

        // Make copies of sortField and sortDirection to avoid potential unexpected modifications
        const field = this.sortField;
        const direction = this.sortDirection;

        dataToSort.sort((a, b) => {
            let valueA, valueB;

            // Helper to get comparable values, handling specific fields and types
            const getSortValue = (item, fieldName) => {
                switch (fieldName) {
                    case 'aiapplicationaverage': return Number(item.aiApplicationAverage) || 0;
                    case 'peopleorgaverage': return Number(item.peopleOrgAverage) || 0;
                    case 'techdataaverage': return Number(item.techDataAverage) || 0;
                    case 'totalaverage':
                        const app = Number(item.aiApplicationAverage) || 0;
                        const org = Number(item.peopleOrgAverage) || 0;
                        const tech = Number(item.techDataAverage) || 0;
                        const avgs = [app, org, tech].filter(v => v > 0);
                        return avgs.length > 0 ? avgs.reduce((x, y) => x + y, 0) / avgs.length : 0;
                    case 'timestamp':
                        // Parse timestamp safely
                        const ts = item.timestamp ? new Date(item.timestamp).getTime() : 0;
                        return isNaN(ts) ? 0 : ts;
                    case 'question1answer':
                        // Handle nulls explicitly for sorting direction
                        const qVal = this.getQuestionAnswer(item, 1);
                        // Place nulls at the end when ascending, beginning when descending
                        return qVal === null ? (direction === 'asc' ? Infinity : -Infinity) : qVal;
                    default:
                        // Default case for string fields (Name, Email, etc.)
                        const directVal = item[fieldName];
                         // Treat null/undefined as empty string for comparison consistency
                        return directVal === null || directVal === undefined ? '' : String(directVal).toLowerCase(); // Use lowercase for case-insensitive string sort
                }
            };

            valueA = getSortValue(a, field);
            valueB = getSortValue(b, field);

            // Comparison logic
            if (typeof valueA === 'string' && typeof valueB === 'string') {
                return direction === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
            } else {
                // Handle numbers and potential Infinities from null handling
                return direction === 'asc' ? valueA - valueB : valueB - valueA;
            }
        });
    },

    handleSort(event) {
        const headerCell = event.currentTarget; // The clicked <th> element
        const field = headerCell.dataset.field; // Get field name from data-field attribute

        if (!field) {
            console.warn("Sortable header missing data-field attribute.");
            return;
        }

        // Toggle direction or change field
        if (field === this.sortField) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = 'asc'; // Default to ascending when changing field
        }
        this.renderDataTable(); // Re-render the table with new sorting
    },

    updateSortIndicators() {
        // Clear all indicators first
        document.querySelectorAll('.sortable .sort-indicator').forEach(indicator => {
            indicator.textContent = '';
        });

        // Set indicator for the currently sorted column
        const currentHeaderIndicator = document.querySelector(`.sortable[data-field="${this.sortField}"] .sort-indicator`);
        if (currentHeaderIndicator) {
            currentHeaderIndicator.textContent = this.sortDirection === 'asc' ? ' ▲' : ' ▼'; // Use arrows
        }
    },

    // --- Table Row Actions (Details/Delete) ---
    handleViewDetailsClick(buttonElement) { // Pass the button itself
        //const button = event.target; // Use the button passed in
        const id = buttonElement.dataset.id;
        if (id) {
            this.showAssessmentDetails(id);
        } else {
            console.error("View button clicked but data-id attribute is missing or button not found.", buttonElement);
        }
    },

    handleDeleteClick(buttonElement) { // Pass the button itself
        //const button = event.target; // Use the button passed in
        const partitionKey = buttonElement.dataset.id;
        const row = buttonElement.closest('tr'); // Find the closest table row

        if (!partitionKey) {
            console.error("Delete button missing data-id.", buttonElement);
            return;
        }
         if (!row) {
             console.error("Could not find table row for delete button.", buttonElement);
             // Optionally proceed without row visual feedback, or stop
         }

        // Get name for confirmation message (safer access)
        const name = row?.cells?.[0]?.textContent || 'this entry';
        const confirmed = confirm(`Are you sure you want to permanently delete ${name} (ID: ${partitionKey})?\n\nThis action cannot be undone.`);

        if (confirmed) {
            // Provide visual feedback and disable buttons
            if (row) row.style.opacity = '0.5';
            buttonElement.disabled = true;
            buttonElement.textContent = 'Deleting...';
            const viewButton = row?.querySelector('.view-button'); // Find view button within the same row
            if (viewButton) viewButton.disabled = true;

            this.deleteAssessmentEntry(partitionKey, buttonElement, row); // Pass elements for feedback restoration
        }
    },

    async deleteAssessmentEntry(partitionKey, buttonElement, rowElement) {
        const authToken = localStorage.getItem('adminAuthToken');
        if (!authToken) {
            alert("Authentication error. Please log in again.");
            this.handleLogout();
            return; // Stop execution
        }

        try {
            const response = await fetch(`/Admin/DeleteAssessment/${partitionKey}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            if (response.ok) {
                console.log(`Entry ${partitionKey} deleted successfully via API.`);
                // Remove the entry from the local data array
                const index = this.assessmentData.findIndex(item => item.partitionKey === partitionKey);
                if (index > -1) {
                    this.assessmentData.splice(index, 1);
                    console.log("Removed entry from local data.");
                } else {
                    console.warn(`Deleted entry ${partitionKey} not found in local data array.`);
                }

                // Update funnel metrics *after* removing data
                const funnelMetrics = this.calculateFunnelMetrics();
                this.renderFunnelVisualization(funnelMetrics);

                // Re-render the table without the deleted row
                this.renderDataTable();
                 // Optionally, show a success message (e.g., using a toast notification library)

            } else {
                // Handle specific HTTP error statuses
                if (response.status === 401) {
                    alert("Authentication failed. Your session may have expired. Please log in again.");
                    this.handleLogout();
                } else if (response.status === 404) {
                    alert(`Error: Entry with ID ${partitionKey} not found on the server. It might have already been deleted.`);
                     // Remove from local data if it exists, even if server said 404
                     const index = this.assessmentData.findIndex(item => item.partitionKey === partitionKey);
                     if (index > -1) this.assessmentData.splice(index, 1);
                     this.renderDataTable(); // Re-render table
                } else {
                    // Generic server error
                    const errorText = await response.text();
                    console.error(`Failed deletion. Status: ${response.status}`, errorText);
                    alert(`Failed to delete entry. Server returned status ${response.status}.`);
                }
                 // Restore visual state only on failure
                 if (rowElement) rowElement.style.opacity = '1';
                 if (buttonElement) { buttonElement.disabled = false; buttonElement.textContent = 'Delete'; }
                 const viewButton = rowElement?.querySelector('.view-button');
                 if (viewButton) viewButton.disabled = false;
            }
        } catch (error) {
            console.error('Network or other error deleting entry:', error);
            alert(`An error occurred: ${error.message}`);
            // Restore visual state on network/client-side errors too
            if (rowElement) rowElement.style.opacity = '1';
            if (buttonElement) { buttonElement.disabled = false; buttonElement.textContent = 'Delete'; }
            const viewButton = rowElement?.querySelector('.view-button');
            if (viewButton) viewButton.disabled = false;
        }
    },

    // --- Modal Details ---
    showAssessmentDetails(assessmentId) {
        const assessment = this.assessmentData.find(a => a.partitionKey === assessmentId);
        if (!assessment) {
            console.error(`Details requested for ID ${assessmentId}, but not found.`);
            alert("Could not find details for the selected assessment.");
            return;
        }

        // Recalculate averages for detail view just in case
        const appAvg = Number(assessment.aiApplicationAverage) || 0;
        const orgAvg = Number(assessment.peopleOrgAverage) || 0;
        const techAvg = Number(assessment.techDataAverage) || 0;
        const validAvgs = [appAvg, orgAvg, techAvg].filter(avg => avg > 0);
        const totalAvg = validAvgs.length > 0 ? validAvgs.reduce((a, b) => a + b, 0) / validAvgs.length : 0;

        const answers = {};
        for (let i = 1; i <= 11; i++) {
            answers[`q${i}`] = this.getQuestionAnswer(assessment, i);
        }

        const timestamp = assessment.timestamp ? new Date(assessment.timestamp) : null;
        const formattedDate = timestamp ? timestamp.toLocaleString() : 'N/A'; // Use locale string for better readability

        const modal = document.getElementById('detailsModal');
        const modalContent = document.getElementById('modalContent');
        if (!modal || !modalContent) {
            console.error("Modal elements not found.");
            return;
        }

        // Helper to format values for display (handles nulls and formatting)
        const displayValue = (value, suffix = '', precision = 1, isAverage = false) => {
            if (value === null || value === undefined) return 'N/A'; // Display N/A for null/undefined
            const numValue = Number(value);
            // For averages, don't display if zero, unless specifically needed
            if (isAverage && numValue === 0) return 'N/A';
            // Check if it's a valid number before formatting
            if (typeof value === 'number' && !isNaN(numValue)) {
                return `${numValue.toFixed(precision)}${suffix}`;
            }
            // Handle strings (like Name, Email etc.)
            if (typeof value === 'string' && value.trim() === '') return 'N/A'; // Display N/A for empty strings
            // Fallback for other types or non-empty strings
            return `${value}${suffix}`;
        };

        // Build modal HTML structure
        modalContent.innerHTML = `
            <h2>Assessment Details</h2>
            <div class="detail-section">
                <h3>Participant Information</h3>
                <div class="detail-grid">
                    <div class="detail-item"><label>Session ID:</label><div>${displayValue(assessment.partitionKey)}</div></div>
                    <div class="detail-item"><label>Name:</label><div>${displayValue(assessment.name)}</div></div>
                    <div class="detail-item"><label>Email:</label><div>${displayValue(assessment.email)}</div></div>
                    <div class="detail-item"><label>Company:</label><div>${displayValue(assessment.company)}</div></div>
                    <div class="detail-item"><label>Business Sector:</label><div>${displayValue(assessment.businessSector)}</div></div>
                    <div class="detail-item"><label>Company Size:</label><div>${displayValue(assessment.companySize)}</div></div>
                    <div class="detail-item"><label>Submission Date:</label><div>${formattedDate}</div></div>
                </div>
            </div>
            <div class="detail-section">
                <h3>Initial Self-Assessment</h3>
                <div class="detail-grid">
                    <div class="detail-item"><label>AI Ambition (Q1):</label><div>${displayValue(answers.q1, '/5', 0)}</div></div>
                    </div>
            </div>
            <div class="detail-section">
                <h3>AI Application</h3>
                <div class="detail-grid">
                    <div class="detail-item"><label>New AI Products & Services (Q3):</label><div>${displayValue(answers.q3, '/5', 0)}</div></div>
                    <div class="detail-item"><label>Process Optimization (Q4):</label><div>${displayValue(answers.q4, '/5', 0)}</div></div>
                    <div class="detail-item"><label>Impact Management (Q5):</label><div>${displayValue(answers.q5, '/5', 0)}</div></div>
                    <div class="detail-item"><label>Application Average:</label><div>${displayValue(appAvg, '/5', 1, true)}</div></div>
                </div>
            </div>
             <div class="detail-section">
                <h3>People & Organization</h3>
                <div class="detail-grid">
                    <div class="detail-item"><label>AI Governance (Q6):</label><div>${displayValue(answers.q6, '/5', 0)}</div></div>
                    <div class="detail-item"><label>Organization Culture (Q7):</label><div>${displayValue(answers.q7, '/5', 0)}</div></div>
                    <div class="detail-item"><label>Skills & Competencies (Q8):</label><div>${displayValue(answers.q8, '/5', 0)}</div></div>
                    <div class="detail-item"><label>Organization Average:</label><div>${displayValue(orgAvg, '/5', 1, true)}</div></div>
                </div>
            </div>
             <div class="detail-section">
                <h3>Tech & Data</h3>
                <div class="detail-grid">
                    <div class="detail-item"><label>AI Tools & Platform (Q9):</label><div>${displayValue(answers.q9, '/5', 0)}</div></div>
                    <div class="detail-item"><label>Data Infrastructure (Q10):</label><div>${displayValue(answers.q10, '/5', 0)}</div></div>
                    <div class="detail-item"><label>Security & Privacy (Q11):</label><div>${displayValue(answers.q11, '/5', 0)}</div></div>
                    <div class="detail-item"><label>Tech & Data Average:</label><div>${displayValue(techAvg, '/5', 1, true)}</div></div>
                </div>
            </div>
            <div class="detail-section">
                <h3>Overall Average</h3>
                 <div class="detail-grid">
                    <div class="detail-item"><label>Total Average (Q3-Q11):</label><div>${displayValue(totalAvg, '/5', 1, true)}</div></div>
                </div>
            </div>
        `;
        modal.style.display = 'block'; // Show the modal
    },

    // --- CSV Export ---
    exportToCSV() {
        if (!this.assessmentData || this.assessmentData.length === 0) {
            alert('No data available to export.');
            return;
        }
        // Use the currently rendered (potentially filtered) data or always export all?
        // Let's assume we export ALL data regardless of current filter for completeness.
        const dataToExport = this.assessmentData;

        // Define headers (ensure they match the data extraction order)
        const headers = [
            'Session ID', 'Name', 'Email', 'Company', 'Business Sector', 'Company Size',
            'Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9', 'Q10', 'Q11', // Individual answers
            'AI Application Avg', 'Organization Avg', 'Tech & Data Avg', 'Total Average',
            'Submission Date (UTC)'
        ];

        // Map data to rows
        const rows = dataToExport.map(assessment => {
            // Recalculate averages for export consistency
            const appAvg = Number(assessment.aiApplicationAverage) || 0;
            const orgAvg = Number(assessment.peopleOrgAverage) || 0;
            const techAvg = Number(assessment.techDataAverage) || 0;
            const validAvgs = [appAvg, orgAvg, techAvg].filter(avg => avg > 0);
            const totalAvg = validAvgs.length > 0 ? validAvgs.reduce((a,b)=>a+b,0) / validAvgs.length : 0;

            const timestamp = assessment.timestamp ? new Date(assessment.timestamp) : null;
            const formattedDate = timestamp ? timestamp.toISOString() : ''; // Use ISO format for consistency

            // Helper to format values specifically for CSV (e.g., handle nulls as empty strings)
            const csvValue = (value, precision = 1, isAverage = false) => {
                if (value === null || value === undefined) return ''; // Nulls as empty strings
                const numValue = Number(value);
                 // For averages, export 0 if it's 0, don't treat as null here
                if (isAverage && !isNaN(numValue)) return numValue.toFixed(precision);
                // For non-average numbers (answers)
                if (!isNaN(numValue)) return String(numValue); // Export answers as is (no extra decimals)
                // For strings
                return String(value);
            };

            const answers = {};
            for (let i = 1; i <= 11; i++) {
                answers[`q${i}`] = this.getQuestionAnswer(assessment, i);
            }

            // Return array matching header order
            return [
                assessment.partitionKey || '',
                assessment.name || '',
                assessment.email || '',
                assessment.company || '',
                assessment.businessSector || '',
                assessment.companySize || '',
                csvValue(answers.q1, 0), csvValue(answers.q2, 0), csvValue(answers.q3, 0),
                csvValue(answers.q4, 0), csvValue(answers.q5, 0), csvValue(answers.q6, 0),
                csvValue(answers.q7, 0), csvValue(answers.q8, 0), csvValue(answers.q9, 0),
                csvValue(answers.q10, 0), csvValue(answers.q11, 0),
                csvValue(appAvg, 1, true), csvValue(orgAvg, 1, true), csvValue(techAvg, 1, true),
                csvValue(totalAvg, 1, true),
                formattedDate
            ].map(this.escapeCSVValue); // Escape each value
        });

        // Create CSV content
        const BOM = "\uFEFF"; // Byte Order Mark for Excel compatibility
        const csvContent = BOM + [
            headers.join(','), // Header row
            ...rows.map(row => row.join(',')) // Data rows
        ].join('\n');

        // Create Blob and trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        const dateStamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        link.setAttribute('download', `ai-maturity-assessments-${dateStamp}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click(); // Trigger download
        document.body.removeChild(link); // Clean up link
        URL.revokeObjectURL(url); // Release blob URL
    },

    escapeCSVValue(value) {
        const stringValue = (value === null || value === undefined) ? '' : String(value);
        // If value contains comma, double quote, or newline, enclose in double quotes and escape existing double quotes
        if (/[",\n\r]/.test(stringValue)) {
            return `"${stringValue.replace(/"/g, '""')}"`; // Escape double quotes by doubling them
        }
        return stringValue; // Return as is if no special characters
    },

    /**
     * Calculates and displays average scores for each assessment question (Q3-Q11)
     * to help admins set appropriate benchmark values.
     */
    calculateQuestionAverages() {
        if (!this.assessmentData || this.assessmentData.length === 0) {
            console.log('No assessment data available to calculate question averages');
             // Clear any existing averages if data is empty
             for (let i = 3; i <= 11; i++) {
                const averageElement = document.getElementById(`q${i}Average`);
                if (averageElement) averageElement.textContent = 'No data';
                const avgContainer = document.getElementById(`q${i}AverageContainer`);
                 if (avgContainer) avgContainer.style.display = 'none';
             }
            return;
        }

        console.log('Calculating question averages from assessment data');

        // Object to store the sum and count for each question (Q3-Q11)
        const questionStats = {};
        for (let i = 3; i <= 11; i++) {
            questionStats[`q${i}`] = { sum: 0, count: 0 };
        }

        // Calculate sums and counts
        this.assessmentData.forEach(assessment => {
            for (let i = 3; i <= 11; i++) {
                const answer = this.getQuestionAnswer(assessment, i); // Use helper to get valid number or null
                if (answer !== null) { // Only include valid numeric answers
                    questionStats[`q${i}`].sum += answer;
                    questionStats[`q${i}`].count++;
                }
            }
        });

        // Calculate averages and update UI
        for (let i = 3; i <= 11; i++) {
            const stats = questionStats[`q${i}`];
            let averageText = 'No data'; // Default text
            if (stats.count > 0) {
                 const average = (stats.sum / stats.count).toFixed(2); // Calculate average to 2 decimal places
                 averageText = `Current avg: ${average}`;
            }

            // Update the UI element
            const averageElement = document.getElementById(`q${i}Average`);
            const avgContainer = document.getElementById(`q${i}AverageContainer`);

            if (averageElement) {
                averageElement.textContent = averageText;
            }
            if (avgContainer) {
                // Show the container only if there's data or an average calculated
                 avgContainer.style.display = stats.count > 0 ? 'block' : 'none';
            }
        }

        console.log('Question averages calculated:', questionStats);
    }
};

// Initialize the controller once the DOM is ready
if (document.readyState === 'loading') {
    // Loading hasn't finished yet
    document.addEventListener('DOMContentLoaded', () => AdminViewController.initialize());
} else {
    // `DOMContentLoaded` has already fired
    AdminViewController.initialize();
}