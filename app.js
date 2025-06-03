document.addEventListener('DOMContentLoaded', () => {
    // Set API configuration - make it dynamic for deployment
    const API_BASE_URL = `${window.location.protocol}//${window.location.host}`;
    const API_KEY = 'RZbfSKKe3qCtHVk0ty3H41yJc403rMNzdj73v7ar6Owp5kfQjuLiyaRrOsoe81N5';

    // WebSocket connection
    let ws = null;
    let wsReconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    
    function connectWebSocket() {
        try {
            // Make WebSocket URL dynamic based on current location
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${wsProtocol}//${window.location.host}`;
            
            console.log(`🔄 Connecting to WebSocket: ${wsUrl}`);
            ws = new WebSocket(wsUrl);
            
            ws.onopen = function(event) {
                console.log('🔌 Connected to WebSocket server');
                wsReconnectAttempts = 0;
                showNotification('Connected to real-time updates', 'success');
                updateLiveIndicator('connected');
                updateConnectionStatus('✅ Connected');
                
                // Subscribe to updates
                ws.send(JSON.stringify({
                    type: 'subscribe',
                    data: { types: ['task_started', 'task_stopped', 'server_status', 'account_created', 'account_updated', 'account_deleted'] }
                }));
            };
            
            ws.onmessage = function(event) {
                try {
                    const message = JSON.parse(event.data);
                    handleWebSocketMessage(message);
                } catch (error) {
                    console.error('❌ WebSocket message parse error:', error);
                }
            };
            
            ws.onclose = function(event) {
                console.log(`🔌 WebSocket connection closed (Code: ${event.code}, Reason: ${event.reason || 'No reason'})`);
                showNotification('Real-time updates disconnected', 'warning');
                updateLiveIndicator('disconnected');
                updateConnectionStatus('❌ Disconnected', `Code: ${event.code}`);
                
                // Only attempt to reconnect if the page is still visible and focused
                // This prevents unnecessary reconnections from background tabs
                if (!document.hidden && wsReconnectAttempts < maxReconnectAttempts) {
                    wsReconnectAttempts++;
                    const delay = Math.min(5000 * wsReconnectAttempts, 30000); // Max 30 second delay
                    console.log(`🔄 Attempting to reconnect in ${delay/1000}s (${wsReconnectAttempts}/${maxReconnectAttempts})...`);
                    updateLiveIndicator('connecting');
                    updateConnectionStatus('🔄 Reconnecting...', `Attempt ${wsReconnectAttempts}/${maxReconnectAttempts} in ${delay/1000}s`);
                    setTimeout(connectWebSocket, delay);
                } else if (wsReconnectAttempts >= maxReconnectAttempts) {
                    console.log('❌ Max reconnection attempts reached');
                    updateConnectionStatus('❌ Connection Failed', 'Max attempts reached');
                    showNotification('Connection failed - please refresh the page', 'error');
                }
            };
            
            ws.onerror = function(error) {
                console.error('❌ WebSocket error:', error);
                showNotification('WebSocket connection error', 'error');
                updateLiveIndicator('error');
                updateConnectionStatus('❌ Error', error.message || 'Connection failed');
            };
            
        } catch (error) {
            console.error('❌ WebSocket connection failed:', error);
            updateLiveIndicator('error');
        }
    }
    
    function updateLiveIndicator(status) {
        const indicator = document.getElementById('live-indicator');
        if (!indicator) return;
        
        switch (status) {
            case 'connected':
                indicator.innerHTML = '<span class="live-indicator"></span>LIVE';
                indicator.style.color = '#4CAF50';
                break;
            case 'disconnected':
                indicator.innerHTML = '<span style="width: 8px; height: 8px; background-color: #f44336; border-radius: 50%; margin-right: 8px; display: inline-block;"></span>OFFLINE';
                indicator.style.color = '#f44336';
                break;
            case 'connecting':
                indicator.innerHTML = '<span style="width: 8px; height: 8px; background-color: #ff9800; border-radius: 50%; margin-right: 8px; display: inline-block; animation: pulse 1s infinite;"></span>CONNECTING';
                indicator.style.color = '#ff9800';
                break;
            case 'error':
                indicator.innerHTML = '<span style="width: 8px; height: 8px; background-color: #f44336; border-radius: 50%; margin-right: 8px; display: inline-block;"></span>ERROR';
                indicator.style.color = '#f44336';
                break;
        }
    }
    
    function handleWebSocketMessage(message) {
        // Only log important messages, not ping/pong or frequent status updates
        if (message.type !== 'pong' && message.type !== 'server_status') {
            console.log('📨 WebSocket message:', message);
        }
        
        switch (message.type) {
            case 'connection':
                console.log('✅ WebSocket connected:', message.data.message);
                break;
                
            case 'task_started':
                showNotification(`Task ${message.data.task.id} started`, 'success');
                updateTaskInUI(message.data.task);
                break;
                
            case 'task_stopped':
                showNotification(`Task ${message.data.task.id} stopped`, 'info');
                updateTaskInUI(message.data.task);
                break;
                
            case 'account_created':
                showNotification(`Account ${message.data.account.username} created`, 'success');
                refreshAccountsIfVisible();
                break;
                
            case 'account_updated':
                showNotification(`Account ${message.data.account.username} updated`, 'info');
                refreshAccountsIfVisible();
                break;
                
            case 'account_deleted':
                showNotification(`Account deleted`, 'warning');
                refreshAccountsIfVisible();
                break;
                
            case 'server_status':
                updateServerStatus(message.data);
                break;
                
            case 'pong':
                // Silently handle pong - no logging needed
                break;
                
            default:
                console.log('📨 Unknown WebSocket message type:', message.type);
        }
    }
    
    function refreshAccountsIfVisible() {
        const accountsSection = document.getElementById('accounts-section');
        if (accountsSection && accountsSection.style.display !== 'none') {
            // Refresh accounts list to show updated data
            fetchAccounts(1, 10, currentFilters.account);
        }
    }
    
    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 4px;
            color: white;
            font-weight: bold;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;
        
        // Set background color based on type
        switch (type) {
            case 'success':
                notification.style.backgroundColor = '#4CAF50';
                break;
            case 'error':
                notification.style.backgroundColor = '#f44336';
                break;
            case 'warning':
                notification.style.backgroundColor = '#ff9800';
                break;
            default:
                notification.style.backgroundColor = '#2196F3';
        }
        
        document.body.appendChild(notification);
        
        // Remove notification after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }
    
    function updateTaskInUI(task) {
        // Update task in the tasks list if it exists
        const taskElement = document.querySelector(`[data-task-id="${task.id}"]`);
        if (taskElement) {
            const statusElement = taskElement.querySelector('.task-status');
            if (statusElement) {
                statusElement.textContent = task.status;
                statusElement.className = `task-status status-${task.status}`;
            }
        }
        
        // If we're on the tasks section, refresh the tasks list
        const tasksSection = document.getElementById('tasks-section');
        if (tasksSection && tasksSection.style.display !== 'none') {
            // Refresh tasks list to show updated data
            const currentPage = parseInt(document.getElementById('tasks-page-info')?.textContent.match(/\d+/)?.[0] || '1');
            const perPage = parseInt(document.getElementById('tasks-per-page')?.value || '10');
            fetchTasks(currentPage, perPage);
        }
    }
    
    function updateServerStatus(status) {
        // Update server status indicator if it exists
        let statusIndicator = document.getElementById('server-status');
        if (!statusIndicator) {
            statusIndicator = document.createElement('div');
            statusIndicator.id = 'server-status';
            statusIndicator.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 20px;
                padding: 8px 12px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                border-radius: 4px;
                font-size: 12px;
                z-index: 9999;
            `;
            document.body.appendChild(statusIndicator);
        }
        
        const uptime = Math.floor(status.uptime);
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        
        statusIndicator.innerHTML = `
            🟢 Server Online | Uptime: ${hours}h ${minutes}m | Connections: ${status.connections}
        `;
    }
    
    // Connect to WebSocket on page load
    connectWebSocket();
    
    // Handle page visibility changes to manage connections better
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            console.log('📱 Page hidden - pausing WebSocket activity');
            // Don't close the connection, just pause reconnection attempts
        } else {
            console.log('📱 Page visible - resuming WebSocket activity');
            // If connection is lost and we're visible again, try to reconnect
            if (!ws || ws.readyState !== WebSocket.OPEN) {
                wsReconnectAttempts = 0; // Reset attempts when page becomes visible
                connectWebSocket();
            }
        }
    });
    
    // Send periodic ping to keep connection alive (reduced frequency)
    setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
        }
    }, 120000); // Every 2 minutes instead of 30 seconds

    // Add connection info display for debugging
    console.log(`🌐 API Base URL: ${API_BASE_URL}`);
    console.log(`🔌 WebSocket will connect to: ${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`);
    
    // Add connection status to page for debugging
    const connectionInfo = document.createElement('div');
    connectionInfo.id = 'connection-info';
    connectionInfo.style.cssText = `
        position: fixed;
        top: 50px;
        right: 20px;
        padding: 10px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        border-radius: 4px;
        font-size: 11px;
        z-index: 9998;
        max-width: 300px;
        font-family: monospace;
    `;
    connectionInfo.innerHTML = `
        <div>🌐 API: ${API_BASE_URL}</div>
        <div>🔌 WebSocket: ${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}</div>
        <div id="connection-status">⏳ Connecting...</div>
        <button id="health-check-btn" style="margin-top: 5px; padding: 2px 6px; font-size: 10px;">Test Connection</button>
    `;
    document.body.appendChild(connectionInfo);
    
    // Update connection status
    function updateConnectionStatus(status, details = '') {
        const statusElement = document.getElementById('connection-status');
        if (statusElement) {
            statusElement.innerHTML = `${status} ${details}`;
        }
    }
    
    // Health check function
    async function performHealthCheck() {
        try {
            updateConnectionStatus('⏳ Testing...', '');
            console.log('🏥 Performing health check...');
            
            const response = await fetch(`${API_BASE_URL}/health`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Health check passed:', data);
                updateConnectionStatus('✅ Server Healthy', `DB: ${data.database}`);
                showNotification('Server is healthy and reachable', 'success');
                return true;
            } else {
                console.error('❌ Health check failed:', response.status);
                updateConnectionStatus('❌ Health Check Failed', `Status: ${response.status}`);
                showNotification(`Health check failed: ${response.status}`, 'error');
                return false;
            }
        } catch (error) {
            console.error('❌ Health check error:', error);
            updateConnectionStatus('❌ Health Check Error', error.message);
            showNotification(`Cannot reach server: ${error.message}`, 'error');
            return false;
        }
    }
    
    // Add health check button event listener
    document.addEventListener('click', (e) => {
        if (e.target.id === 'health-check-btn') {
            performHealthCheck();
        }
    });
    
    // Perform initial health check
    setTimeout(performHealthCheck, 1000);

    // Add filter state management
    let currentFilters = {
        account: {},
        proxy: {}
    };

    // Add navigation menu
    const navMenu = document.createElement('div');
    navMenu.id = 'nav-menu';
    
    // Add live indicator
    const liveIndicator = document.createElement('span');
    liveIndicator.id = 'live-indicator';
    liveIndicator.innerHTML = '<span class="live-indicator"></span>LIVE';
    navMenu.appendChild(liveIndicator);
    
    const sections = ['Agents', 'Accounts', 'Proxies', 'Bots', 'Tasks', 'Categories', 'Prime Requests', 'Client Launcher'];
    sections.forEach(section => {
        const button = document.createElement('button');
        button.textContent = section;
        button.onclick = () => showSection(section.toLowerCase().replace(' ', '-'));
        navMenu.appendChild(button);
    });

    // Add navigation menu to the top of the page
    document.body.insertBefore(navMenu, document.body.firstChild);

    // Create main container
    const mainContainer = document.createElement('div');
    mainContainer.className = 'main-container';

    // Create sections container
    const sectionsContainer = document.createElement('div');
    sectionsContainer.id = 'sections-container';
    mainContainer.appendChild(sectionsContainer);

    // Add main container to body
    document.body.insertBefore(mainContainer, document.body.children[1]);

    // Create section containers
    const sections_data = {
        agents: { title: 'Agents', visible: true },
        accounts: { title: 'Accounts', visible: false },
        proxies: { title: 'Proxies', visible: false },
        bots: { title: 'Bots', visible: false },
        tasks: { title: 'Tasks', visible: false },
        categories: { title: 'Categories', visible: false },
        'prime-requests': { title: 'Prime Link Requests', visible: false }
    };

    Object.entries(sections_data).forEach(([id, data]) => {
        const section = document.createElement('div');
        section.id = `${id}-section`;
        section.style.display = data.visible ? 'block' : 'none';
        
        const title = document.createElement('h2');
        title.textContent = data.title;
        section.appendChild(title);

        if (id === 'accounts') {
            // Add account management UI
            const accountControls = document.createElement('div');
            accountControls.innerHTML = `
                <div class="filter-controls">
                    <input type="text" id="account-category-filter" placeholder="Category IDs (comma-separated)">
                    <input type="text" id="country-code-filter" placeholder="Country Codes (comma-separated)">
                    <button id="apply-account-filters">Apply Filters</button>
                </div>
                <div class="action-buttons">
                    <button id="create-account">Create Account</button>
                    <button id="get-tutorial-accounts">Get Tutorial Accounts</button>
                    <button id="get-check-accounts">Get Check Accounts</button>
                </div>
                <div id="accounts-list"></div>
                <div id="account-form" style="display: none;">
                    <h3>Create/Edit Account</h3>
                    <input type="text" id="account-username" placeholder="Username">
                    <input type="password" id="account-password" placeholder="Password">
                    <input type="email" id="account-email" placeholder="Email (optional)">
                    <select id="account-type">
                        <option value="p2p">P2P</option>
                        <option value="member">Member</option>
                        <option value="ironman">Ironman</option>
                        <option value="hardcore">Hardcore</option>
                    </select>
                    <input type="text" id="account-category" placeholder="Category ID">
                    <input type="text" id="account-otp" placeholder="OTP Key">
                    <input type="number" id="account-tutorial-status" placeholder="Tutorial Status (0-1000)" min="0" max="1000" value="0">
                    <button id="save-account">Save Account</button>
                    <button id="cancel-account">Cancel</button>
                </div>
            `;
            section.appendChild(accountControls);
        }

        if (id === 'proxies') {
            const proxyControls = document.createElement('div');
            proxyControls.innerHTML = `
                <div class="filter-controls">
                    <input type="text" id="proxy-category-filter" placeholder="Category IDs (comma-separated)">
                    <input type="text" id="country-code-filter-proxy" placeholder="Country Codes (comma-separated)">
                    <button id="apply-proxy-filters">Apply Filters</button>
                </div>
                <div class="action-buttons">
                    <button id="create-proxy">Create Proxy</button>
                </div>
                <div id="proxies-list"></div>
                <div id="proxy-form" style="display: none;">
                    <h3>Create/Edit Proxy</h3>
                    <select id="proxy-type">
                        <option value="socks5">SOCKS5</option>
                        <option value="http">HTTP</option>
                        <option value="https">HTTPS</option>
                    </select>
                    <input type="text" id="proxy-ip" placeholder="IP Address">
                    <input type="number" id="proxy-port" placeholder="Port">
                    <input type="text" id="proxy-username" placeholder="Username">
                    <input type="password" id="proxy-password" placeholder="Password">
                    <input type="text" id="proxy-category" placeholder="Category ID">
                    <button id="save-proxy">Save Proxy</button>
                    <button id="cancel-proxy">Cancel</button>
                </div>
            `;
            section.appendChild(proxyControls);
        }

        if (id === 'tasks') {
            const taskControls = document.createElement('div');
            taskControls.innerHTML = `
                <div class="filter-controls">
                    <label for="tasks-per-page">Tasks per page:</label>
                    <select id="tasks-per-page">
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                    </select>
                    <button id="refresh-tasks">Refresh Tasks</button>
                </div>
                <div id="tasks-list"></div>
                <div class="pagination">
                    <button id="prev-tasks-page">Previous</button>
                    <span id="tasks-page-info">Page 1</span>
                    <button id="next-tasks-page">Next</button>
                </div>
            `;
            section.appendChild(taskControls);
        }

        if (id === 'bots') {
            const botControls = document.createElement('div');
            botControls.innerHTML = `
                <div class="action-buttons">
                    <button id="create-bot">Create Bot</button>
                    <button id="refresh-bots">Refresh Bots</button>
                </div>
                <div id="bots-list"></div>
                <div id="bot-form" style="display: none;">
                    <h3>Create/Edit Bot</h3>
                    <input type="text" id="bot-name" placeholder="Bot Name">
                    <input type="text" id="bot-type" placeholder="Bot Type">
                    <input type="text" id="bot-version" placeholder="Version">
                    <select id="bot-agent">
                        <option value="">Select Agent</option>
                    </select>
                    <button id="save-bot">Save Bot</button>
                    <button id="cancel-bot">Cancel</button>
                </div>
            `;
            section.appendChild(botControls);
        }

        if (id === 'categories') {
            const categoryControls = document.createElement('div');
            categoryControls.innerHTML = `
                <div class="category-tabs">
                    <button id="account-categories-tab" class="active">Account Categories</button>
                    <button id="proxy-categories-tab">Proxy Categories</button>
                </div>
                <div id="account-categories-section">
                    <div class="action-buttons">
                        <button id="create-account-category">Create Account Category</button>
                    </div>
                    <div id="account-categories-list"></div>
                </div>
                <div id="proxy-categories-section" style="display: none;">
                    <div class="action-buttons">
                        <button id="create-proxy-category">Create Proxy Category</button>
                    </div>
                    <div id="proxy-categories-list"></div>
                </div>
                <div id="category-form" style="display: none;">
                    <h3>Create/Edit Category</h3>
                    <input type="text" id="category-name" placeholder="Category Name">
                    <textarea id="category-description" placeholder="Description"></textarea>
                    <button id="save-category">Save Category</button>
                    <button id="cancel-category">Cancel</button>
                </div>
            `;
            section.appendChild(categoryControls);
        }

        if (id === 'prime-requests') {
            const primeControls = document.createElement('div');
            primeControls.innerHTML = `
                <div class="action-buttons">
                    <button id="create-prime-request">Create Prime Request</button>
                    <button id="refresh-prime-requests">Refresh Requests</button>
                </div>
                <div id="prime-requests-list"></div>
                <div id="prime-request-form" style="display: none;">
                    <h3>Create Prime Link Request</h3>
                    <select id="prime-account">
                        <option value="">Select Account</option>
                    </select>
                    <textarea id="prime-notes" placeholder="Notes"></textarea>
                    <button id="save-prime-request">Save Request</button>
                    <button id="cancel-prime-request">Cancel</button>
                </div>
            `;
            section.appendChild(primeControls);
        }

        sectionsContainer.appendChild(section);
    });

    // Add task management state
    let currentTaskPage = 1;
    let tasksPerPage = 10;
    let totalTasks = 0;

    // Task management functions
    async function fetchTasks(page = 1, perPage = 10) {
        try {
            const response = await apiRequest(`/api/v1/tasks?page=${page}&per_page=${perPage}`);
            const tasksList = document.getElementById('tasks-list');
            const pageInfo = document.getElementById('tasks-page-info');
            
            if (!tasksList) return;
            
            tasksList.innerHTML = '';
            totalTasks = response.total_items;
            
            if (response && response.data && response.data.length > 0) {
                response.data.forEach(task => {
                    const taskDiv = document.createElement('div');
                    taskDiv.classList.add('task-item');
                    taskDiv.innerHTML = `
                        <div class="task-header">
                            <span class="task-id">ID: ${task.id}</span>
                            <span class="task-name">${task.name}</span>
                            <span class="task-status status-${task.status.toLowerCase()}">${task.status}</span>
                        </div>
                        <div class="task-details">
                            <span>Type: ${task.type}</span>
                            <span>Script: ${task.script_name}</span>
                            <span>Agent ID: ${task.agent_id}</span>
                            <span>Account ID: ${task.account_id}</span>
                            <span>Updated: ${new Date(task.updated_at).toLocaleString()}</span>
                        </div>
                        <div class="task-actions">
                            ${task.status !== 'running' ? 
                                `<button onclick="startTask(${task.id})">Start</button>` : 
                                `<button onclick="stopTask(${task.id})">Stop</button>`}
                        </div>
                    `;
                    tasksList.appendChild(taskDiv);
                });
                
                if (pageInfo) {
                    pageInfo.textContent = `Page ${page} of ${Math.ceil(totalTasks / perPage)}`;
                }
            } else {
                tasksList.innerHTML = '<p>No tasks found.</p>';
                if (pageInfo) {
                    pageInfo.textContent = 'No tasks';
                }
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
            const tasksList = document.getElementById('tasks-list');
            if (tasksList) {
                tasksList.innerHTML = `<p>Error loading tasks: ${error.message}</p>`;
            }
        }
    }

    async function startTask(taskId) {
        try {
            await apiRequest(`/api/v1/tasks/${taskId}/start`, 'POST');
            alert('Task started successfully!');
            fetchTasks(currentTaskPage, tasksPerPage);
        } catch (error) {
            console.error('Error starting task:', error);
            alert(`Failed to start task: ${error.message}`);
        }
    }

    async function stopTask(taskId) {
        try {
            await apiRequest(`/api/v1/tasks/${taskId}/stop`, 'POST');
            alert('Task stopped successfully!');
            fetchTasks(currentTaskPage, tasksPerPage);
        } catch (error) {
            console.error('Error stopping task:', error);
            alert(`Failed to stop task: ${error.message}`);
        }
    }

    // Add event listeners for task management
    document.getElementById('refresh-tasks')?.addEventListener('click', () => {
        fetchTasks(currentTaskPage, tasksPerPage);
    });

    document.getElementById('tasks-per-page')?.addEventListener('change', (e) => {
        tasksPerPage = parseInt(e.target.value);
        currentTaskPage = 1; // Reset to first page
        fetchTasks(currentTaskPage, tasksPerPage);
    });

    document.getElementById('prev-tasks-page')?.addEventListener('click', () => {
        if (currentTaskPage > 1) {
            currentTaskPage--;
            fetchTasks(currentTaskPage, tasksPerPage);
        }
    });

    document.getElementById('next-tasks-page')?.addEventListener('click', () => {
        if (currentTaskPage * tasksPerPage < totalTasks) {
            currentTaskPage++;
            fetchTasks(currentTaskPage, tasksPerPage);
        }
    });

    // Add CSS styles for tasks
    const taskStyles = document.createElement('style');
    taskStyles.textContent = `
        .task-item {
            border: 1px solid #ddd;
            margin: 10px 0;
            padding: 15px;
            border-radius: 5px;
        }
        .task-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        .task-details {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px;
            margin-bottom: 10px;
        }
        .task-actions {
            text-align: right;
        }
        .status-running { color: green; }
        .status-stopped { color: red; }
        .status-completed { color: blue; }
        .status-failed { color: orange; }
        .pagination {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 10px;
            margin-top: 20px;
        }
        #tasks-page-info {
            min-width: 100px;
            text-align: center;
        }
    `;
    document.head.appendChild(taskStyles);

    function showSection(sectionName) {
        Object.keys(sections_data).forEach(id => {
            const section = document.getElementById(`${id}-section`);
            section.style.display = id === sectionName ? 'block' : 'none';
        });

        if (sectionName === 'client-launcher') {
            refreshLauncherData();
        }
    }

    const apiKeyInput = document.getElementById('apiKey');
    const saveApiKeyButton = document.getElementById('saveApiKey');
    const loadAgentsButton = document.getElementById('loadAgents');
    const agentsListUl = document.getElementById('agents-list');
    const clientsSection = document.getElementById('clients-section');
    const clientsHeaderAgentId = document.getElementById('current-agent-id');
    const clientsListDiv = document.getElementById('clients-list');
    const refreshClientsButton = document.getElementById('refreshClients');

    const clientControlsSection = document.getElementById(
        'client-controls-section'
    );
    const currentClientIdManageSpan = document.getElementById(
        'current-client-id-manage'
    );
    const scriptNameInput = document.getElementById('scriptName');
    const scriptParamsInput = document.getElementById('scriptParams');
    const runDurationSelect = document.getElementById('runDuration');
    const startDreambotButton = document.getElementById('startDreambotClient');

    const scheduledStopsListUl = document.getElementById(
        'scheduled-stops-list'
    );
    const currentDateTimeSpan = document.getElementById('currentDateTime');

    let activeAgentId = null;
    let scheduledTasks = JSON.parse(localStorage.getItem('scheduledTasks')) || {};

    // Add pagination state
    let currentPage = 1;
    const itemsPerPage = 10;  // Default to 10 items per page

    // Pre-fill API key from localStorage
    if (apiKeyInput) {
        apiKeyInput.value = API_KEY;
    }

    async function apiRequest(endpoint, method = 'GET', body = null) {
        const url = `${API_BASE_URL}${endpoint}`;
        console.log(`Making ${method} request to: ${url}`);
        
        const headers = {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        console.log('Request headers:', {
            ...headers,
            'Authorization': 'Bearer ' + API_KEY.substring(0, 10) + '...'
        });
        
        if (body) {
            console.log('Request body:', body);
        }

        const config = {
            method: method,
            headers: headers,
        };

        if (body) {
            config.body = JSON.stringify(body);
        }

        try {
            console.log(`🌐 Attempting fetch to: ${url}`);
            const response = await fetch(url, config);
            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));
            
            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                    console.error('API Error Response:', errorData);
                } catch (e) {
                    errorData = { error: response.statusText };
                    console.error('Failed to parse error response:', e);
                }
                
                // Show user-friendly error notification
                showNotification(`API Error: ${response.status} - ${errorData.error || response.statusText}`, 'error');
                
                throw new Error(
                    `API request failed: ${response.status} - ${
                        errorData.error || 'Unknown error'
                    }`
                );
            }
            
            if (response.status === 204) {
                return null;
            }
            
            const data = await response.json();
            console.log('Response data:', data);
            return data;
        } catch (error) {
            console.error('API request error:', {
                message: error.message,
                url: url,
                method: method,
                stack: error.stack
            });
            
            // Check for network errors
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                console.error('❌ Network error - likely CORS or connection issue');
                showNotification(`Network Error: Cannot connect to ${API_BASE_URL}`, 'error');
                updateConnectionStatus('❌ Network Error', 'Cannot reach server');
            } else if (error.message.includes('Failed to fetch')) {
                console.error('❌ Failed to fetch - server may be down or CORS issue');
                showNotification('Server unreachable - check if server is running', 'error');
                updateConnectionStatus('❌ Server Unreachable', 'Check server status');
            }
            
            throw error;
        }
    }

    // Add pagination controls
    const paginationDiv = document.createElement('div');
    paginationDiv.id = 'pagination-controls';
    paginationDiv.style.marginTop = '10px';
    
    const prevButton = document.createElement('button');
    prevButton.textContent = 'Previous Page';
    prevButton.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            fetchAgents();
        }
    };
    
    const nextButton = document.createElement('button');
    nextButton.textContent = 'Next Page';
    nextButton.onclick = () => {
        currentPage++;
        fetchAgents();
    };
    
    const pageInfo = document.createElement('span');
    pageInfo.style.margin = '0 10px';
    
    paginationDiv.appendChild(prevButton);
    paginationDiv.appendChild(pageInfo);
    paginationDiv.appendChild(nextButton);
    
    // Insert pagination controls after the agents list
    agentsListUl.parentNode.insertBefore(paginationDiv, agentsListUl.nextSibling);

    async function fetchAgents() {
        try {
            console.log('Attempting to fetch agents...');
            console.log('Using API key:', API_KEY ? `${API_KEY.substring(0, 5)}...` : 'No key set');
            
            pageInfo.textContent = `Page ${currentPage}`;
            const response = await apiRequest('/api/v1/agents');
            
            console.log('Received agents response:', response);
            agentsListUl.innerHTML = '';
            
            if (response && response.data && response.data.length > 0) {
                response.data.forEach((agent) => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        ID: ${agent.id} - Name: ${agent.name || 'N/A'} - Status: ${agent.status}
                        <button data-agent-id="${agent.id}" class="view-clients">View Clients</button>
                    `;
                    agentsListUl.appendChild(li);
                });
                document.querySelectorAll('.view-clients').forEach((button) => {
                    button.addEventListener('click', (e) => {
                        activeAgentId = e.target.dataset.agentId;
                        clientsHeaderAgentId.textContent = activeAgentId;
                        clientsSection.style.display = 'block';
                        clientControlsSection.style.display = 'none';
                        fetchClients(activeAgentId);
                    });
                });
            } else {
                agentsListUl.innerHTML = '<li>No agents found. Make sure your EternalFarm API key is configured in config.env</li>';
            }
        } catch (error) {
            console.error('Error fetching agents:', error);
            agentsListUl.innerHTML = `<li>Error loading agents: ${error.message}</li>`;
        }
    }

    // Add manual sync function
    async function syncAgentsManually() {
        try {
            showNotification('Syncing agents from EternalFarm...', 'info');
            const response = await apiRequest('/api/v1/agents/sync', 'POST');
            
            if (response && response.message) {
                showNotification(`${response.message} (${response.agents_count} agents)`, 'success');
                // Refresh the agents list
                await fetchAgents();
            }
        } catch (error) {
            console.error('Error syncing agents:', error);
            if (error.message.includes('EternalFarm API key not configured')) {
                showNotification('EternalFarm API key not configured. Check config.env file.', 'error');
            } else {
                showNotification(`Agent sync failed: ${error.message}`, 'error');
            }
        }
    }

    loadAgentsButton.addEventListener('click', fetchAgents);

    // Add sync agents button event listener
    const syncAgentsButton = document.getElementById('syncAgents');
    if (syncAgentsButton) {
        syncAgentsButton.addEventListener('click', syncAgentsManually);
    }

    async function fetchClients(agentId) {
        if (!agentId) return;
        agentId = parseInt(agentId);
        activeAgentId = agentId;
        try {
            console.log(`Fetching tasks for agent ${agentId}`);
            const response = await apiRequest(`/api/v1/tasks?agent_id=${agentId}`);
            clientsListDiv.innerHTML = '';
            if (response && response.data && response.data.length > 0) {
                response.data.forEach((task) => {
                    const clientDiv = document.createElement('div');
                    clientDiv.classList.add('client-item');
                    const uniquePrefix = `task-${task.id}`;
                    
                    let statusText = task.status;
                    const isRunning = task.status === 'running';

                    clientDiv.innerHTML = `
                        <span>ID: ${task.id}</span>
                        <span>Type: ${task.type}</span>
                        <span>Script: ${task.script_name || 'N/A'}</span>
                        <span>Status: <strong id="${uniquePrefix}-status" class="status-${isRunning ? 'running' : 'stopped'}">${statusText}</strong></span>
                        <div class="actions" id="${uniquePrefix}-actions">
                            ${!isRunning ? 
                                `<button id="${uniquePrefix}-start" data-agent-id="${agentId}" data-task-id="${task.id}" class="start-task">Start Task</button>` : 
                                `<button id="${uniquePrefix}-stop" data-agent-id="${agentId}" data-task-id="${task.id}" class="stop-task">Stop Task</button>`
                            }
                            <button id="${uniquePrefix}-refresh" data-agent-id="${agentId}" data-task-id="${task.id}" class="refresh-task-status">Refresh Status</button>
                        </div>
                    `;
                    clientsListDiv.appendChild(clientDiv);
                });
                
                // Attach event listeners after adding all tasks
                attachTaskButtonListeners();
            } else {
                clientsListDiv.innerHTML = '<p>No tasks found for this agent. You can start a new one.</p>';
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
            clientsListDiv.innerHTML = `<p>Error loading tasks: ${error.message}</p>`;
        }
    }
    
    function showClientControls(agentId, clientId) {
        const uniquePrefix = `client-control-${clientId || 'new'}`;
        clientControlsSection.innerHTML = `
            <h3>Client Controls</h3>
            <div id="${uniquePrefix}-form" class="client-control-form">
                <input type="text" id="${uniquePrefix}-script-name" placeholder="Script Name">
                <input type="text" id="${uniquePrefix}-script-params" placeholder="Script Parameters">
                <select id="${uniquePrefix}-duration">
                    <option value="1">1 hour</option>
                    <option value="2">2 hours</option>
                    <option value="4">4 hours</option>
                    <option value="8">8 hours</option>
                    <option value="12">12 hours</option>
                    <option value="24">24 hours</option>
                </select>
                <button id="${uniquePrefix}-start" data-agent-id="${agentId}" data-client-id="${clientId}">Start Client</button>
                <button id="${uniquePrefix}-cancel">Cancel</button>
            </div>
        `;
        
        // Attach event listeners for the new form
        document.getElementById(`${uniquePrefix}-start`).addEventListener('click', () => {
            const scriptName = document.getElementById(`${uniquePrefix}-script-name`).value;
            const scriptParams = document.getElementById(`${uniquePrefix}-script-params`).value;
            const duration = document.getElementById(`${uniquePrefix}-duration`).value;
            startClient(agentId, scriptName, scriptParams, duration);
        });
        
        document.getElementById(`${uniquePrefix}-cancel`).addEventListener('click', () => {
            clientControlsSection.style.display = 'none';
        });
        
        clientControlsSection.style.display = 'block';
    }

    function attachTaskButtonListeners() {
        console.log('Attaching task button listeners');
        
        document.querySelectorAll('.stop-task').forEach((button) => {
            const taskId = button.dataset.taskId;
            const agentId = button.dataset.agentId;
            console.log(`Found stop button for task ${taskId}`);
            
            // Remove any existing listeners to prevent duplicates
            button.removeEventListener('click', null);
            
            // Add new click listener
            button.addEventListener('click', async (e) => {
                console.log(`Stop button clicked - Agent ID: ${agentId}, Task ID: ${taskId}`);
                try {
                    await stopTask(parseInt(taskId), parseInt(agentId));
                    await fetchClients(agentId);
                } catch (error) {
                    console.error('Error in stop button click handler:', error);
                    alert(`Failed to stop task: ${error.message}`);
                }
            });
        });

        document.querySelectorAll('.start-task').forEach((button) => {
            const taskId = button.dataset.taskId;
            const agentId = button.dataset.agentId;
            
            button.addEventListener('click', async (e) => {
                console.log(`Start button clicked - Agent ID: ${agentId}, Task ID: ${taskId}`);
                try {
                    await startTask(parseInt(taskId), parseInt(agentId));
                    await fetchClients(agentId);
                } catch (error) {
                    console.error('Error in start button click handler:', error);
                    alert(`Failed to start task: ${error.message}`);
                }
            });
        });
    }

    refreshClientsButton.addEventListener('click', () => {
        if (activeAgentId) {
            fetchClients(activeAgentId);
        } else {
            alert('No agent selected.');
        }
    });

    async function refreshSingleClientStatus(agentId, clientId, clientItemElement) {
        try {
            const response = await apiRequest(`/api/v1/agents/${agentId}/clients/${clientId}`);
            const client = response.data;
            if (client && clientItemElement) {
                let statusText = client.running ? 'Running' : 'Stopped';
                 if (client.status && client.status !== statusText.toLowerCase()){
                    statusText = `${statusText} (Status: ${client.status})`;
                }
                const statusElement = clientItemElement.querySelector('strong');
                statusElement.textContent = statusText;
                statusElement.className = `status-${client.running ? 'running' : 'stopped'}`;
                alert(`Client ${clientId} status updated: ${statusText}`);
            }
        } catch (error) {
            alert(`Error refreshing status for client ${clientId}: ${error.message}`);
        }
    }

    startDreambotButton.addEventListener('click', async () => {
        const agentIdToStartOn = startDreambotButton.dataset.agentId;
        if (!agentIdToStartOn) {
            alert('Error: Agent ID not set for starting client.');
            return;
        }

        const script = scriptNameInput.value.trim();
        const params = scriptParamsInput.value.trim();
        const durationHours = parseInt(runDurationSelect.value, 10);

        if (!script) {
            alert('Script name is required.');
            return;
        }

        const requestBody = {
            client_type: 'dreambot',
            script_name: script,
            script_args: params,  // Changed from params to script_args to match API
            // Optional fields:
            // identity_id: null,
            // proxy_id: null,
            // world: null
        };

        try {
            const result = await apiRequest(
                `/api/v1/agents/${agentIdToStartOn}/clients/start`,
                'POST',
                requestBody
            );
            const newTaskId = result.data.id;  // Updated to handle the response structure
            alert(`Dreambot client started successfully! Task ID: ${newTaskId}`);
            
            if (durationHours > 0) {
                const durationMillis = durationHours * 60 * 60 * 1000;

                // Clear any existing timer for this task ID (shouldn't happen for new, but good practice)
                if (scheduledTasks[newTaskId] && scheduledTasks[newTaskId].timeoutId) {
                    clearTimeout(scheduledTasks[newTaskId].timeoutId);
                }

                const timeoutId = setTimeout(async () => {
                    console.log(`Scheduled stop for task ${newTaskId} after ${durationHours} hours.`);
                    await stopTask(newTaskId, agentIdToStartOn, true); // Pass true for isScheduled
                }, durationMillis);

                scheduledTasks[newTaskId] = { 
                    timeoutId, 
                    agentId: agentIdToStartOn, 
                    startTime: Date.now(), 
                    durationHours,
                    stopTime: Date.now() + durationMillis
                };
                updateScheduledStopsDisplay();
            }

            fetchClients(agentIdToStartOn);
            clientControlsSection.style.display = 'none';
        } catch (error) {
            alert(`Failed to start Dreambot client: ${error.message}`);
        }
    });

    async function startClient(agentId, scriptName, scriptParams, duration) {
        try {
            const taskData = {
                type: "dreambot",
                script_name: scriptName,
                script_args: scriptParams,
                agent_id: parseInt(agentId)
            };

            const result = await apiRequest('/api/v1/tasks', 'POST', taskData);
            const newTaskId = result.data.id;
            
            // Start the task
            await startTask(newTaskId, agentId);
            alert(`Task created and started successfully! Task ID: ${newTaskId}`);
            
            if (duration > 0) {
                const durationMillis = duration * 60 * 60 * 1000;

                if (scheduledTasks[newTaskId] && scheduledTasks[newTaskId].timeoutId) {
                    clearTimeout(scheduledTasks[newTaskId].timeoutId);
                }

                const timeoutId = setTimeout(async () => {
                    console.log(`Scheduled stop for task ${newTaskId} after ${duration} hours.`);
                    await stopTask(newTaskId, agentId, true);
                }, durationMillis);

                scheduledTasks[newTaskId] = { 
                    timeoutId, 
                    agentId: agentId, 
                    startTime: Date.now(), 
                    durationHours: duration,
                    stopTime: Date.now() + durationMillis
                };
                updateScheduledStopsDisplay();
            }

            fetchClients(agentId);
            clientControlsSection.style.display = 'none';
        } catch (error) {
            alert(`Failed to create and start task: ${error.message}`);
        }
    }

    async function stopClient(agentId, taskId, isScheduled = false) {
        try {
            console.log(`Attempting to stop task ${taskId} for agent ${agentId}`);
            
            await stopTask(parseInt(taskId), parseInt(agentId));
            
            if (!isScheduled) {
                alert(`Task ${taskId} stopped successfully.`);
            }
            
            if (scheduledTasks[taskId]) {
                clearTimeout(scheduledTasks[taskId].timeoutId);
                delete scheduledTasks[taskId];
                updateScheduledStopsDisplay();
                if (!isScheduled) {
                    alert(`Scheduled stop for task ${taskId} has been cancelled.`);
                }
            }
            
            await fetchClients(agentId);
        } catch (error) {
            console.error('Stop task error:', error);
            const errorMessage = error.message.includes('404') 
                ? `Failed to stop task ${taskId}: Task not found for agent ${agentId}`
                : `Failed to stop task ${taskId}: ${error.message}`;
            alert(errorMessage);
            await fetchClients(agentId);
        }
    }

    function updateScheduledStopsDisplay() {
        scheduledStopsListUl.innerHTML = '';
        localStorage.setItem('scheduledTasks', JSON.stringify(scheduledTasks)); // Persist

        const activeTaskClientIds = Object.keys(scheduledTasks);

        if (activeTaskClientIds.length === 0) {
            scheduledStopsListUl.innerHTML = '<li>No tasks currently scheduled for auto-stop.</li>';
            return;
        }

        activeTaskClientIds.forEach(clientId => {
            const task = scheduledTasks[clientId];
            if (!task) return; // Should not happen if logic is correct

            const stopTimeDate = new Date(task.stopTime);
            const li = document.createElement('li');
            li.textContent = `Task ${clientId} (Agent ${task.agentId}) scheduled to stop at ${stopTimeDate.toLocaleTimeString()} on ${stopTimeDate.toLocaleDateString()}.`;
            
            const cancelButton = document.createElement('button');
            cancelButton.textContent = 'Cancel Scheduled Stop';
            cancelButton.style.marginLeft = '10px';
            cancelButton.style.backgroundColor = '#f39c12';
            cancelButton.onclick = () => {
                clearTimeout(task.timeoutId);
                delete scheduledTasks[clientId];
                updateScheduledStopsDisplay();
                alert(`Scheduled stop for ${clientId} cancelled.`);
                // No need to call API to stop, as it was a future task.
            };
            li.appendChild(cancelButton);
            scheduledStopsListUl.appendChild(li);
        });
    }

    function rehydrateScheduledTasks() {
        const now = Date.now();
        Object.keys(scheduledTasks).forEach(clientId => {
            const task = scheduledTasks[clientId];
            if (task.stopTime <= now) {
                // Task should have executed, remove it
                console.log(`Removing past due scheduled task for client ${clientId}`);
                delete scheduledTasks[clientId];
            } else {
                // Re-arm the timer
                const remainingTime = task.stopTime - now;
                task.timeoutId = setTimeout(async () => {
                    console.log(`Re-armed scheduled stop for client ${clientId} after ${task.durationHours} hours (from original start).`);
                    await stopClient(task.agentId, clientId, true);
                }, remainingTime);
            }
        });
        updateScheduledStopsDisplay();
    }

    // Account management functions
    async function fetchAccounts(page = 1, perPage = 10, filters = {}) {
        try {
            let queryParams = `page=${page}&per_page=${perPage}`;
            Object.entries(filters).forEach(([key, value]) => {
                if (value) queryParams += `&${key}=${encodeURIComponent(value)}`;
            });
            
            const response = await apiRequest(`/api/v1/accounts?${queryParams}`);
            const accountsList = document.getElementById('accounts-list');
            accountsList.innerHTML = '';

            if (response && response.data && response.data.length > 0) {
                response.data.forEach(account => {
                    const accountDiv = document.createElement('div');
                    accountDiv.classList.add('account-item');
                    accountDiv.innerHTML = `
                        <span>ID: ${account.id}</span>
                        <span>Username: ${account.username}</span>
                        <span>Type: ${account.type}</span>
                        <span>Status: ${account.status}</span>
                        <span>Tutorial: ${account.tutorial_status || 0}/1000</span>
                        <span>Category: ${account.category?.name || 'N/A'}</span>
                        <div class="actions">
                            <button onclick="editAccount(${account.id})">Edit</button>
                            <button onclick="deleteAccount(${account.id})">Delete</button>
                        </div>
                    `;
                    accountsList.appendChild(accountDiv);
                });
            } else {
                accountsList.innerHTML = '<p>No accounts found.</p>';
            }
        } catch (error) {
            console.error('Error fetching accounts:', error);
            alert('Failed to fetch accounts. Check console for details.');
        }
    }

    async function createAccount(accountData) {
        try {
            const response = await apiRequest('/api/v1/accounts', 'POST', accountData);
            alert('Account created successfully!');
            fetchAccounts();
            return response.data;
        } catch (error) {
            console.error('Error creating account:', error);
            alert('Failed to create account. Check console for details.');
        }
    }

    async function updateAccount(accountId, accountData) {
        try {
            const response = await apiRequest(`/api/v1/accounts/${accountId}`, 'PUT', accountData);
            alert('Account updated successfully!');
            fetchAccounts();
            return response.data;
        } catch (error) {
            console.error('Error updating account:', error);
            alert('Failed to update account. Check console for details.');
        }
    }

    async function deleteAccount(accountId) {
        if (!confirm('Are you sure you want to delete this account?')) return;
        
        try {
            await apiRequest(`/api/v1/accounts/${accountId}`, 'DELETE');
            alert('Account deleted successfully!');
            fetchAccounts();
        } catch (error) {
            console.error('Error deleting account:', error);
            alert('Failed to delete account. Check console for details.');
        }
    }

    async function getTutorialAccounts(filters = {}) {
        try {
            const response = await apiRequest('/api/v1/accounts/tutorial', 'GET', null, filters);
            alert('Retrieved tutorial accounts successfully!');
            return response.data;
        } catch (error) {
            console.error('Error getting tutorial accounts:', error);
            alert('Failed to get tutorial accounts. Check console for details.');
        }
    }

    async function getCheckAccounts(count = 3, filters = {}) {
        try {
            const response = await apiRequest(`/api/v1/accounts/check?count=${count}`, 'GET', null, filters);
            alert('Retrieved check accounts successfully!');
            return response.data;
        } catch (error) {
            console.error('Error getting check accounts:', error);
            alert('Failed to get check accounts. Check console for details.');
        }
    }

    // Event listeners for account management
    document.getElementById('apply-account-filters')?.addEventListener('click', () => {
        const categoryIds = document.getElementById('account-category-filter').value;
        const countryCodes = document.getElementById('country-code-filter').value;
        
        currentFilters.account = {
            account_category_id: categoryIds,
            country_code: countryCodes
        };
        
        fetchAccounts(1, 10, currentFilters.account);
    });

    document.getElementById('create-account')?.addEventListener('click', () => {
        document.getElementById('account-form').style.display = 'block';
    });

    document.getElementById('save-account')?.addEventListener('click', async () => {
        const accountData = {
            username: document.getElementById('account-username').value,
            password: document.getElementById('account-password').value,
            email: document.getElementById('account-email').value,
            account_type: document.getElementById('account-type').value,
            account_category_id: document.getElementById('account-category').value,
            otp_key: document.getElementById('account-otp').value,
            tutorial_status: document.getElementById('account-tutorial-status').value
        };

        if (!accountData.username || !accountData.password) {
            alert('Username and password are required!');
            return;
        }

        await createAccount(accountData);
        document.getElementById('account-form').style.display = 'none';
    });

    document.getElementById('cancel-account')?.addEventListener('click', () => {
        document.getElementById('account-form').style.display = 'none';
    });

    document.getElementById('get-tutorial-accounts')?.addEventListener('click', async () => {
        const accounts = await getTutorialAccounts(currentFilters.account);
        // Handle the retrieved accounts
        console.log('Tutorial accounts:', accounts);
    });

    document.getElementById('get-check-accounts')?.addEventListener('click', async () => {
        const accounts = await getCheckAccounts(3, currentFilters.account);
        // Handle the retrieved accounts
        console.log('Check accounts:', accounts);
    });

    // Proxy management functions
    async function fetchProxies(page = 1, perPage = 10, filters = {}) {
        try {
            let queryParams = `page=${page}&per_page=${perPage}`;
            Object.entries(filters).forEach(([key, value]) => {
                if (value) queryParams += `&${key}=${encodeURIComponent(value)}`;
            });
            
            const response = await apiRequest(`/api/v1/proxies?${queryParams}`);
            const proxiesList = document.getElementById('proxies-list');
            proxiesList.innerHTML = '';

            if (response && response.data && response.data.length > 0) {
                response.data.forEach(proxy => {
                    const proxyDiv = document.createElement('div');
                    proxyDiv.classList.add('proxy-item');
                    proxyDiv.innerHTML = `
                        <span>ID: ${proxy.id}</span>
                        <span>Type: ${proxy.type}</span>
                        <span>IP: ${proxy.host}:${proxy.port}</span>
                        <span>Category: ${proxy.category?.name || 'N/A'}</span>
                        <div class="actions">
                            <button onclick="editProxy(${proxy.id})">Edit</button>
                            <button onclick="deleteProxy(${proxy.id})">Delete</button>
                        </div>
                    `;
                    proxiesList.appendChild(proxyDiv);
                });
            } else {
                proxiesList.innerHTML = '<p>No proxies found.</p>';
            }
        } catch (error) {
            console.error('Error fetching proxies:', error);
            alert('Failed to fetch proxies. Check console for details.');
        }
    }

    async function createProxy(proxyData) {
        try {
            const response = await apiRequest('/api/v1/proxies', 'POST', proxyData);
            alert('Proxy created successfully!');
            fetchProxies();
            return response.data;
        } catch (error) {
            console.error('Error creating proxy:', error);
            alert('Failed to create proxy. Check console for details.');
        }
    }

    async function updateProxy(proxyId, proxyData) {
        try {
            const response = await apiRequest(`/api/v1/proxies/${proxyId}`, 'PUT', proxyData);
            alert('Proxy updated successfully!');
            fetchProxies();
            return response.data;
        } catch (error) {
            console.error('Error updating proxy:', error);
            alert('Failed to update proxy. Check console for details.');
        }
    }

    async function deleteProxy(proxyId) {
        if (!confirm('Are you sure you want to delete this proxy?')) return;
        
        try {
            await apiRequest(`/api/v1/proxies/${proxyId}`, 'DELETE');
            alert('Proxy deleted successfully!');
            fetchProxies();
        } catch (error) {
            console.error('Error deleting proxy:', error);
            alert('Failed to delete proxy. Check console for details.');
        }
    }

    // Event listeners for proxy management
    document.getElementById('apply-proxy-filters')?.addEventListener('click', () => {
        const categoryIds = document.getElementById('proxy-category-filter').value;
        const countryCodes = document.getElementById('country-code-filter-proxy').value;
        
        currentFilters.proxy = {
            proxy_category_id: categoryIds,
            country_code: countryCodes
        };
        
        fetchProxies(1, 10, currentFilters.proxy);
    });

    document.getElementById('create-proxy')?.addEventListener('click', () => {
        document.getElementById('proxy-form').style.display = 'block';
    });

    document.getElementById('save-proxy')?.addEventListener('click', async () => {
        const proxyData = {
            type: document.getElementById('proxy-type').value,
            ip_address: document.getElementById('proxy-ip').value,
            port: parseInt(document.getElementById('proxy-port').value),
            username: document.getElementById('proxy-username').value,
            password: document.getElementById('proxy-password').value,
            proxy_category_id: document.getElementById('proxy-category').value || null
        };

        if (!proxyData.ip_address || !proxyData.port || !proxyData.type) {
            alert('IP Address, Port, and Type are required!');
            return;
        }

        await createProxy(proxyData);
        document.getElementById('proxy-form').style.display = 'none';
    });

    document.getElementById('cancel-proxy')?.addEventListener('click', () => {
        document.getElementById('proxy-form').style.display = 'none';
    });

    // Bot management functions
    async function fetchBots() {
        try {
            const response = await apiRequest('/api/v1/bots');
            const botsList = document.getElementById('bots-list');
            if (!botsList) return;
            
            botsList.innerHTML = '';

            if (response && response.data && response.data.length > 0) {
                response.data.forEach(bot => {
                    const botDiv = document.createElement('div');
                    botDiv.classList.add('bot-item');
                    botDiv.innerHTML = `
                        <div class="bot-header">
                            <span class="bot-id">ID: ${bot.id}</span>
                            <span class="bot-name">${bot.name}</span>
                            <span class="bot-status status-${bot.status.toLowerCase()}">${bot.status}</span>
                        </div>
                        <div class="bot-details">
                            <span>Type: ${bot.type}</span>
                            <span>Version: ${bot.version || 'N/A'}</span>
                            <span>Agent: ${bot.agent_id}</span>
                            <span>Updated: ${new Date(bot.updated_at).toLocaleString()}</span>
                        </div>
                        <div class="bot-actions">
                            <button onclick="editBot(${bot.id})">Edit</button>
                            <button onclick="deleteBot(${bot.id})">Delete</button>
                        </div>
                    `;
                    botsList.appendChild(botDiv);
                });
            } else {
                botsList.innerHTML = '<p>No bots found.</p>';
            }
        } catch (error) {
            console.error('Error fetching bots:', error);
            const botsList = document.getElementById('bots-list');
            if (botsList) {
                botsList.innerHTML = `<p>Error loading bots: ${error.message}</p>`;
            }
        }
    }

    async function createBot(botData) {
        try {
            const response = await apiRequest('/api/v1/bots', 'POST', botData);
            alert('Bot created successfully!');
            fetchBots();
            return response.data;
        } catch (error) {
            console.error('Error creating bot:', error);
            alert('Failed to create bot. Check console for details.');
        }
    }

    async function updateBot(botId, botData) {
        try {
            const response = await apiRequest(`/api/v1/bots/${botId}`, 'PUT', botData);
            alert('Bot updated successfully!');
            fetchBots();
            return response.data;
        } catch (error) {
            console.error('Error updating bot:', error);
            alert('Failed to update bot. Check console for details.');
        }
    }

    async function deleteBot(botId) {
        if (!confirm('Are you sure you want to delete this bot?')) return;
        
        try {
            await apiRequest(`/api/v1/bots/${botId}`, 'DELETE');
            alert('Bot deleted successfully!');
            fetchBots();
        } catch (error) {
            console.error('Error deleting bot:', error);
            alert('Failed to delete bot. Check console for details.');
        }
    }

    // Category management functions
    async function fetchAccountCategories() {
        try {
            const response = await apiRequest('/api/v1/account-categories');
            const categoriesList = document.getElementById('account-categories-list');
            if (!categoriesList) return;
            
            categoriesList.innerHTML = '';

            if (response && response.data && response.data.length > 0) {
                response.data.forEach(category => {
                    const categoryDiv = document.createElement('div');
                    categoryDiv.classList.add('category-item');
                    categoryDiv.innerHTML = `
                        <div class="category-header">
                            <span class="category-id">ID: ${category.id}</span>
                            <span class="category-name">${category.name}</span>
                        </div>
                        <div class="category-details">
                            <span>Description: ${category.description || 'N/A'}</span>
                            <span>Created: ${new Date(category.created_at).toLocaleString()}</span>
                        </div>
                        <div class="category-actions">
                            <button onclick="editAccountCategory(${category.id})">Edit</button>
                            <button onclick="deleteAccountCategory(${category.id})">Delete</button>
                        </div>
                    `;
                    categoriesList.appendChild(categoryDiv);
                });
            } else {
                categoriesList.innerHTML = '<p>No account categories found.</p>';
            }
        } catch (error) {
            console.error('Error fetching account categories:', error);
        }
    }

    async function fetchProxyCategories() {
        try {
            const response = await apiRequest('/api/v1/proxy-categories');
            const categoriesList = document.getElementById('proxy-categories-list');
            if (!categoriesList) return;
            
            categoriesList.innerHTML = '';

            if (response && response.data && response.data.length > 0) {
                response.data.forEach(category => {
                    const categoryDiv = document.createElement('div');
                    categoryDiv.classList.add('category-item');
                    categoryDiv.innerHTML = `
                        <div class="category-header">
                            <span class="category-id">ID: ${category.id}</span>
                            <span class="category-name">${category.name}</span>
                        </div>
                        <div class="category-details">
                            <span>Description: ${category.description || 'N/A'}</span>
                            <span>Created: ${new Date(category.created_at).toLocaleString()}</span>
                        </div>
                        <div class="category-actions">
                            <button onclick="editProxyCategory(${category.id})">Edit</button>
                            <button onclick="deleteProxyCategory(${category.id})">Delete</button>
                        </div>
                    `;
                    categoriesList.appendChild(categoryDiv);
                });
            } else {
                categoriesList.innerHTML = '<p>No proxy categories found.</p>';
            }
        } catch (error) {
            console.error('Error fetching proxy categories:', error);
        }
    }

    // Prime Link Request management functions
    async function fetchPrimeLinkRequests() {
        try {
            const response = await apiRequest('/api/v1/prime-link-requests');
            const requestsList = document.getElementById('prime-requests-list');
            if (!requestsList) return;
            
            requestsList.innerHTML = '';

            if (response && response.data && response.data.length > 0) {
                response.data.forEach(request => {
                    const requestDiv = document.createElement('div');
                    requestDiv.classList.add('prime-request-item');
                    requestDiv.innerHTML = `
                        <div class="request-header">
                            <span class="request-id">ID: ${request.id}</span>
                            <span class="request-status status-${request.status.toLowerCase()}">${request.status}</span>
                        </div>
                        <div class="request-details">
                            <span>Account ID: ${request.account_id}</span>
                            <span>Requested: ${new Date(request.requested_at).toLocaleString()}</span>
                            <span>Processed: ${request.processed_at ? new Date(request.processed_at).toLocaleString() : 'N/A'}</span>
                            <span>Notes: ${request.notes || 'N/A'}</span>
                        </div>
                        <div class="request-actions">
                            <button onclick="editPrimeLinkRequest(${request.id})">Edit</button>
                            <button onclick="deletePrimeLinkRequest(${request.id})">Delete</button>
                            ${request.status === 'pending' ? `<button onclick="processPrimeLinkRequest(${request.id})">Process</button>` : ''}
                        </div>
                    `;
                    requestsList.appendChild(requestDiv);
                });
            } else {
                requestsList.innerHTML = '<p>No prime link requests found.</p>';
            }
        } catch (error) {
            console.error('Error fetching prime link requests:', error);
        }
    }

    async function createPrimeLinkRequest(requestData) {
        try {
            const response = await apiRequest('/api/v1/prime-link-requests', 'POST', requestData);
            alert('Prime link request created successfully!');
            fetchPrimeLinkRequests();
            return response.data;
        } catch (error) {
            console.error('Error creating prime link request:', error);
            alert('Failed to create prime link request. Check console for details.');
        }
    }

    // Enhanced task management with agent and account assignment
    async function startTaskOnAgent(taskId, agentId, accountId) {
        try {
            const response = await apiRequest(`/api/v1/tasks/${taskId}/start`, 'POST', {
                agent_id: agentId,
                account_id: accountId
            });
            alert('Task started successfully!');
            fetchTasks();
            return response.data;
        } catch (error) {
            console.error('Error starting task:', error);
            alert('Failed to start task. Check console for details.');
        }
    }

    async function stopTaskOnAgent(taskId, agentId, accountId) {
        try {
            const response = await apiRequest(`/api/v1/tasks/${taskId}/stop`, 'POST', {
                agent_id: agentId,
                account_id: accountId
            });
            alert('Task stopped successfully!');
            fetchTasks();
            return response.data;
        } catch (error) {
            console.error('Error stopping task:', error);
            alert('Failed to stop task. Check console for details.');
        }
    }

    // Event listeners for new features
    document.getElementById('create-bot')?.addEventListener('click', async () => {
        // Load agents for the dropdown
        const agents = await apiRequest('/api/v1/agents');
        const agentSelect = document.getElementById('bot-agent');
        agentSelect.innerHTML = '<option value="">Select Agent</option>';
        if (agents && agents.data) {
            agents.data.forEach(agent => {
                agentSelect.innerHTML += `<option value="${agent.id}">${agent.name}</option>`;
            });
        }
        document.getElementById('bot-form').style.display = 'block';
    });

    document.getElementById('refresh-bots')?.addEventListener('click', fetchBots);

    document.getElementById('save-bot')?.addEventListener('click', async () => {
        const botData = {
            name: document.getElementById('bot-name').value,
            type: document.getElementById('bot-type').value,
            version: document.getElementById('bot-version').value,
            agent_id: parseInt(document.getElementById('bot-agent').value)
        };

        if (!botData.name || !botData.type || !botData.agent_id) {
            alert('Name, Type, and Agent are required!');
            return;
        }

        await createBot(botData);
        document.getElementById('bot-form').style.display = 'none';
    });

    document.getElementById('cancel-bot')?.addEventListener('click', () => {
        document.getElementById('bot-form').style.display = 'none';
    });

    // Category tab switching
    document.getElementById('account-categories-tab')?.addEventListener('click', () => {
        document.getElementById('account-categories-section').style.display = 'block';
        document.getElementById('proxy-categories-section').style.display = 'none';
        document.getElementById('account-categories-tab').classList.add('active');
        document.getElementById('proxy-categories-tab').classList.remove('active');
        fetchAccountCategories();
    });

    document.getElementById('proxy-categories-tab')?.addEventListener('click', () => {
        document.getElementById('account-categories-section').style.display = 'none';
        document.getElementById('proxy-categories-section').style.display = 'block';
        document.getElementById('proxy-categories-tab').classList.add('active');
        document.getElementById('account-categories-tab').classList.remove('active');
        fetchProxyCategories();
    });

    // Prime requests event listeners
    document.getElementById('create-prime-request')?.addEventListener('click', async () => {
        // Load accounts for the dropdown
        const accounts = await apiRequest('/api/v1/accounts');
        const accountSelect = document.getElementById('prime-account');
        accountSelect.innerHTML = '<option value="">Select Account</option>';
        if (accounts && accounts.data) {
            accounts.data.forEach(account => {
                accountSelect.innerHTML += `<option value="${account.id}">${account.username} (ID: ${account.id})</option>`;
            });
        }
        document.getElementById('prime-request-form').style.display = 'block';
    });

    document.getElementById('refresh-prime-requests')?.addEventListener('click', fetchPrimeLinkRequests);

    document.getElementById('save-prime-request')?.addEventListener('click', async () => {
        const requestData = {
            account_id: parseInt(document.getElementById('prime-account').value),
            notes: document.getElementById('prime-notes').value
        };

        if (!requestData.account_id) {
            alert('Account selection is required!');
            return;
        }

        await createPrimeLinkRequest(requestData);
        document.getElementById('prime-request-form').style.display = 'none';
    });

    document.getElementById('cancel-prime-request')?.addEventListener('click', () => {
        document.getElementById('prime-request-form').style.display = 'none';
    });

    // Initial setup - automatically load agents
    fetchAgents();

    // Add new section after the existing sections
    const clientLauncherSection = document.createElement('section');
    clientLauncherSection.id = 'client-launcher';
    clientLauncherSection.className = 'section';
    clientLauncherSection.style.display = 'none';

    const sectionHeader = document.createElement('div');
    sectionHeader.className = 'section-header';

    const h2 = document.createElement('h2');
    h2.textContent = '🚀 Client Launcher';
    sectionHeader.appendChild(h2);

    const p = document.createElement('p');
    p.textContent = 'Launch clients with automated P2P Master AI on a timer';
    sectionHeader.appendChild(p);

    clientLauncherSection.appendChild(sectionHeader);

    const launcherControls = document.createElement('div');
    launcherControls.className = 'launcher-controls';

    const controlGroup1 = document.createElement('div');
    controlGroup1.className = 'control-group';

    const label1 = document.createElement('label');
    label1.textContent = 'Select Account:';
    label1.htmlFor = 'launcher-account-select';
    controlGroup1.appendChild(label1);

    const select1 = document.createElement('select');
    select1.id = 'launcher-account-select';
    select1.innerHTML = '<option value="">Choose an account...</option>';
    launcherControls.appendChild(controlGroup1);

    const controlGroup2 = document.createElement('div');
    controlGroup2.className = 'control-group';

    const label2 = document.createElement('label');
    label2.textContent = 'Select Bot:';
    label2.htmlFor = 'launcher-bot-select';
    controlGroup2.appendChild(label2);

    const select2 = document.createElement('select');
    select2.id = 'launcher-bot-select';
    select2.innerHTML = '<option value="">Choose a bot...</option>';
    launcherControls.appendChild(controlGroup2);

    const controlGroup3 = document.createElement('div');
    controlGroup3.className = 'control-group';

    const label3 = document.createElement('label');
    label3.textContent = 'Select Agent:';
    label3.htmlFor = 'launcher-agent-select';
    controlGroup3.appendChild(label3);

    const select3 = document.createElement('select');
    select3.id = 'launcher-agent-select';
    select3.innerHTML = '<option value="">Choose an agent...</option>';
    launcherControls.appendChild(controlGroup3);

    const controlGroup4 = document.createElement('div');
    controlGroup4.className = 'control-group';

    const label4 = document.createElement('label');
    label4.textContent = 'Timer Duration (minutes):';
    label4.htmlFor = 'launcher-timer';
    controlGroup4.appendChild(label4);

    const input4 = document.createElement('input');
    input4.type = 'number';
    input4.id = 'launcher-timer';
    input4.min = '1';
    input4.max = '1440';
    input4.value = '60';
    input4.placeholder = '60';
    controlGroup4.appendChild(input4);

    const controlGroup5 = document.createElement('div');
    controlGroup5.className = 'control-group';

    const label5 = document.createElement('label');
    label5.textContent = 'Auto-restart when timer ends:';
    label5.htmlFor = 'launcher-auto-restart';
    controlGroup5.appendChild(label5);

    const input5 = document.createElement('input');
    input5.type = 'checkbox';
    input5.id = 'launcher-auto-restart';
    controlGroup5.appendChild(input5);

    const launcherActions = document.createElement('div');
    launcherActions.className = 'launcher-actions';

    const launchButton = document.createElement('button');
    launchButton.textContent = '🚀 Launch Client';
    launchButton.onclick = launchClient;
    launcherActions.appendChild(launchButton);

    const stopAllButton = document.createElement('button');
    stopAllButton.textContent = '🛑 Stop All Clients';
    stopAllButton.onclick = stopAllClients;
    launcherActions.appendChild(stopAllButton);

    const refreshButton = document.createElement('button');
    refreshButton.textContent = '🔄 Refresh';
    refreshButton.onclick = refreshLauncherData;
    launcherActions.appendChild(refreshButton);

    launcherControls.appendChild(launcherActions);

    const activeSessions = document.createElement('div');
    activeSessions.className = 'active-sessions';

    const h3 = document.createElement('h3');
    h3.textContent = 'Active Sessions';
    activeSessions.appendChild(h3);

    const sessionsGrid = document.createElement('div');
    sessionsGrid.id = 'active-sessions-list';
    sessionsGrid.className = 'sessions-grid';
    activeSessions.appendChild(sessionsGrid);

    const sessionHistory = document.createElement('div');
    sessionHistory.className = 'session-history';

    const h3SessionHistory = document.createElement('h3');
    h3SessionHistory.textContent = 'Session History';
    sessionHistory.appendChild(h3SessionHistory);

    const historyList = document.createElement('div');
    historyList.id = 'session-history-list';
    historyList.className = 'history-list';
    sessionHistory.appendChild(historyList);

    clientLauncherSection.appendChild(launcherControls);
    clientLauncherSection.appendChild(activeSessions);
    clientLauncherSection.appendChild(sessionHistory);

    sectionsContainer.appendChild(clientLauncherSection);

    // Client Launcher Functions
    let activeSessionsData = new Map();
    let sessionHistoryData = [];

    async function refreshLauncherData() {
        try {
            // Load accounts for launcher
            const accountsResponse = await apiRequest('/api/v1/accounts');
            const accountSelect = document.getElementById('launcher-account-select');
            accountSelect.innerHTML = '<option value="">Choose an account...</option>';
            
            if (accountsResponse.data) {
                accountsResponse.data.forEach(account => {
                    const option = document.createElement('option');
                    option.value = account.id;
                    option.textContent = `${account.username} (${account.type})`;
                    accountSelect.appendChild(option);
                });
            }

            // Load bots for launcher
            const botsResponse = await apiRequest('/api/v1/bots');
            const botSelect = document.getElementById('launcher-bot-select');
            botSelect.innerHTML = '<option value="">Choose a bot...</option>';
            
            if (botsResponse.data) {
                botsResponse.data.forEach(bot => {
                    const option = document.createElement('option');
                    option.value = bot.id;
                    option.textContent = `${bot.name} (${bot.type})`;
                    botSelect.appendChild(option);
                });
            }

            // Load agents for launcher
            const agentsResponse = await apiRequest('/api/v1/agents');
            const agentSelect = document.getElementById('launcher-agent-select');
            agentSelect.innerHTML = '<option value="">Choose an agent...</option>';
            
            if (agentsResponse.data) {
                agentsResponse.data.forEach(agent => {
                    const option = document.createElement('option');
                    option.value = agent.id;
                    option.textContent = `${agent.name} (${agent.status})`;
                    agentSelect.appendChild(option);
                });
            }

            updateActiveSessionsDisplay();
            updateSessionHistoryDisplay();
            
        } catch (error) {
            console.error('Error refreshing launcher data:', error);
            showNotification('Error loading launcher data', 'error');
        }
    }

    async function launchClient() {
        const accountId = document.getElementById('launcher-account-select').value;
        const botId = document.getElementById('launcher-bot-select').value;
        const agentId = document.getElementById('launcher-agent-select').value;
        const timerMinutes = parseInt(document.getElementById('launcher-timer').value);
        const autoRestart = document.getElementById('launcher-auto-restart').checked;

        if (!accountId || !botId || !agentId || !timerMinutes) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }

        try {
            // Create a new task for P2P Master AI
            const taskData = {
                name: `P2P Master AI - ${Date.now()}`,
                type: 'p2p_master',
                status: 'pending',
                account_id: parseInt(accountId),
                bot_id: parseInt(botId),
                agent_id: parseInt(agentId),
                duration_minutes: timerMinutes,
                auto_restart: autoRestart
            };

            const taskResponse = await apiRequest('/api/v1/tasks', 'POST', taskData);
            
            if (taskResponse.data) {
                // Start the task
                const startResponse = await apiRequest(`/api/v1/tasks/${taskResponse.data.id}/start`, 'POST', {
                    agent_id: parseInt(agentId),
                    account_id: parseInt(accountId)
                });

                if (startResponse.data) {
                    // Create session tracking
                    const sessionId = `session_${Date.now()}`;
                    const session = {
                        id: sessionId,
                        taskId: taskResponse.data.id,
                        accountId: parseInt(accountId),
                        botId: parseInt(botId),
                        agentId: parseInt(agentId),
                        startTime: new Date(),
                        duration: timerMinutes,
                        autoRestart: autoRestart,
                        status: 'running',
                        timeRemaining: timerMinutes * 60 // in seconds
                    };

                    activeSessionsData.set(sessionId, session);
                    
                    // Start countdown timer
                    startSessionTimer(sessionId);
                    
                    updateActiveSessionsDisplay();
                    showNotification(`Client launched successfully! Session: ${sessionId}`, 'success');
                    
                    // Add to history
                    sessionHistoryData.unshift({
                        ...session,
                        action: 'started'
                    });
                    updateSessionHistoryDisplay();
                }
            }
        } catch (error) {
            console.error('Error launching client:', error);
            showNotification('Error launching client', 'error');
        }
    }

    function startSessionTimer(sessionId) {
        const session = activeSessionsData.get(sessionId);
        if (!session) return;

        const timer = setInterval(async () => {
            session.timeRemaining--;
            
            if (session.timeRemaining <= 0) {
                clearInterval(timer);
                await stopSession(sessionId);
                
                if (session.autoRestart) {
                    // Restart the session
                    setTimeout(() => {
                        restartSession(sessionId);
                    }, 5000); // 5 second delay before restart
                }
            }
            
            updateActiveSessionsDisplay();
        }, 1000);

        session.timer = timer;
    }

    async function stopSession(sessionId) {
        const session = activeSessionsData.get(sessionId);
        if (!session) return;

        try {
            // Stop the task
            await apiRequest(`/api/v1/tasks/${session.taskId}/stop`, 'POST', {
                agent_id: session.agentId,
                account_id: session.accountId
            });

            // Clear timer
            if (session.timer) {
                clearInterval(session.timer);
            }

            // Update session status
            session.status = 'stopped';
            session.endTime = new Date();
            
            // Move to history
            sessionHistoryData.unshift({
                ...session,
                action: 'stopped'
            });

            // Remove from active sessions
            activeSessionsData.delete(sessionId);
            
            updateActiveSessionsDisplay();
            updateSessionHistoryDisplay();
            
            showNotification(`Session ${sessionId} stopped`, 'info');
            
        } catch (error) {
            console.error('Error stopping session:', error);
            showNotification('Error stopping session', 'error');
        }
    }

    async function restartSession(sessionId) {
        const session = activeSessionsData.get(sessionId);
        if (!session) return;

        // Reset timer
        session.timeRemaining = session.duration * 60;
        session.startTime = new Date();
        session.status = 'running';
        
        // Start new timer
        startSessionTimer(sessionId);
        
        // Add restart to history
        sessionHistoryData.unshift({
            ...session,
            action: 'restarted'
        });
        
        updateActiveSessionsDisplay();
        updateSessionHistoryDisplay();
        
        showNotification(`Session ${sessionId} restarted`, 'success');
    }

    async function stopAllClients() {
        const sessionIds = Array.from(activeSessionsData.keys());
        
        for (const sessionId of sessionIds) {
            await stopSession(sessionId);
        }
        
        showNotification('All clients stopped', 'info');
    }

    function updateActiveSessionsDisplay() {
        const container = document.getElementById('active-sessions-list');
        container.innerHTML = '';

        if (activeSessionsData.size === 0) {
            container.innerHTML = '<p class="no-data">No active sessions</p>';
            return;
        }

        activeSessionsData.forEach((session, sessionId) => {
            const sessionCard = document.createElement('div');
            sessionCard.className = 'session-card';
            
            const timeRemaining = formatTime(session.timeRemaining);
            const elapsed = Math.floor((Date.now() - session.startTime.getTime()) / 1000);
            const elapsedFormatted = formatTime(elapsed);
            
            sessionCard.innerHTML = `
                <div class="session-header">
                    <h4>${sessionId}</h4>
                    <span class="status-badge status-${session.status}">${session.status}</span>
                </div>
                <div class="session-details">
                    <p><strong>Account:</strong> ${session.accountId}</p>
                    <p><strong>Bot:</strong> ${session.botId}</p>
                    <p><strong>Agent:</strong> ${session.agentId}</p>
                    <p><strong>Time Remaining:</strong> ${timeRemaining}</p>
                    <p><strong>Elapsed:</strong> ${elapsedFormatted}</p>
                    <p><strong>Auto-restart:</strong> ${session.autoRestart ? 'Yes' : 'No'}</p>
                </div>
                <div class="session-actions">
                    <button onclick="stopSession('${sessionId}')" class="btn btn-sm btn-danger">Stop</button>
                    <button onclick="extendSession('${sessionId}', 30)" class="btn btn-sm btn-secondary">+30min</button>
                </div>
            `;
            
            container.appendChild(sessionCard);
        });
    }

    function updateSessionHistoryDisplay() {
        const container = document.getElementById('session-history-list');
        container.innerHTML = '';

        if (sessionHistoryData.length === 0) {
            container.innerHTML = '<p class="no-data">No session history</p>';
            return;
        }

        // Show last 10 entries
        const recentHistory = sessionHistoryData.slice(0, 10);
        
        recentHistory.forEach(entry => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            const actionTime = entry.endTime || entry.startTime;
            
            historyItem.innerHTML = `
                <div class="history-content">
                    <span class="history-action">${entry.action}</span>
                    <span class="history-session">${entry.id}</span>
                    <span class="history-time">${actionTime.toLocaleString()}</span>
                    <span class="history-duration">Duration: ${entry.duration}min</span>
                </div>
            `;
            
            container.appendChild(historyItem);
        });
    }

    function extendSession(sessionId, minutes) {
        const session = activeSessionsData.get(sessionId);
        if (!session) return;

        session.timeRemaining += minutes * 60;
        session.duration += minutes;
        
        updateActiveSessionsDisplay();
        showNotification(`Session ${sessionId} extended by ${minutes} minutes`, 'success');
    }

    function formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }

    // =============================================================================
    // LIVE CONFIGURATION MANAGEMENT
    // =============================================================================

    // Configuration Management
    const ConfigManager = {
        // Current configuration state
        currentConfig: {
            eternalfarm: {
                apiKey: '',
                apiUrl: 'https://api.eternalfarm.net'
            },
            dreambot: {
                username: '',
                password: '',
                script: '',
                world: 301
            },
            discord: {
                webhookUrl: ''
            }
        },

        // Initialize configuration panel
        init() {
            this.attachEventListeners();
            this.loadCurrentConfig();
        },

        // Attach event listeners
        attachEventListeners() {
            // Toggle configuration panel
            const toggleBtn = document.getElementById('toggleConfig');
            const configSection = document.getElementById('configSection');
            
            if (toggleBtn && configSection) {
                toggleBtn.addEventListener('click', () => {
                    const isVisible = configSection.style.display !== 'none';
                    configSection.style.display = isVisible ? 'none' : 'block';
                    toggleBtn.textContent = isVisible ? '⚙️ Live Configuration' : '⚙️ Hide Configuration';
                });
            }

            // Test buttons
            const testApiBtn = document.getElementById('testApiKey');
            const testDiscordBtn = document.getElementById('testDiscord');
            
            if (testApiBtn) {
                testApiBtn.addEventListener('click', () => this.testEternalFarmConnection());
            }
            
            if (testDiscordBtn) {
                testDiscordBtn.addEventListener('click', () => this.testDiscordWebhook());
            }

            // Action buttons
            const saveBtn = document.getElementById('saveConfig');
            const loadBtn = document.getElementById('loadConfig');
            const applyBtn = document.getElementById('applyConfig');
            
            if (saveBtn) {
                saveBtn.addEventListener('click', () => this.saveConfiguration());
            }
            
            if (loadBtn) {
                loadBtn.addEventListener('click', () => this.loadCurrentConfig());
            }
            
            if (applyBtn) {
                applyBtn.addEventListener('click', () => this.applyConfiguration());
            }
        },

        // Load current configuration from server
        async loadCurrentConfig() {
            try {
                this.updateStatus('loadConfig', 'loading', '📥 Loading current configuration...');
                
                const response = await apiRequest('/api/config', 'GET');
                
                if (response.success) {
                    this.currentConfig = response.config;
                    this.populateConfigForm();
                    this.updateStatus('loadConfig', 'success', '✅ Configuration loaded successfully');
                    this.updateConnectionStatuses();
                } else {
                    throw new Error(response.error || 'Failed to load configuration');
                }
            } catch (error) {
                console.error('❌ Failed to load configuration:', error);
                this.updateStatus('loadConfig', 'error', `❌ Failed to load: ${error.message}`);
                showNotification('Failed to load configuration', 'error');
            }
        },

        // Populate form with current configuration
        populateConfigForm() {
            // EternalFarm settings
            const eternalfarmApiKey = document.getElementById('eternalfarmApiKey');
            const eternalfarmApiUrl = document.getElementById('eternalfarmApiUrl');
            
            if (eternalfarmApiKey) eternalfarmApiKey.value = this.currentConfig.eternalfarm.apiKey || '';
            if (eternalfarmApiUrl) eternalfarmApiUrl.value = this.currentConfig.eternalfarm.apiUrl || 'https://api.eternalfarm.com';

            // DreamBot settings
            const dreambotUsername = document.getElementById('dreambotUsername');
            const dreambotPassword = document.getElementById('dreambotPassword');
            const dreambotScript = document.getElementById('dreambotScript');
            const dreambotWorld = document.getElementById('dreambotWorld');
            
            if (dreambotUsername) dreambotUsername.value = this.currentConfig.dreambot.username || '';
            if (dreambotPassword) dreambotPassword.value = this.currentConfig.dreambot.password || '';
            if (dreambotScript) dreambotScript.value = this.currentConfig.dreambot.script || '';
            if (dreambotWorld) dreambotWorld.value = this.currentConfig.dreambot.world || 301;

            // Discord settings
            const discordWebhook = document.getElementById('discordWebhook');
            if (discordWebhook) discordWebhook.value = this.currentConfig.discord.webhookUrl || '';
        },

        // Collect configuration from form
        collectConfigFromForm() {
            const config = {
                eternalfarm: {
                    apiKey: document.getElementById('eternalfarmApiKey')?.value || '',
                    apiUrl: document.getElementById('eternalfarmApiUrl')?.value || 'https://api.eternalfarm.com'
                },
                dreambot: {
                    username: document.getElementById('dreambotUsername')?.value || '',
                    password: document.getElementById('dreambotPassword')?.value || '',
                    script: document.getElementById('dreambotScript')?.value || '',
                    world: parseInt(document.getElementById('dreambotWorld')?.value) || 301
                },
                discord: {
                    webhookUrl: document.getElementById('discordWebhook')?.value || ''
                }
            };
            return config;
        },

        // Save configuration to server
        async saveConfiguration() {
            try {
                this.updateStatus('saveConfig', 'loading', '💾 Saving configuration...');
                
                const config = this.collectConfigFromForm();
                
                const response = await apiRequest('/api/config', 'POST', config);
                
                if (response.success) {
                    this.currentConfig = config;
                    this.updateStatus('saveConfig', 'success', '✅ Configuration saved successfully');
                    this.updateConnectionStatuses();
                    showNotification('Configuration saved successfully', 'success');
                } else {
                    throw new Error(response.error || 'Failed to save configuration');
                }
            } catch (error) {
                console.error('❌ Failed to save configuration:', error);
                this.updateStatus('saveConfig', 'error', `❌ Save failed: ${error.message}`);
                showNotification('Failed to save configuration', 'error');
            }
        },

        // Apply configuration and restart services
        async applyConfiguration() {
            try {
                this.updateStatus('applyConfig', 'loading', '🚀 Applying configuration and restarting services...');
                
                const config = this.collectConfigFromForm();
                
                const response = await apiRequest('/api/config/apply', 'POST', config);
                
                if (response.success) {
                    this.currentConfig = config;
                    this.updateStatus('applyConfig', 'success', '✅ Configuration applied and services restarted');
                    this.updateConnectionStatuses();
                    showNotification('Configuration applied successfully - services restarting', 'success');
                    
                    // Refresh the page after a delay to reconnect to updated services
                    setTimeout(() => {
                        showNotification('Refreshing page to connect to updated services...', 'info');
                        setTimeout(() => window.location.reload(), 2000);
                    }, 3000);
                } else {
                    throw new Error(response.error || 'Failed to apply configuration');
                }
            } catch (error) {
                console.error('❌ Failed to apply configuration:', error);
                this.updateStatus('applyConfig', 'error', `❌ Apply failed: ${error.message}`);
                showNotification('Failed to apply configuration', 'error');
            }
        },

        // Test EternalFarm API connection
        async testEternalFarmConnection() {
            try {
                this.updateConfigStatus('eternalfarmStatus', 'testing', '🧪 Testing API connection...');
                
                const apiKey = document.getElementById('eternalfarmApiKey')?.value;
                const apiUrl = document.getElementById('eternalfarmApiUrl')?.value;
                
                if (!apiKey) {
                    throw new Error('API key is required');
                }
                
                const response = await apiRequest('/api/config/test/eternalfarm', 'POST', {
                    apiKey,
                    apiUrl
                });
                
                if (response.success) {
                    this.updateConfigStatus('eternalfarmStatus', 'connected', '✅ API connection successful');
                    showNotification('EternalFarm API connection successful', 'success');
                } else {
                    throw new Error(response.error || 'API test failed');
                }
            } catch (error) {
                console.error('❌ EternalFarm API test failed:', error);
                this.updateConfigStatus('eternalfarmStatus', 'error', `❌ Connection failed: ${error.message}`);
                showNotification('EternalFarm API test failed', 'error');
            }
        },

        // Test Discord webhook
        async testDiscordWebhook() {
            try {
                this.updateConfigStatus('discordStatus', 'testing', '🧪 Testing Discord webhook...');
                
                const webhookUrl = document.getElementById('discordWebhook')?.value;
                
                if (!webhookUrl) {
                    throw new Error('Discord webhook URL is required');
                }
                
                const response = await apiRequest('/api/config/test/discord', 'POST', {
                    webhookUrl
                });
                
                if (response.success) {
                    this.updateConfigStatus('discordStatus', 'connected', '✅ Discord webhook working');
                    showNotification('Discord webhook test successful', 'success');
                } else {
                    throw new Error(response.error || 'Discord test failed');
                }
            } catch (error) {
                console.error('❌ Discord webhook test failed:', error);
                this.updateConfigStatus('discordStatus', 'error', `❌ Webhook failed: ${error.message}`);
                showNotification('Discord webhook test failed', 'error');
            }
        },

        // Update configuration status indicators
        updateConfigStatus(elementId, status, message) {
            const element = document.getElementById(elementId);
            if (!element) return;
            
            element.textContent = message;
            element.className = `config-status ${status}`;
        },

        // Update connection status for all services
        updateConnectionStatuses() {
            // EternalFarm status
            const eternalfarmStatus = this.currentConfig.eternalfarm.apiKey ? 
                '🟢 Configured' : '⚫ Not configured';
            this.updateConfigStatus('eternalfarmStatus', 
                this.currentConfig.eternalfarm.apiKey ? 'connected' : '', 
                eternalfarmStatus);

            // DreamBot status
            const dreambotStatus = this.currentConfig.dreambot.username && this.currentConfig.dreambot.password ? 
                '🟢 Configured' : '⚫ Not configured';
            this.updateConfigStatus('dreambotStatus', 
                this.currentConfig.dreambot.username && this.currentConfig.dreambot.password ? 'connected' : '', 
                dreambotStatus);

            // Discord status
            const discordStatus = this.currentConfig.discord.webhookUrl ? 
                '🟢 Configured' : '⚫ Not configured';
            this.updateConfigStatus('discordStatus', 
                this.currentConfig.discord.webhookUrl ? 'connected' : '', 
                discordStatus);
        },

        // Update button status during operations
        updateStatus(buttonId, status, message) {
            const button = document.getElementById(buttonId);
            if (!button) return;
            
            const originalText = button.textContent;
            
            switch (status) {
                case 'loading':
                    button.disabled = true;
                    button.textContent = message;
                    break;
                case 'success':
                    button.disabled = false;
                    button.textContent = message;
                    setTimeout(() => {
                        button.textContent = originalText;
                    }, 3000);
                    break;
                case 'error':
                    button.disabled = false;
                    button.textContent = message;
                    setTimeout(() => {
                        button.textContent = originalText;
                    }, 5000);
                    break;
                default:
                    button.disabled = false;
                    button.textContent = originalText;
            }
        }
    };

    // =============================================================================
    // END CONFIGURATION MANAGEMENT
    // =============================================================================

    // Initialize configuration manager
    ConfigManager.init();

    // Initialize WebSocket connection
    connectWebSocket();

    // Perform initial health check
    performHealthCheck();

    // Set up periodic health checks
    setInterval(performHealthCheck, 30000); // Every 30 seconds

    // Initialize date/time display
    function updateDateTime() {
        const now = new Date();
        const dateTimeElement = document.getElementById('currentDateTime');
        if (dateTimeElement) {
            dateTimeElement.textContent = now.toLocaleString();
        }
    }
    updateDateTime();
    setInterval(updateDateTime, 1000);

    // Rehydrate scheduled tasks from localStorage
    rehydrateScheduledTasks();
});
