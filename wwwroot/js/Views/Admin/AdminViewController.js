// wwwroot/js/Views/Admin/AdminViewController.js

const AdminViewController = {
    isAuthenticated: false,
    assessmentData: [], // Stores the full dataset from the backend
    sortField: 'timestamp', // Default sort field (camelCase from JSON)
    sortDirection: 'desc', // Default sort direction
    activeFilter: null, // Tracks the active filter ('clicks', 'q1', 'q11', 'leads', or null)

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
            funnelContainer.addEventListener('click', this.handleFunnelFilterClick.bind(this));
        }

        // Table action buttons (View/Delete) using event delegation on the table body
        const tableBody = document.querySelector('#assessmentTable tbody');
        if (tableBody) {
            tableBody.addEventListener('click', (event) => {
                if (event.target.classList.contains('view-button')) {
                    this.handleViewDetailsClick(event);
                } else if (event.target.classList.contains('delete-button')) {
                    this.handleDeleteClick(event);
                }
            });
        }
    },


    // --- Funnel Filter Handling ---
    // (Funnel functions remain the same as before)
    handleFunnelFilterClick(event) { /* ... */ },
    updateFunnelHighlighting() { /* ... */ },

    // --- Authentication and View Management ---

    /**
     * Checks if a valid auth token exists in local storage and updates the UI accordingly.
     */
    checkAuthentication() {
        const authToken = localStorage.getItem('adminAuthToken');
        if (authToken) {
            this.isAuthenticated = true;
            this.showAdminPanel();
            // Load data *and* benchmarks if authenticated
            Promise.all([
                this.loadAssessmentData(),
                this.loadBenchmarks() // Load benchmarks when showing panel
            ]).catch(error => {
                console.error("Error during initial data/benchmark load:", error);
                // Handle error appropriately, maybe logout or show specific message
            });
        } else {
            this.isAuthenticated = false;
            this.showLoginForm();
        }
    },

    /**
     * Handles the admin login form submission.
     * @param {Event} event - The form submission event.
     */
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
                // Load data and benchmarks after successful login
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

    /**
     * Handles the logout process.
     */
    handleLogout() {
        localStorage.removeItem('adminAuthToken'); // Clear token
        this.isAuthenticated = false;
        this.assessmentData = []; // Clear data
        this.activeFilter = null; // Reset filter
        this.showLoginForm(); // Display login form
        const tableBody = document.querySelector('#assessmentTable tbody');
        if (tableBody) tableBody.innerHTML = ''; // Clear table visually
        this.clearFunnelVisualization(); // Reset funnel numbers/visibility
        this.updateFunnelHighlighting(); // Ensure no funnel step is highlighted
        this.clearBenchmarkForm(); // Clear benchmark inputs
        this.sortField = 'timestamp'; // Reset sorting defaults
        this.sortDirection = 'desc';
    },

    /**
     * Shows the login form and hides the admin panel.
     */
    showLoginForm() {
        const loginContainer = document.getElementById('adminLoginContainer');
        const adminPanel = document.getElementById('adminPanelContainer');
        if (loginContainer) loginContainer.style.display = 'flex';
        if (adminPanel) adminPanel.style.display = 'none';

        // Clear potential leftover form state
        const passwordInput = document.getElementById('adminPassword');
        const errorMessage = document.getElementById('loginError');
        if (passwordInput) passwordInput.value = '';
        if (errorMessage) {
            errorMessage.textContent = '';
            errorMessage.classList.remove('visible');
        }
        this.clearBenchmarkForm(); // Also clear benchmarks on logout/show login
    },

    /**
     * Shows the admin panel and hides the login form.
     */
    showAdminPanel() {
        const loginContainer = document.getElementById('adminLoginContainer');
        const adminPanel = document.getElementById('adminPanelContainer');
        if (loginContainer) loginContainer.style.display = 'none';
        if (adminPanel) adminPanel.style.display = 'block';
        // Data/Benchmark loading is handled by checkAuthentication or handleLogin
    },

    // --- Data Loading and Processing ---
    // loadAssessmentData, calculateFunnelMetrics, renderFunnelVisualization, clearFunnelVisualization
    // remain the same as before
    async loadAssessmentData() { /* ... */ },
    calculateFunnelMetrics() { /* ... */ },
    renderFunnelVisualization(metrics) { /* ... */ },
    clearFunnelVisualization() { /* ... */ },

    // --- Benchmark Handling ---

    /**
     * Loads benchmark values from the backend and populates the form.
     */
    async loadBenchmarks() {
        const statusElement = document.getElementById('benchmarkStatus');
        this.clearBenchmarkForm(); // Clear existing values first
        if (statusElement) statusElement.textContent = 'Loading benchmarks...';

        try {
            const authToken = localStorage.getItem('adminAuthToken');
            if (!authToken) throw new Error("Not authenticated");

            const response = await fetch('/Admin/GetBenchmarks', { // NEW Endpoint
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            if (response.ok) {
                const benchmarks = await response.json();
                console.log("Benchmarks loaded:", benchmarks);
                // Populate form fields (Q3 to Q11)
                for (let i = 3; i <= 11; i++) {
                    const input = document.getElementById(`benchmarkQ${i}`);
                    const key = `q${i}Benchmark`; // Assuming backend returns keys like q3Benchmark, q4Benchmark etc.
                    if (input && benchmarks && benchmarks.hasOwnProperty(key)) {
                        input.value = benchmarks[key] ?? ''; // Use nullish coalescing for safety
                    }
                }
                if (statusElement) {
                    statusElement.textContent = 'Benchmarks loaded.';
                    statusElement.classList.remove('error', 'visible');
                     setTimeout(() => statusElement.classList.remove('visible'), 3000); // Hide after 3s
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
            // Don't clear form on load error, might overwrite user input
        }
    },

    /**
     * Handles the submission of the benchmark form.
     * @param {Event} event - The form submission event.
     */
    async handleSaveBenchmarks(event) {
        event.preventDefault(); // Prevent default form submission
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

        // Collect and validate data
        for (let i = 3; i <= 11; i++) {
            const input = document.getElementById(`benchmarkQ${i}`);
            if (!input) {
                isValid = false;
                console.error(`Input benchmarkQ${i} not found!`);
                break;
            }
            const value = parseInt(input.value, 10);
            if (isNaN(value) || value < 1 || value > 5) {
                isValid = false;
                input.style.borderColor = '#e74c3c'; // Highlight invalid input
                statusElement.textContent = `Invalid value for Q${i}. Must be between 1 and 5.`;
                statusElement.classList.add('error', 'visible');
                break; // Stop validation on first error
            } else {
                input.style.borderColor = ''; // Reset border color
                benchmarkData[`q${i}Benchmark`] = value; // Use key matching backend expectation
            }
        }

        if (!isValid) {
            saveButton.disabled = false;
            saveButton.textContent = originalButtonText;
            return; // Stop if validation failed
        }

        // Send data to backend
        try {
            const authToken = localStorage.getItem('adminAuthToken');
            if (!authToken) throw new Error("Not authenticated");

            console.log("Saving benchmarks:", benchmarkData);

            const response = await fetch('/Admin/SaveBenchmarks', { // NEW Endpoint
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
                setTimeout(() => statusElement.classList.remove('visible'), 3000); // Hide after 3s
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

    /**
     * Clears all benchmark input fields.
     */
    clearBenchmarkForm() {
        for (let i = 3; i <= 11; i++) {
            const input = document.getElementById(`benchmarkQ${i}`);
            if (input) {
                input.value = '';
                input.style.borderColor = ''; // Reset validation highlight
            }
        }
        const statusElement = document.getElementById('benchmarkStatus');
        if (statusElement) {
            statusElement.textContent = '';
            statusElement.classList.remove('visible', 'error');
        }
    },

    // --- Data Table Rendering ---
    // renderDataTable, getQuestionAnswer remain the same
    renderDataTable() { /* ... */ },
    getQuestionAnswer(assessment, questionId) { /* ... */ },

    // --- Sorting ---
    // sortData, handleSort, updateSortIndicators remain the same
    sortData(dataToSort) { /* ... */ },
    handleSort(event) { /* ... */ },
    updateSortIndicators() { /* ... */ },

    // --- Table Row Actions (Details/Delete) ---
    // handleViewDetailsClick, handleDeleteClick, deleteAssessmentEntry remain the same
    handleViewDetailsClick(event) { /* ... */ },
    handleDeleteClick(event) { /* ... */ },
    async deleteAssessmentEntry(partitionKey, buttonElement, rowElement) { /* ... */ },

    // --- Modal Details ---
    // showAssessmentDetails remains the same
    showAssessmentDetails(assessmentId) { /* ... */ },

    // --- CSV Export ---
    // exportToCSV, escapeCSVValue remain the same
    exportToCSV() { /* ... */ },
    escapeCSVValue(value) { /* ... */ }
};

// Initialize the controller once the DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AdminViewController.initialize());
} else {
    AdminViewController.initialize(); // DOM is already ready
}


// --- Helper function implementations (ensure they are accessible or part of the object) ---

// Example if these were outside the object (adjust if they are methods as above)
// function getQuestionAnswer(assessment, questionId) { ... }
// function calculateFunnelMetrics(data) { ... }
// function sortData(dataToSort, sortField, sortDirection) { ... }
// function escapeCSVValue(value) { ... }

// Re-attach implementations for functions referenced as /* ... */ if needed
AdminViewController.handleFunnelFilterClick = function(event) {
    const clickedStep = event.target.closest('.funnel-step');
    if (!clickedStep) return;
    const filterType = clickedStep.dataset.filter;
    if (!filterType) return;
    if (this.activeFilter === filterType || filterType === 'clicks') {
        this.activeFilter = null;
    } else {
        this.activeFilter = filterType;
    }
    console.log("Active filter set to:", this.activeFilter);
    this.updateFunnelHighlighting();
    this.renderDataTable();
};

AdminViewController.updateFunnelHighlighting = function() {
    document.querySelectorAll('.funnel-step').forEach(step => {
        step.classList.toggle('funnel-step-active', step.dataset.filter === this.activeFilter && this.activeFilter !== null);
    });
};

AdminViewController.loadAssessmentData = async function() {
    const loadingIndicator = document.getElementById('dataLoadingIndicator');
    const errorMessage = document.getElementById('dataErrorMessage');
    const funnelContainer = document.getElementById('funnelVisualizationContainer');
    if (!loadingIndicator || !errorMessage) { console.error("Data status elements missing!"); return; }
    try {
        loadingIndicator.style.display = 'flex';
        errorMessage.style.display = 'none';
        this.activeFilter = null;
        this.clearFunnelVisualization();
        const authToken = localStorage.getItem('adminAuthToken');
        if (!authToken) { this.handleLogout(); return; }
        const response = await fetch('/Admin/GetAllAssessments', { headers: { 'Authorization': `Bearer ${authToken}` } });
        if (response.ok) {
            const rawData = await response.json();
            this.assessmentData = Array.isArray(rawData) ? rawData : [];
            console.log(`Loaded ${this.assessmentData.length} assessment entries.`);
            const funnelMetrics = this.calculateFunnelMetrics();
            this.renderFunnelVisualization(funnelMetrics);
            this.renderDataTable();
            this.updateFunnelHighlighting();
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
        this.renderDataTable();
    } finally {
        loadingIndicator.style.display = 'none';
        if (funnelContainer) { funnelContainer.style.display = this.isAuthenticated ? 'flex' : 'none'; }
    }
};

AdminViewController.calculateFunnelMetrics = function() {
    const metrics = { clicks: 0, responsesQ1: 0, responsesQ11: 0, leads: 0 };
    const data = this.assessmentData;
    if (!Array.isArray(data) || data.length === 0) return metrics;
    metrics.clicks = data.length;
    data.forEach(item => {
        if (this.getQuestionAnswer(item, 1) !== null) metrics.responsesQ1++;
        if (this.getQuestionAnswer(item, 11) !== null) metrics.responsesQ11++;
        if (item?.name && String(item.name).trim() !== '') metrics.leads++;
    });
    return metrics;
};

AdminViewController.renderFunnelVisualization = function(metrics) {
    const funnelContainer = document.getElementById('funnelVisualizationContainer');
    if (!funnelContainer) { console.error("Funnel container not found!"); return; }
    const elements = {
        valClicks: document.getElementById('funnelValueClicks'), valQ1: document.getElementById('funnelValueQ1'),
        valQ11: document.getElementById('funnelValueQ11'), valLeads: document.getElementById('funnelValueLeads'),
        percClicks: document.getElementById('funnelPercClicks'), percQ1: document.getElementById('funnelPercQ1'),
        percQ11: document.getElementById('funnelPercQ11'), percLeads: document.getElementById('funnelPercLeads')
    };
    if (Object.values(elements).some(el => !el)) { console.error("One or more funnel value/percentage elements not found!"); return; }
    const totalClicks = metrics.clicks;
    const percQ1Val = totalClicks > 0 ? (metrics.responsesQ1 / totalClicks * 100) : 0;
    const percQ11Val = totalClicks > 0 ? (metrics.responsesQ11 / totalClicks * 100) : 0;
    const percLeadsVal = totalClicks > 0 ? (metrics.leads / totalClicks * 100) : 0;
    elements.valClicks.textContent = metrics.clicks; elements.valQ1.textContent = metrics.responsesQ1;
    elements.valQ11.textContent = metrics.responsesQ11; elements.valLeads.textContent = metrics.leads;
    elements.percClicks.textContent = '100%'; elements.percQ1.textContent = `${percQ1Val.toFixed(1)}%`;
    elements.percQ11.textContent = `${percQ11Val.toFixed(1)}%`; elements.percLeads.textContent = `${percLeadsVal.toFixed(1)}%`;
    funnelContainer.style.display = this.isAuthenticated ? 'flex' : 'none';
};

AdminViewController.clearFunnelVisualization = function() {
    const ids = ['Clicks', 'Q1', 'Q11', 'Leads'];
    ids.forEach(id => {
        const valEl = document.getElementById(`funnelValue${id}`); const percEl = document.getElementById(`funnelPerc${id}`);
        if (valEl) valEl.textContent = '0'; if (percEl) percEl.textContent = '- %';
    });
    const percClicksEl = document.getElementById('funnelPercClicks'); if(percClicksEl) percClicksEl.textContent = '- %';
    const funnelContainer = document.getElementById('funnelVisualizationContainer');
    if (funnelContainer) { funnelContainer.style.display = this.isAuthenticated ? 'flex' : 'none'; }
};

AdminViewController.renderDataTable = function() {
    const tableBody = document.querySelector('#assessmentTable tbody');
    if (!tableBody) { console.error("Table body not found!"); return; }
    let dataToRender = [];
    if (!this.activeFilter || this.activeFilter === 'clicks') {
        dataToRender = [...this.assessmentData];
    } else {
        dataToRender = this.assessmentData.filter(item => {
            switch (this.activeFilter) {
                case 'q1': return this.getQuestionAnswer(item, 1) !== null;
                case 'q11': return this.getQuestionAnswer(item, 11) !== null;
                case 'leads': return item?.name && String(item.name).trim() !== '';
                default: return true;
            }
        });
    }
    this.sortData(dataToRender);
    tableBody.innerHTML = '';
    if (dataToRender.length === 0) {
        const emptyMessage = this.activeFilter && this.activeFilter !== 'clicks' ? `No assessment data matches the filter: ${this.activeFilter}` : (this.assessmentData.length === 0 ? 'No assessment data available' : 'No data matches the current filter/sort.');
        const emptyRow = document.createElement('tr'); emptyRow.innerHTML = `<td colspan="12" class="empty-message">${emptyMessage}</td>`; tableBody.appendChild(emptyRow);
    } else {
        dataToRender.forEach(assessment => {
            const appAvg = Number(assessment.aiApplicationAverage) || 0; const orgAvg = Number(assessment.peopleOrgAverage) || 0; const techAvg = Number(assessment.techDataAverage) || 0;
            const validAvgs = [appAvg, orgAvg, techAvg].filter(avg => avg > 0); const totalAvg = validAvgs.length > 0 ? validAvgs.reduce((a, b) => a + b, 0) / validAvgs.length : 0;
            const q1Answer = this.getQuestionAnswer(assessment, 1); const timestamp = assessment.timestamp ? new Date(assessment.timestamp) : null; const formattedDate = timestamp ? timestamp.toLocaleDateString() : 'N/A';
            const row = document.createElement('tr');
            row.innerHTML = `<td>${assessment.name || ''}</td><td>${assessment.email || ''}</td><td>${assessment.company || ''}</td><td>${assessment.businessSector || ''}</td><td>${assessment.companySize || ''}</td><td>${q1Answer !== null ? q1Answer : ''}</td><td>${appAvg > 0 ? appAvg.toFixed(1) : ''}</td><td>${orgAvg > 0 ? orgAvg.toFixed(1) : ''}</td><td>${techAvg > 0 ? techAvg.toFixed(1) : ''}</td><td>${totalAvg > 0 ? totalAvg.toFixed(1) : ''}</td><td>${formattedDate}</td><td class="table-actions"><button class="view-button" data-id="${assessment.partitionKey || ''}" title="View Details">Details</button><button class="delete-button" data-id="${assessment.partitionKey || ''}" title="Delete Entry">Delete</button></td>`;
            tableBody.appendChild(row);
        });
    }
    this.updateSortIndicators();
};

AdminViewController.getQuestionAnswer = function(assessment, questionId) {
    const propertyName = `question${questionId}Answer`;
    if (assessment && assessment.hasOwnProperty(propertyName) && assessment[propertyName] !== null && assessment[propertyName] !== undefined && String(assessment[propertyName]).trim() !== '') {
        const numberValue = Number(assessment[propertyName]); return !isNaN(numberValue) ? numberValue : null;
    } return null;
};

AdminViewController.sortData = function(dataToSort) {
    if (!dataToSort || dataToSort.length === 0) return;
    dataToSort.sort((a, b) => {
        let valueA, valueB;
        const getSortValue = (item, field) => {
            switch (field) {
                case 'aiapplicationaverage': return Number(item.aiApplicationAverage) || 0; case 'peopleorgaverage': return Number(item.peopleOrgAverage) || 0; case 'techdataaverage': return Number(item.techDataAverage) || 0;
                case 'totalaverage': const app = Number(item.aiApplicationAverage) || 0, org = Number(item.peopleOrgAverage) || 0, tech = Number(item.techDataAverage) || 0; const avgs = [app, org, tech].filter(v => v > 0); return avgs.length > 0 ? avgs.reduce((x, y) => x + y, 0) / avgs.length : 0;
                case 'timestamp': const ts = item.timestamp ? new Date(item.timestamp).getTime() : 0; return isNaN(ts) ? 0 : ts;
                case 'question1answer': const qVal = this.getQuestionAnswer(item, 1); return qVal === null ? (this.sortDirection === 'asc' ? -Infinity : Infinity) : qVal;
                default: const directVal = item[field]; return directVal === null || directVal === undefined ? '' : String(directVal);
            }
        };
        valueA = getSortValue(a, this.sortField); valueB = getSortValue(b, this.sortField);
        if (typeof valueA === 'string' && typeof valueB === 'string') { return this.sortDirection === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA); }
        else { valueA = isNaN(valueA) ? (this.sortDirection === 'asc' ? -Infinity : Infinity) : valueA; valueB = isNaN(valueB) ? (this.sortDirection === 'asc' ? -Infinity : Infinity) : valueB; return this.sortDirection === 'asc' ? valueA - valueB : valueB - valueA; }
    });
};

AdminViewController.handleSort = function(event) {
    const headerCell = event.currentTarget; const field = headerCell.dataset.field; if (!field) { console.warn("Sortable header missing data-field."); return; }
    if (field === this.sortField) { this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc'; }
    else { this.sortField = field; this.sortDirection = 'asc'; } this.renderDataTable();
};

AdminViewController.updateSortIndicators = function() {
    document.querySelectorAll('.sortable .sort-indicator').forEach(indicator => { indicator.textContent = ''; });
    const currentHeaderIndicator = document.querySelector(`.sortable[data-field="${this.sortField}"] .sort-indicator`);
    if (currentHeaderIndicator) { currentHeaderIndicator.textContent = this.sortDirection === 'asc' ? ' ▲' : ' ▼'; }
};

AdminViewController.handleViewDetailsClick = function(event) {
    const button = event.target; const id = button.dataset.id;
    if (id) { this.showAssessmentDetails(id); } else { console.error("View button clicked but data-id attribute is missing."); }
};

AdminViewController.handleDeleteClick = function(event) {
    const button = event.target; const partitionKey = button.dataset.id; const row = button.closest('tr'); if (!partitionKey) { console.error("Delete button missing data-id."); return; }
    const name = row?.cells[0]?.textContent || 'this entry'; const confirmed = confirm(`Are you sure you want to permanently delete ${name} (ID: ${partitionKey})?\n\nThis action cannot be undone.`);
    if (confirmed) { if (row) row.style.opacity = '0.5'; button.disabled = true; button.textContent = 'Deleting...'; const viewButton = row?.querySelector('.view-button'); if (viewButton) viewButton.disabled = true; this.deleteAssessmentEntry(partitionKey, button, row); }
};

AdminViewController.deleteAssessmentEntry = async function(partitionKey, buttonElement, rowElement) {
    const authToken = localStorage.getItem('adminAuthToken'); if (!authToken) { alert("Authentication error. Please log in again."); this.handleLogout(); return; }
    try {
        const response = await fetch(`/Admin/DeleteAssessment/${partitionKey}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${authToken}` } });
        if (response.ok) {
            console.log(`Entry ${partitionKey} deleted successfully via API.`); const index = this.assessmentData.findIndex(item => item.partitionKey === partitionKey); if (index > -1) { this.assessmentData.splice(index, 1); } else { console.warn(`Deleted entry ${partitionKey} not found in local data.`); }
            const funnelMetrics = this.calculateFunnelMetrics(); this.renderFunnelVisualization(funnelMetrics); this.renderDataTable();
        } else {
            if (response.status === 401) { alert("Authentication failed. Your session may have expired. Please log in again."); this.handleLogout(); return; }
            else if (response.status === 404) { alert(`Error: Entry with ID ${partitionKey} not found on the server. It might have already been deleted.`); const index = this.assessmentData.findIndex(item => item.partitionKey === partitionKey); if (index > -1) this.assessmentData.splice(index, 1); this.renderDataTable(); }
            else { const errorText = await response.text(); console.error(`Failed deletion. Status: ${response.status}`, errorText); alert(`Failed to delete entry. Server returned status ${response.status}.`); }
            if (rowElement) rowElement.style.opacity = '1'; if (buttonElement) { buttonElement.disabled = false; buttonElement.textContent = 'Delete'; } const viewButton = rowElement?.querySelector('.view-button'); if (viewButton) viewButton.disabled = false;
        }
    } catch (error) {
        console.error('Network or other error deleting entry:', error); alert(`An error occurred: ${error.message}`);
        if (rowElement) rowElement.style.opacity = '1'; if (buttonElement) { buttonElement.disabled = false; buttonElement.textContent = 'Delete'; } const viewButton = rowElement?.querySelector('.view-button'); if (viewButton) viewButton.disabled = false;
    }
};

AdminViewController.showAssessmentDetails = function(assessmentId) {
    const assessment = this.assessmentData.find(a => a.partitionKey === assessmentId); if (!assessment) { console.error(`Details requested for ID ${assessmentId}, but not found.`); alert("Could not find details for the selected assessment."); return; }
    const appAvg = Number(assessment.aiApplicationAverage) || 0; const orgAvg = Number(assessment.peopleOrgAverage) || 0; const techAvg = Number(assessment.techDataAverage) || 0; const validAvgs = [appAvg, orgAvg, techAvg].filter(avg => avg > 0); const totalAvg = validAvgs.length > 0 ? validAvgs.reduce((a, b) => a + b, 0) / validAvgs.length : 0;
    const answers = {}; for (let i = 1; i <= 11; i++) answers[`q${i}`] = this.getQuestionAnswer(assessment, i);
    const timestamp = assessment.timestamp ? new Date(assessment.timestamp) : null; const formattedDate = timestamp ? timestamp.toLocaleString() : 'N/A';
    const modal = document.getElementById('detailsModal'); const modalContent = document.getElementById('modalContent'); if (!modal || !modalContent) { console.error("Modal elements not found."); return; }
    const displayValue = (value, suffix = '', precision = 1, isAverage = false) => { if (value === null || value === undefined) return ''; const numValue = Number(value); if (isAverage && numValue === 0) return ''; if (typeof value === 'number' && !isNaN(numValue)) return `${numValue.toFixed(precision)}${suffix}`; if (typeof value === 'string' && value.trim() === '') return ''; return `${value}${suffix}`; };
    modalContent.innerHTML = `<h2>Assessment Details</h2><div class="detail-section"><h3>Participant Information</h3><div class="detail-grid"><div class="detail-item"><label>Session ID:</label><div>${displayValue(assessment.partitionKey)}</div></div><div class="detail-item"><label>Name:</label><div>${displayValue(assessment.name)}</div></div><div class="detail-item"><label>Email:</label><div>${displayValue(assessment.email)}</div></div><div class="detail-item"><label>Company:</label><div>${displayValue(assessment.company)}</div></div><div class="detail-item"><label>Business Sector:</label><div>${displayValue(assessment.businessSector)}</div></div><div class="detail-item"><label>Company Size:</label><div>${displayValue(assessment.companySize)}</div></div><div class="detail-item"><label>Submission Date:</label><div>${formattedDate}</div></div></div></div><div class="detail-section"><h3>Initial Self-Assessment</h3><div class="detail-grid"><div class="detail-item"><label>AI Ambition (Q1):</label><div>${displayValue(answers.q1, '/5', 0)}</div></div></div></div><div class="detail-section"><h3>AI Application</h3><div class="detail-grid"><div class="detail-item"><label>New AI Products & Services (Q3):</label><div>${displayValue(answers.q3, '/5', 0)}</div></div><div class="detail-item"><label>Process Optimization (Q4):</label><div>${displayValue(answers.q4, '/5', 0)}</div></div><div class="detail-item"><label>Impact Management (Q5):</label><div>${displayValue(answers.q5, '/5', 0)}</div></div><div class="detail-item"><label>Application Average:</label><div>${displayValue(appAvg, '/5', 1, true)}</div></div></div></div><div class="detail-section"><h3>People & Organization</h3><div class="detail-grid"><div class="detail-item"><label>AI Governance (Q6):</label><div>${displayValue(answers.q6, '/5', 0)}</div></div><div class="detail-item"><label>Organization Culture (Q7):</label><div>${displayValue(answers.q7, '/5', 0)}</div></div><div class="detail-item"><label>Skills & Competencies (Q8):</label><div>${displayValue(answers.q8, '/5', 0)}</div></div><div class="detail-item"><label>Organization Average:</label><div>${displayValue(orgAvg, '/5', 1, true)}</div></div></div></div><div class="detail-section"><h3>Tech & Data</h3><div class="detail-grid"><div class="detail-item"><label>AI Tools & Platform (Q9):</label><div>${displayValue(answers.q9, '/5', 0)}</div></div><div class="detail-item"><label>Data Infrastructure (Q10):</label><div>${displayValue(answers.q10, '/5', 0)}</div></div><div class="detail-item"><label>Security & Privacy (Q11):</label><div>${displayValue(answers.q11, '/5', 0)}</div></div><div class="detail-item"><label>Tech & Data Average:</label><div>${displayValue(techAvg, '/5', 1, true)}</div></div></div></div><div class="detail-section"><h3>Overall Average</h3><div class="detail-grid"><div class="detail-item"><label>Total Average:</label><div>${displayValue(totalAvg, '/5', 1, true)}</div></div></div></div>`;
    modal.style.display = 'block';
};

AdminViewController.exportToCSV = function() {
    if (!this.assessmentData || this.assessmentData.length === 0) { alert('No data available to export.'); return; } const dataToExport = this.assessmentData;
    const headers = ['Session ID', 'Name', 'Email', 'Company', 'Business Sector', 'Company Size', 'Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9', 'Q10', 'Q11', 'AI Application Avg', 'Organization Avg', 'Tech & Data Avg', 'Total Average', 'Submission Date (UTC)'];
    const rows = dataToExport.map(assessment => {
        const appAvg = Number(assessment.aiApplicationAverage) || 0; const orgAvg = Number(assessment.peopleOrgAverage) || 0; const techAvg = Number(assessment.techDataAverage) || 0; const validAvgs = [appAvg, orgAvg, techAvg].filter(avg => avg > 0); const totalAvg = validAvgs.length > 0 ? validAvgs.reduce((a,b)=>a+b,0) / validAvgs.length : 0; const timestamp = assessment.timestamp ? new Date(assessment.timestamp) : null; const formattedDate = timestamp ? timestamp.toISOString() : '';
        const csvValue = (value, precision = 1, isAverage = false) => { if (value === null || value === undefined) return ''; const numValue = Number(value); if (isAverage && numValue === 0) return ''; if (!isNaN(numValue)) return numValue.toFixed(precision); return String(value); };
        const answers = {}; for (let i = 1; i <= 11; i++) answers[`q${i}`] = this.getQuestionAnswer(assessment, i);
        return [assessment.partitionKey || '', assessment.name || '', assessment.email || '', assessment.company || '', assessment.businessSector || '', assessment.companySize || '', csvValue(answers.q1, 0), csvValue(answers.q2, 0), csvValue(answers.q3, 0), csvValue(answers.q4, 0), csvValue(answers.q5, 0), csvValue(answers.q6, 0), csvValue(answers.q7, 0), csvValue(answers.q8, 0), csvValue(answers.q9, 0), csvValue(answers.q10, 0), csvValue(answers.q11, 0), csvValue(appAvg, 1, true), csvValue(orgAvg, 1, true), csvValue(techAvg, 1, true), csvValue(totalAvg, 1, true), formattedDate].map(this.escapeCSVValue);
    });
    const BOM = "\uFEFF"; const csvContent = BOM + [ headers.join(','), ...rows.map(row => row.join(',')) ].join('\n'); const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.setAttribute('href', url); const dateStamp = new Date().toISOString().split('T')[0]; link.setAttribute('download', `ai-maturity-assessments-${dateStamp}.csv`); link.style.visibility = 'hidden'; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
};

AdminViewController.escapeCSVValue = function(value) {
    const stringValue = (value === null || value === undefined) ? '' : String(value); if (/[",\n\r]/.test(stringValue)) { return `"${stringValue.replace(/"/g, '""')}"`; } return stringValue;
};
