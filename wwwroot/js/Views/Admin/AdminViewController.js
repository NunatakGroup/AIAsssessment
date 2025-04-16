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

    /**
     * Handles clicks on the funnel steps to filter the table data.
     * @param {Event} event - The click event object.
     */
    handleFunnelFilterClick(event) {
        const clickedStep = event.target.closest('.funnel-step');
        if (!clickedStep) return; // Exit if click wasn't directly on a step or its child

        const filterType = clickedStep.dataset.filter;
        if (!filterType) return; // Exit if step is missing data-filter attribute

        // Toggle behavior: Reset if clicking active filter or 'clicks'
        if (this.activeFilter === filterType || filterType === 'clicks') {
            this.activeFilter = null;
        } else {
            this.activeFilter = filterType;
        }

        console.log("Active filter set to:", this.activeFilter);
        this.updateFunnelHighlighting(); // Update CSS classes for highlighting
        this.renderDataTable(); // Re-render the table with the filter applied
    },

    /**
     * Updates the visual highlighting of the active funnel step.
     */
    updateFunnelHighlighting() {
        document.querySelectorAll('.funnel-step').forEach(step => {
            step.classList.toggle('funnel-step-active', step.dataset.filter === this.activeFilter && this.activeFilter !== null);
        });
    },

    // --- Authentication and View Management ---

    /**
     * Checks if a valid auth token exists in local storage and updates the UI accordingly.
     */
    checkAuthentication() {
        const authToken = localStorage.getItem('adminAuthToken');
        if (authToken) {
            this.isAuthenticated = true;
            this.showAdminPanel();
            this.loadAssessmentData(); // Load data only if authenticated
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

            const response = await fetch('/Admin/Authenticate', { // Ensure this matches your backend endpoint
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: passwordInput.value })
            });

            if (response.ok) {
                const result = await response.json();
                localStorage.setItem('adminAuthToken', result.token);
                this.isAuthenticated = true;
                this.showAdminPanel();
                await this.loadAssessmentData(); // Load data after successful login
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
    },

    /**
     * Shows the admin panel and hides the login form.
     */
    showAdminPanel() {
        const loginContainer = document.getElementById('adminLoginContainer');
        const adminPanel = document.getElementById('adminPanelContainer');
        if (loginContainer) loginContainer.style.display = 'none';
        if (adminPanel) adminPanel.style.display = 'block';
        // Funnel visibility is handled by loadAssessmentData/clearFunnelVisualization
    },

    // --- Data Loading and Processing ---

    /**
     * Fetches assessment data from the backend.
     */
    async loadAssessmentData() {
        const loadingIndicator = document.getElementById('dataLoadingIndicator');
        const errorMessage = document.getElementById('dataErrorMessage');
        const funnelContainer = document.getElementById('funnelVisualizationContainer');

        if (!loadingIndicator || !errorMessage) { console.error("Data status elements missing!"); return; }

        try {
            loadingIndicator.style.display = 'flex';
            errorMessage.style.display = 'none';
            this.activeFilter = null; // Reset filter on every full load
            this.clearFunnelVisualization(); // Clear numbers and set visibility based on auth

            const authToken = localStorage.getItem('adminAuthToken');
            if (!authToken) { this.handleLogout(); return; } // Should not happen if checkAuth worked, but safe check

            const response = await fetch('/Admin/GetAllAssessments', { // Ensure this matches your backend endpoint
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            if (response.ok) {
                const rawData = await response.json();
                this.assessmentData = Array.isArray(rawData) ? rawData : []; // Store full dataset
                console.log(`Loaded ${this.assessmentData.length} assessment entries.`);

                // Calculate and Render Funnel based on the new full dataset
                const funnelMetrics = this.calculateFunnelMetrics(); // Uses this.assessmentData internally
                this.renderFunnelVisualization(funnelMetrics);

                // Render table (will use activeFilter = null initially)
                this.renderDataTable();

                // Update highlighting (ensures nothing highlighted after load)
                this.updateFunnelHighlighting();

            } else if (response.status === 401) {
                console.warn("Authentication failed (401) during data load.");
                this.handleLogout(); // Token likely expired or invalid
            } else {
                const errorText = await response.text();
                console.error(`Failed to load data. Status: ${response.status}`, errorText);
                throw new Error(`Server error ${response.status}`);
            }
        } catch (error) {
            console.error('Error loading assessment data:', error);
            errorMessage.textContent = `Failed to load data: ${error.message}. Please refresh or log in again.`;
            errorMessage.style.display = 'block';
            this.assessmentData = []; // Clear data on error
            this.activeFilter = null;
            this.clearFunnelVisualization(); // Reset funnel
            this.updateFunnelHighlighting(); // Reset highlight
            this.renderDataTable(); // Render empty table state
        } finally {
            loadingIndicator.style.display = 'none';
            // Final check on funnel visibility after load attempt
            if (funnelContainer) {
                 funnelContainer.style.display = this.isAuthenticated ? 'flex' : 'none';
            }
        }
    },

    /**
     * Calculates funnel metrics based on the current full dataset (this.assessmentData).
     * @returns {object} - An object containing the counts for each funnel step.
     */
    calculateFunnelMetrics() {
        const metrics = { clicks: 0, responsesQ1: 0, responsesQ11: 0, leads: 0 };
        const data = this.assessmentData; // Use the controller's data

        if (!Array.isArray(data) || data.length === 0) return metrics;

        metrics.clicks = data.length;
        data.forEach(item => {
            if (this.getQuestionAnswer(item, 1) !== null) metrics.responsesQ1++;
            if (this.getQuestionAnswer(item, 11) !== null) metrics.responsesQ11++;
            if (item?.name && String(item.name).trim() !== '') metrics.leads++;
        });
        return metrics;
    },

    /**
     * Renders the funnel visualization with the calculated metrics.
     * @param {object} metrics - The metrics object from calculateFunnelMetrics.
     */
    renderFunnelVisualization(metrics) {
        const funnelContainer = document.getElementById('funnelVisualizationContainer');
        if (!funnelContainer) { console.error("Funnel container not found!"); return; }

        const elements = {
            valClicks: document.getElementById('funnelValueClicks'),
            valQ1: document.getElementById('funnelValueQ1'),
            valQ11: document.getElementById('funnelValueQ11'),
            valLeads: document.getElementById('funnelValueLeads'),
            percClicks: document.getElementById('funnelPercClicks'),
            percQ1: document.getElementById('funnelPercQ1'),
            percQ11: document.getElementById('funnelPercQ11'),
            percLeads: document.getElementById('funnelPercLeads')
        };

        // Check if all elements exist
        if (Object.values(elements).some(el => !el)) {
            console.error("One or more funnel value/percentage elements not found!");
            return;
        }

        const totalClicks = metrics.clicks;
        const percQ1Val = totalClicks > 0 ? (metrics.responsesQ1 / totalClicks * 100) : 0;
        const percQ11Val = totalClicks > 0 ? (metrics.responsesQ11 / totalClicks * 100) : 0;
        const percLeadsVal = totalClicks > 0 ? (metrics.leads / totalClicks * 100) : 0;

        elements.valClicks.textContent = metrics.clicks;
        elements.valQ1.textContent = metrics.responsesQ1;
        elements.valQ11.textContent = metrics.responsesQ11;
        elements.valLeads.textContent = metrics.leads;
        elements.percClicks.textContent = '100%';
        elements.percQ1.textContent = `${percQ1Val.toFixed(1)}%`;
        elements.percQ11.textContent = `${percQ11Val.toFixed(1)}%`;
        elements.percLeads.textContent = `${percLeadsVal.toFixed(1)}%`;

        // Ensure container visibility reflects authentication state
        funnelContainer.style.display = this.isAuthenticated ? 'flex' : 'none';
    },

    /**
     * Clears the funnel visualization numbers and percentages.
     */
    clearFunnelVisualization() {
        const ids = ['Clicks', 'Q1', 'Q11', 'Leads'];
        ids.forEach(id => {
            const valEl = document.getElementById(`funnelValue${id}`);
            const percEl = document.getElementById(`funnelPerc${id}`);
            if (valEl) valEl.textContent = '0';
            if (percEl) percEl.textContent = id === 'Clicks' ? '100%' : '- %'; // Keep 100% for base? Or set all to '-'? Let's use '-'
        });
         const percClicksEl = document.getElementById('funnelPercClicks'); // Reset base % too
         if(percClicksEl) percClicksEl.textContent = '- %';

        // Also reset visibility based on authentication
        const funnelContainer = document.getElementById('funnelVisualizationContainer');
        if (funnelContainer) {
            funnelContainer.style.display = this.isAuthenticated ? 'flex' : 'none';
        }
    },

    /**
     * Renders the data table, applying filters and sorting.
     */
    renderDataTable() {
        const tableBody = document.querySelector('#assessmentTable tbody');
        if (!tableBody) { console.error("Table body not found!"); return; }

        // 1. Filter Data
        let dataToRender = [];
        if (!this.activeFilter || this.activeFilter === 'clicks') {
            dataToRender = [...this.assessmentData]; // Copy full data
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

        // 2. Sort Data (the filtered subset or copy of full data)
        this.sortData(dataToRender);

        // 3. Render Table
        tableBody.innerHTML = ''; // Clear previous rows

        if (dataToRender.length === 0) {
            const emptyMessage = this.activeFilter && this.activeFilter !== 'clicks'
                ? `No assessment data matches the filter: ${this.activeFilter}`
                : (this.assessmentData.length === 0 ? 'No assessment data available' : 'No data matches the current filter/sort.'); // More specific message
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `<td colspan="12" class="empty-message">${emptyMessage}</td>`;
            tableBody.appendChild(emptyRow);
        } else {
            // Create row elements
            dataToRender.forEach(assessment => {
                const appAvg = Number(assessment.aiApplicationAverage) || 0;
                const orgAvg = Number(assessment.peopleOrgAverage) || 0;
                const techAvg = Number(assessment.techDataAverage) || 0;
                const validAvgs = [appAvg, orgAvg, techAvg].filter(avg => avg > 0);
                const totalAvg = validAvgs.length > 0 ? validAvgs.reduce((a, b) => a + b, 0) / validAvgs.length : 0;
                const q1Answer = this.getQuestionAnswer(assessment, 1);
                const timestamp = assessment.timestamp ? new Date(assessment.timestamp) : null;
                const formattedDate = timestamp ? timestamp.toLocaleDateString() : 'N/A';

                const row = document.createElement('tr');
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
                    </td>
                `;
                tableBody.appendChild(row);
            });
        }
        // 4. Update sort indicators (always done after render)
        this.updateSortIndicators();
    },

    /**
     * Helper to safely get a question answer number.
     * @param {object} assessment - The assessment data object.
     * @param {number} questionId - The question number.
     * @returns {number|null} - The answer number, or null if invalid/missing.
     */
    getQuestionAnswer(assessment, questionId) {
        const propertyName = `question${questionId}Answer`;
        // Check for own property, non-null, non-undefined, non-empty string
        if (assessment && assessment.hasOwnProperty(propertyName) &&
            assessment[propertyName] !== null &&
            assessment[propertyName] !== undefined &&
            String(assessment[propertyName]).trim() !== '') {
            const numberValue = Number(assessment[propertyName]);
            return !isNaN(numberValue) ? numberValue : null; // Return null if conversion fails
        }
        return null; // Return null if missing or invalid
    },

    // --- Sorting ---

    /**
     * Sorts the provided data array based on current sortField and sortDirection.
     * @param {Array} dataToSort - The array of assessment data to sort (will be modified).
     */
    sortData(dataToSort) {
        if (!dataToSort || dataToSort.length === 0) return;

        dataToSort.sort((a, b) => {
            let valueA, valueB;
            const getSortValue = (item, field) => {
                 // Use lowercase field from data-field attribute to access potentially camelCase property
                 switch (field) {
                      case 'aiapplicationaverage': return Number(item.aiApplicationAverage) || 0;
                      case 'peopleorgaverage':   return Number(item.peopleOrgAverage) || 0;
                      case 'techdataaverage':    return Number(item.techDataAverage) || 0;
                      case 'totalaverage':
                          const app = Number(item.aiApplicationAverage) || 0, org = Number(item.peopleOrgAverage) || 0, tech = Number(item.techDataAverage) || 0;
                          const avgs = [app, org, tech].filter(v => v > 0);
                          return avgs.length > 0 ? avgs.reduce((x, y) => x + y, 0) / avgs.length : 0;
                      case 'timestamp':
                          const ts = item.timestamp ? new Date(item.timestamp).getTime() : 0;
                          return isNaN(ts) ? 0 : ts;
                      case 'question1answer':
                          const qVal = this.getQuestionAnswer(item, 1);
                          // Consistent null handling for sorting
                          return qVal === null ? (this.sortDirection === 'asc' ? -Infinity : Infinity) : qVal;
                      // Handle other potential sortable fields (name, email, company etc.)
                      default:
                          const directVal = item[field]; // Assumes field matches a property name (use lowercase field)
                          // Ensure consistent handling of null/undefined for string comparison
                          return directVal === null || directVal === undefined ? '' : String(directVal);
                 }
            };

            valueA = getSortValue(a, this.sortField);
            valueB = getSortValue(b, this.sortField);

            // Comparison logic
             if (typeof valueA === 'string' && typeof valueB === 'string') {
                 return this.sortDirection === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
             } else {
                 // Handle numbers, potentially dates as timestamps, and null question values
                 valueA = isNaN(valueA) ? (this.sortDirection === 'asc' ? -Infinity : Infinity) : valueA;
                 valueB = isNaN(valueB) ? (this.sortDirection === 'asc' ? -Infinity : Infinity) : valueB;
                 return this.sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
             }
        });
    },

    /**
     * Handles clicks on sortable table headers.
     * @param {Event} event - The click event.
     */
    handleSort(event) {
        const headerCell = event.currentTarget;
        const field = headerCell.dataset.field; // Lowercase from HTML data-field
        if (!field) { console.warn("Sortable header missing data-field."); return; }

        if (field === this.sortField) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = 'asc'; // Default to ascending when changing field
        }
        this.renderDataTable(); // Re-render table with new sort order (and current filter)
    },

    /**
     * Updates the visual sort indicators (arrows) in the table headers.
     */
    updateSortIndicators() {
        document.querySelectorAll('.sortable .sort-indicator').forEach(indicator => {
            indicator.textContent = ''; // Clear all indicators
        });
        // Add indicator to the currently sorted column
        const currentHeaderIndicator = document.querySelector(`.sortable[data-field="${this.sortField}"] .sort-indicator`);
        if (currentHeaderIndicator) {
            currentHeaderIndicator.textContent = this.sortDirection === 'asc' ? ' ▲' : ' ▼';
        }
    },

    // --- Table Row Actions (Details/Delete) ---

    /**
     * Handles clicks on the "Details" button in a table row.
     * @param {Event} event - The click event.
     */
    handleViewDetailsClick(event) {
        const button = event.target;
        const id = button.dataset.id;
        if (id) {
            // ShowAssessmentDetails expects the ID (PartitionKey)
            this.showAssessmentDetails(id);
        } else {
            console.error("View button clicked but data-id attribute is missing.");
        }
    },

     /**
     * Handles clicks on the "Delete" button in a table row.
     * @param {Event} event - The click event.
     */
    handleDeleteClick(event) {
        const button = event.target;
        const partitionKey = button.dataset.id;
        const row = button.closest('tr');

        if (!partitionKey) { console.error("Delete button missing data-id."); return; }

        const name = row?.cells[0]?.textContent || 'this entry'; // Get name for confirmation
        const confirmed = confirm(`Are you sure you want to permanently delete ${name} (ID: ${partitionKey})?\n\nThis action cannot be undone.`);

        if (confirmed) {
            // Provide visual feedback
            if (row) row.style.opacity = '0.5';
            button.disabled = true;
            button.textContent = 'Deleting...'; // Indicate activity
            const viewButton = row?.querySelector('.view-button');
            if (viewButton) viewButton.disabled = true;

            // Call the async delete function
            this.deleteAssessmentEntry(partitionKey, button, row);
        }
    },

    /**
     * Calls the backend API to delete an assessment entry.
     * @param {string} partitionKey - The ID of the entry to delete.
     * @param {HTMLButtonElement} buttonElement - The delete button element for feedback.
     * @param {HTMLTableRowElement} rowElement - The table row element for feedback.
     */
    async deleteAssessmentEntry(partitionKey, buttonElement, rowElement) {
        const authToken = localStorage.getItem('adminAuthToken');
        if (!authToken) { alert("Authentication error. Please log in again."); this.handleLogout(); return; }

        try {
            const response = await fetch(`/Admin/DeleteAssessment/${partitionKey}`, { // Ensure URL matches backend
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            if (response.ok) {
                console.log(`Entry ${partitionKey} deleted successfully via API.`);
                // Remove from local data ONLY after successful backend confirmation
                const index = this.assessmentData.findIndex(item => item.partitionKey === partitionKey);
                if (index > -1) {
                    this.assessmentData.splice(index, 1);
                } else {
                    console.warn(`Deleted entry ${partitionKey} not found in local data.`);
                }
                // Recalculate funnel based on updated this.assessmentData
                const funnelMetrics = this.calculateFunnelMetrics();
                this.renderFunnelVisualization(funnelMetrics);
                // Re-render the table completely (will exclude the deleted row)
                this.renderDataTable();
                // Note: No need to reset button/row opacity as the row will be gone after render

            } else {
                 // Handle specific errors before generic message
                 if (response.status === 401) {
                     alert("Authentication failed. Your session may have expired. Please log in again.");
                     this.handleLogout();
                     return; // Stop further processing
                 } else if (response.status === 404) {
                     alert(`Error: Entry with ID ${partitionKey} not found on the server. It might have already been deleted.`);
                     // Refresh local data to sync? Or just remove if found locally? Let's re-render.
                     const index = this.assessmentData.findIndex(item => item.partitionKey === partitionKey);
                     if (index > -1) this.assessmentData.splice(index, 1); // Remove if still present locally
                     this.renderDataTable(); // Re-render to remove the row if it existed
                 } else {
                     const errorText = await response.text();
                     console.error(`Failed deletion. Status: ${response.status}`, errorText);
                     alert(`Failed to delete entry. Server returned status ${response.status}.`);
                 }
                 // Reset button/row visuals on failure
                 if (rowElement) rowElement.style.opacity = '1';
                 if (buttonElement) {
                     buttonElement.disabled = false;
                     buttonElement.textContent = 'Delete'; // Reset text
                 }
                 const viewButton = rowElement?.querySelector('.view-button');
                 if (viewButton) viewButton.disabled = false;
            }
        } catch (error) {
            console.error('Network or other error deleting entry:', error);
            alert(`An error occurred: ${error.message}`);
            // Reset button/row visuals on network error
             if (rowElement) rowElement.style.opacity = '1';
             if (buttonElement) {
                 buttonElement.disabled = false;
                 buttonElement.textContent = 'Delete';
             }
             const viewButton = rowElement?.querySelector('.view-button');
             if (viewButton) viewButton.disabled = false;
        }
    },

    // --- Modal Details ---

    /**
     * Displays the details of a specific assessment in a modal.
     * @param {string} assessmentId - The PartitionKey of the assessment to show.
     */
    showAssessmentDetails(assessmentId) {
        // Find the assessment in the *original* full dataset
        const assessment = this.assessmentData.find(a => a.partitionKey === assessmentId);
        if (!assessment) {
            console.error(`Details requested for ID ${assessmentId}, but not found.`);
            alert("Could not find details for the selected assessment."); return;
        }

        // Calculate averages for display
        const appAvg = Number(assessment.aiApplicationAverage) || 0;
        const orgAvg = Number(assessment.peopleOrgAverage) || 0;
        const techAvg = Number(assessment.techDataAverage) || 0;
        const validAvgs = [appAvg, orgAvg, techAvg].filter(avg => avg > 0);
        const totalAvg = validAvgs.length > 0 ? validAvgs.reduce((a, b) => a + b, 0) / validAvgs.length : 0;

        // Get individual answers using helper
        const answers = {};
        for (let i = 1; i <= 11; i++) answers[`q${i}`] = this.getQuestionAnswer(assessment, i);

        const timestamp = assessment.timestamp ? new Date(assessment.timestamp) : null;
        const formattedDate = timestamp ? timestamp.toLocaleString() : 'N/A'; // Use locale string for date+time

        const modal = document.getElementById('detailsModal');
        const modalContent = document.getElementById('modalContent');
        if (!modal || !modalContent) { console.error("Modal elements not found."); return; }

        // Helper to format values for display in the modal
        const displayValue = (value, suffix = '', precision = 1, isAverage = false) => {
             if (value === null || value === undefined) return '';
             const numValue = Number(value);
             if (isAverage && numValue === 0) return ''; // Hide 0 averages
             if (typeof value === 'number' && !isNaN(numValue)) return `${numValue.toFixed(precision)}${suffix}`;
             if (typeof value === 'string' && value.trim() === '') return '';
             return `${value}${suffix}`; // Return strings as is (plus suffix if any)
        };

        // Populate modal HTML (ensure all question answers q1-q11 are included)
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
                     <div class="detail-item"><label>Total Average:</label><div>${displayValue(totalAvg, '/5', 1, true)}</div></div>
                 </div>
             </div>
        `;
        modal.style.display = 'block'; // Show the modal
    },

    // --- CSV Export ---

    /**
     * Exports the full assessment dataset to a CSV file.
     */
    exportToCSV() {
        // Always export the full, unfiltered dataset
        if (!this.assessmentData || this.assessmentData.length === 0) {
            alert('No data available to export.'); return;
        }
        const dataToExport = this.assessmentData;

        const headers = [
            'Session ID', 'Name', 'Email', 'Company', 'Business Sector', 'Company Size',
            'Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9', 'Q10', 'Q11', // Individual Qs
            'AI Application Avg', 'Organization Avg', 'Tech & Data Avg', 'Total Average', // Averages
            'Submission Date (UTC)'
        ];

        const rows = dataToExport.map(assessment => {
            const appAvg = Number(assessment.aiApplicationAverage) || 0;
            const orgAvg = Number(assessment.peopleOrgAverage) || 0;
            const techAvg = Number(assessment.techDataAverage) || 0;
            const validAvgs = [appAvg, orgAvg, techAvg].filter(avg => avg > 0);
            const totalAvg = validAvgs.length > 0 ? validAvgs.reduce((a,b)=>a+b,0) / validAvgs.length : 0;
            const timestamp = assessment.timestamp ? new Date(assessment.timestamp) : null;
            const formattedDate = timestamp ? timestamp.toISOString() : ''; // ISO 8601 UTC

            // Helper for CSV values (shows 0 for questions, empty for 0 averages)
            const csvValue = (value, precision = 1, isAverage = false) => {
                 if (value === null || value === undefined) return '';
                 const numValue = Number(value);
                 if (isAverage && numValue === 0) return '';
                 if (!isNaN(numValue)) return numValue.toFixed(precision);
                 return String(value); // Return non-numbers as string
            };

            // Get all question answers for the row
            const answers = {};
             for (let i = 1; i <= 11; i++) answers[`q${i}`] = this.getQuestionAnswer(assessment, i);

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

        // Create and trigger download
        const BOM = "\uFEFF"; // For Excel UTF-8 compatibility
        const csvContent = BOM + [ headers.join(','), ...rows.map(row => row.join(',')) ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        const dateStamp = new Date().toISOString().split('T')[0];
        link.setAttribute('download', `ai-maturity-assessments-${dateStamp}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url); // Clean up blob URL
    },

    /**
     * Escapes values for CSV compatibility (handles commas, quotes, newlines).
     * @param {*} value - The value to escape.
     * @returns {string} - The CSV-safe string.
     */
    escapeCSVValue(value) {
        const stringValue = (value === null || value === undefined) ? '' : String(value);
        // If value contains comma, quote, newline, or carriage return, enclose in quotes
        if (/[",\n\r]/.test(stringValue)) {
            // Escape existing double quotes by doubling them
            return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue; // Return as is if no special characters
    }
};

// Initialize the controller once the DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AdminViewController.initialize());
} else {
    AdminViewController.initialize(); // DOM is already ready
}