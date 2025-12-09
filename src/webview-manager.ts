import * as vscode from 'vscode';
import { StorageManager } from './storage-manager';
import { OAuthClient } from './oauth-client';
import { OAuthCredentials } from './types';

export class WebviewManager {
  private context: vscode.ExtensionContext;
  private storageManager: StorageManager;
  private panel?: vscode.WebviewPanel;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.storageManager = new StorageManager(context);
  }

  async showConfigurationPanel(): Promise<void> {
    if (this.panel) {
      this.panel.reveal();
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      'oauthConfig',
      'OAuth Configuration',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        enableCommandUris: true,
        enableForms: true
      }
    );

    this.panel.webview.html = await this.getWebviewContent();

    this.panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.type) {
          case 'saveCredentials':
            await this.handleSaveCredentials(message.data);
            break;
          case 'testCredentials':
            await this.handleTestCredentials(message.data);
            break;
          case 'loadEnvironments':
            await this.handleLoadEnvironments();
            break;
          case 'loadEnvironment':
            await this.handleLoadEnvironment(message.data.name);
            break;
          case 'deleteEnvironment':
            await this.handleDeleteEnvironment(message.data.name);
            break;
          case 'getToken':
            await this.handleGetToken(message.data.name);
            break;
        }
      }
    );

    this.panel.onDidDispose(() => {
      this.panel = undefined;
    });
  }

  private async getWebviewContent(): Promise<string> {
    const environments = await this.storageManager.getEnvironments();
    const currentEnv = await this.storageManager.getCurrentEnvironment();

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OAuth Token Generator Configuration</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            line-height: 1.6;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
            color: var(--vscode-foreground);
        }
        input, select {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 4px;
            box-sizing: border-box;
        }
        input:focus, select:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
        }
        .button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-right: 8px;
            margin-bottom: 8px;
        }
        .button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .button.secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        .button.secondary:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
        .button.icon {
            padding: 6px 10px;
            font-size: 16px;
            min-width: 32px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }
        .button.icon:hover {
            transform: scale(1.1);
        }
        .environment-list {
            margin-top: 30px;
        }
        .environment-item {
            padding: 12px;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            margin-bottom: 8px;
            background-color: var(--vscode-panel-background);
        }
        .environment-item.current {
            border-color: var(--vscode-focusBorder);
            background-color: var(--vscode-list-activeSelectionBackground);
        }
        .environment-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .environment-name {
            font-weight: 600;
            color: var(--vscode-foreground);
        }
        .environment-domain {
            font-size: 0.9em;
            color: var(--vscode-descriptionForeground);
            margin-top: 4px;
        }
        .status {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            margin-left: 10px;
        }
        .status.success {
            background-color: var(--vscode-testing-iconPassed);
            color: white;
        }
        .status.error {
            background-color: var(--vscode-testing-iconFailed);
            color: white;
        }
        .status.testing {
            background-color: var(--vscode-testing-iconQueued);
            color: white;
        }
        .help-text {
            font-size: 0.9em;
            color: var(--vscode-descriptionForeground);
            margin-top: 4px;
        }
        .section-title {
            font-size: 1.2em;
            font-weight: 600;
            margin-bottom: 16px;
            margin-top: 32px;
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 8px;
        }
        .header-row {
            display: flex;
            gap: 8px;
            margin-bottom: 8px;
            align-items: flex-start;
        }
        .header-row input {
            flex: 1;
        }
        .header-row .header-key {
            min-width: 200px;
        }
        .header-row .header-value {
            flex: 2;
        }
        .header-row .button {
            margin: 0;
            padding: 8px 12px;
            flex-shrink: 0;
        }
        .modal-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            overflow-y: auto;
        }
        .modal-overlay.active {
            display: flex;
            align-items: flex-start;
            justify-content: center;
            padding: 20px;
        }
        .confirm-dialog {
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 20px;
            max-width: 400px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }
        .confirm-dialog .confirm-message {
            margin-bottom: 20px;
            line-height: 1.5;
        }
        .confirm-dialog .confirm-buttons {
            display: flex;
            gap: 8px;
            justify-content: flex-end;
        }
        .modal-content {
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 24px;
            max-width: 600px;
            width: 100%;
            margin-top: 20px;
            max-height: calc(100vh - 40px);
            overflow-y: auto;
        }
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        .modal-title {
            font-size: 1.3em;
            font-weight: 600;
        }
        .close-modal {
            background: none;
            border: none;
            color: var(--vscode-foreground);
            font-size: 24px;
            cursor: pointer;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .close-modal:hover {
            background-color: var(--vscode-toolbar-hoverBackground);
            border-radius: 4px;
        }
        .environments-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
        }
    </style>
</head>
<body>
    <!-- Modal for Add/Edit Environment -->
    <div class="modal-overlay" id="modalOverlay">
        <div class="modal-content">
            <div class="modal-header">
                <div class="modal-title" id="modalTitle">Add Environment</div>
                <button class="close-modal" id="closeModal">&times;</button>
            </div>

            <form id="credentialsForm">
            <div class="form-group">
                <label for="environmentName">Environment Name:</label>
                <input type="text" id="environmentName" placeholder="e.g., dev, staging, prod" required>
                <div class="help-text">A friendly name to identify this environment</div>
            </div>

            <div class="form-group">
                <label for="provider">OAuth Provider:</label>
                <select id="provider" required>
                    <option value="">-- Select Provider --</option>
                    <option value="Auth0">Auth0</option>
                    <option value="Okta">Okta</option>
                    <option value="Azure AD">Azure AD</option>
                    <option value="Custom">Custom</option>
                </select>
                <div class="help-text">Select your OAuth provider</div>
            </div>

            <div class="form-group">
                <label for="tokenEndpoint">Token Endpoint URL:</label>
                <input type="text" id="tokenEndpoint" placeholder="https://your-domain.com/oauth/token" required>
                <div class="help-text">Full URL to the OAuth token endpoint</div>
            </div>
            
            <div class="form-group">
                <label for="clientId">Client ID:</label>
                <input type="text" id="clientId" placeholder="Your Auth0 application client ID" required>
            </div>
            
            <div class="form-group">
                <label for="clientSecret">Client Secret:</label>
                <input type="password" id="clientSecret" placeholder="Your Auth0 application client secret" required>
            </div>
            
            <div class="form-group">
                <label for="audience">Audience (optional):</label>
                <input type="text" id="audience" placeholder="e.g., https://api.example.com">
                <div class="help-text">The API identifier (if required by your provider)</div>
            </div>
            
            <div class="form-group">
                <label for="scope">Scope (optional):</label>
                <input type="text" id="scope" placeholder="e.g., read:users write:users">
                <div class="help-text">Space-separated list of scopes</div>
            </div>

            <div class="form-group">
                <label for="authMethod">Authentication Method:</label>
                <select id="authMethod" required>
                    <option value="body">Credentials in Request Body (Default)</option>
                    <option value="basic">Basic Authentication Header</option>
                </select>
                <div class="help-text">How to send client credentials to the OAuth provider</div>
            </div>

            <div class="form-group">
                <label for="contentType">Content Type:</label>
                <select id="contentType" required>
                    <option value="application/json">JSON (application/json)</option>
                    <option value="application/x-www-form-urlencoded">Form Encoded</option>
                </select>
                <div class="help-text">Request payload format</div>
            </div>

            <div class="section-title" style="margin-top: 24px;">Custom Headers (Optional)</div>
            <div id="customHeadersContainer"></div>
            <button type="button" class="button secondary" id="addHeaderBtn">+ Add Header</button>

            <div style="margin-top: 24px;">
                <button type="submit" class="button">Save Credentials</button>
                <button type="button" class="button secondary" id="testBtn">Test Connection</button>
            </div>
        </form>
        </div>
    </div>

    <!-- Confirmation Dialog -->
    <div class="modal-overlay" id="confirmDialog">
        <div class="confirm-dialog">
            <div class="confirm-message" id="confirmMessage"></div>
            <div class="confirm-buttons">
                <button class="button secondary" id="confirmCancel">Cancel</button>
                <button class="button" id="confirmOk">Delete</button>
            </div>
        </div>
    </div>

    <!-- Main Container -->
    <div class="container">
        <h1>OAuth Token Generator Configuration</h1>

        <div class="environments-header">
            <div class="section-title" style="margin: 0;">Configured Environments</div>
            <button type="button" class="button" id="addNewBtn">+ Add New Environment</button>
        </div>
        <div id="environmentsList" class="environment-list">
            <!-- Environments will be loaded here -->
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let headerCounter = 0;
        let confirmCallback = null;

        // Confirmation dialog management
        const confirmDialog = document.getElementById('confirmDialog');
        const confirmMessage = document.getElementById('confirmMessage');
        const confirmOk = document.getElementById('confirmOk');
        const confirmCancel = document.getElementById('confirmCancel');

        function showConfirm(message, callback) {
            confirmMessage.textContent = message;
            confirmCallback = callback;
            confirmDialog.classList.add('active');
        }

        function hideConfirm(confirmed) {
            confirmDialog.classList.remove('active');
            if (confirmCallback) {
                confirmCallback(confirmed);
                confirmCallback = null;
            }
        }

        confirmOk.addEventListener('click', () => hideConfirm(true));
        confirmCancel.addEventListener('click', () => hideConfirm(false));
        confirmDialog.addEventListener('click', (e) => {
            if (e.target === confirmDialog) {
                hideConfirm(false);
            }
        });

        // Modal management
        const modalOverlay = document.getElementById('modalOverlay');
        const closeModal = document.getElementById('closeModal');
        const addNewBtn = document.getElementById('addNewBtn');
        const modalTitle = document.getElementById('modalTitle');

        function openModal(title = 'Add Environment') {
            modalTitle.textContent = title;
            modalOverlay.classList.add('active');
        }

        function closeModalFn() {
            modalOverlay.classList.remove('active');
        }

        addNewBtn.addEventListener('click', () => {
            // Clear the form for new environment
            document.getElementById('credentialsForm').reset();
            document.getElementById('customHeadersContainer').innerHTML = '';
            headerCounter = 0;
            openModal('Add New Environment');
        });

        closeModal.addEventListener('click', closeModalFn);

        // Close modal when clicking outside
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModalFn();
            }
        });

        // Dynamic header management
        document.getElementById('addHeaderBtn').addEventListener('click', () => {
            addHeaderRow();
        });

        function addHeaderRow(key = '', value = '') {
            const headerId = \`header-\${headerCounter++}\`;
            const container = document.getElementById('customHeadersContainer');

            const headerRow = document.createElement('div');
            headerRow.className = 'header-row';
            headerRow.id = headerId;
            headerRow.innerHTML = \`
                <input type="text"
                       class="header-key"
                       placeholder="Header name (e.g., X-Custom-Header)"
                       value="\${key}">
                <input type="text"
                       class="header-value"
                       placeholder="Header value (use \\\${ENV_VAR} for placeholders)"
                       value="\${value}">
                <button type="button" class="button secondary" onclick="removeHeader('\${headerId}')">
                    Remove
                </button>
            \`;

            container.appendChild(headerRow);
        }

        window.removeHeader = function(headerId) {
            const element = document.getElementById(headerId);
            if (element) {
                element.remove();
            }
        };

        function getCustomHeaders() {
            const headerRows = document.querySelectorAll('.header-row');
            const headers = [];

            headerRows.forEach(row => {
                const key = row.querySelector('.header-key').value.trim();
                const value = row.querySelector('.header-value').value.trim();

                if (key && value) {
                    headers.push({ key, value });
                }
            });

            return headers;
        }

        // Set up event delegation for environment action buttons
        document.addEventListener('click', (e) => {
            const target = e.target;
            if (target && target.dataset && target.dataset.action) {
                const action = target.dataset.action;
                const envName = target.dataset.envName;

                console.log('Button clicked:', action, 'for environment:', envName);

                if (action === 'delete') {
                    console.log('Delete action triggered');
                    showConfirm(\`Are you sure you want to delete the environment "\${envName}"?\`, (confirmed) => {
                        if (confirmed) {
                            console.log('Delete confirmed, sending message...');
                            vscode.postMessage({
                                type: 'deleteEnvironment',
                                data: { name: envName }
                            });
                        }
                    });
                } else if (action === 'edit') {
                    openModal('Edit Environment');
                    vscode.postMessage({
                        type: 'loadEnvironment',
                        data: { name: envName }
                    });
                } else if (action === 'getToken') {
                    vscode.postMessage({
                        type: 'getToken',
                        data: { name: envName }
                    });
                }
            }
        });

        document.getElementById('credentialsForm').addEventListener('submit', (e) => {
            e.preventDefault();

            const credentials = {
                environmentName: document.getElementById('environmentName').value,
                provider: document.getElementById('provider').value,
                tokenEndpoint: document.getElementById('tokenEndpoint').value,
                clientId: document.getElementById('clientId').value,
                clientSecret: document.getElementById('clientSecret').value,
                audience: document.getElementById('audience').value,
                scope: document.getElementById('scope').value,
                authMethod: document.getElementById('authMethod').value,
                contentType: document.getElementById('contentType').value,
                customHeaders: getCustomHeaders()
            };

            vscode.postMessage({
                type: 'saveCredentials',
                data: credentials
            });
        });

        document.getElementById('testBtn').addEventListener('click', () => {
            const credentials = {
                provider: document.getElementById('provider').value,
                tokenEndpoint: document.getElementById('tokenEndpoint').value,
                clientId: document.getElementById('clientId').value,
                clientSecret: document.getElementById('clientSecret').value,
                audience: document.getElementById('audience').value,
                scope: document.getElementById('scope').value,
                authMethod: document.getElementById('authMethod').value,
                contentType: document.getElementById('contentType').value,
                customHeaders: getCustomHeaders()
            };

            vscode.postMessage({
                type: 'testCredentials',
                data: credentials
            });
        });
        
        function loadEnvironments() {
            vscode.postMessage({ type: 'loadEnvironments' });
        }

        // Load environments on page load
        loadEnvironments();

        // Listen for messages from the extension
        window.addEventListener('message', event => {
            const message = event.data;
            console.log('Received message from extension:', message.type);

            switch (message.type) {
                case 'environmentsLoaded':
                    console.log('Loading environments:', message.data.environments);
                    displayEnvironments(message.data.environments, message.data.currentEnv);
                    break;
                case 'credentialsSaved':
                    // Keep the form as-is (don't reset) and close the modal
                    closeModalFn();
                    loadEnvironments();
                    break;
                case 'environmentDeleted':
                    console.log('Environment deleted, reloading list...');
                    loadEnvironments();
                    break;
                case 'environmentLoaded':
                    const env = message.data;

                    // Populate form fields
                    document.getElementById('environmentName').value = env.name;
                    document.getElementById('provider').value = env.credentials.provider;
                    document.getElementById('tokenEndpoint').value = env.credentials.tokenEndpoint;
                    document.getElementById('clientId').value = env.credentials.clientId;
                    document.getElementById('clientSecret').value = env.credentials.clientSecret;
                    document.getElementById('audience').value = env.credentials.audience || '';
                    document.getElementById('scope').value = env.credentials.scope || '';
                    document.getElementById('authMethod').value = env.credentials.authMethod || 'body';
                    document.getElementById('contentType').value = env.credentials.contentType || 'application/json';

                    // Clear and populate custom headers
                    document.getElementById('customHeadersContainer').innerHTML = '';
                    headerCounter = 0;
                    const headers = env.credentials.customHeaders || [];
                    headers.forEach(header => {
                        addHeaderRow(header.key, header.value);
                    });
                    break;
            }
        });
        
        function displayEnvironments(environments, currentEnv) {
            const container = document.getElementById('environmentsList');

            if (environments.length === 0) {
                container.innerHTML = '<p style="color: var(--vscode-descriptionForeground);">No environments configured yet.</p>';
                return;
            }

            container.innerHTML = environments.map(env => {
                const isCurrent = env.name === currentEnv;
                return \`
                    <div class="environment-item \${isCurrent ? 'current' : ''}">
                        <div class="environment-header">
                            <div>
                                <div class="environment-name">\${env.name} \${isCurrent ? '(current)' : ''}</div>
                                <div class="environment-domain">\${env.credentials.provider} - \${env.credentials.tokenEndpoint}</div>
                            </div>
                            <div style="display: flex; gap: 6px;">
                                <button class="button secondary icon" data-action="getToken" data-env-name="\${env.name}" title="Get Token">↻</button>
                                <button class="button secondary icon" data-action="edit" data-env-name="\${env.name}" title="Edit">✎</button>
                                <button class="button secondary icon" data-action="delete" data-env-name="\${env.name}" title="Delete">×</button>
                            </div>
                        </div>
                    </div>
                \`;
            }).join('');
        }
    </script>
</body>
</html>
    `;
  }

  private async handleSaveCredentials(data: any): Promise<void> {
    try {
      const credentials: OAuthCredentials = {
        provider: data.provider,
        tokenEndpoint: data.tokenEndpoint,
        clientId: data.clientId,
        clientSecret: data.clientSecret,
        audience: data.audience || undefined,
        scope: data.scope || undefined,
        authMethod: data.authMethod || 'body',
        contentType: data.contentType || 'application/json',
        customHeaders: data.customHeaders || []
      };

      await this.storageManager.saveEnvironment({
        name: data.environmentName,
        credentials
      });

      // Set as current environment if it's the first one
      const environments = await this.storageManager.getEnvironments();
      const currentEnv = await this.storageManager.getCurrentEnvironment();

      if (!currentEnv && environments.length === 1) {
        await this.storageManager.setCurrentEnvironment(data.environmentName);
      }

      this.panel?.webview.postMessage({
        type: 'credentialsSaved'
      });

      vscode.window.showInformationMessage(`✓ Credentials saved for environment: ${data.environmentName}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      vscode.window.showErrorMessage(`Failed to save credentials: ${errorMessage}`);
    }
  }

  private async handleTestCredentials(data: any): Promise<void> {
    try {
      const credentials: OAuthCredentials = {
        provider: data.provider,
        tokenEndpoint: data.tokenEndpoint,
        clientId: data.clientId,
        clientSecret: data.clientSecret,
        audience: data.audience || undefined,
        scope: data.scope || undefined,
        authMethod: data.authMethod || 'body',
        contentType: data.contentType || 'application/json',
        customHeaders: data.customHeaders || []
      };

      const oauthClient = new OAuthClient(credentials);
      const isValid = await oauthClient.validateCredentials();

      if (isValid) {
        vscode.window.showInformationMessage('✓ Credentials are valid!');
      } else {
        vscode.window.showErrorMessage('✗ Invalid credentials. Please check your configuration.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      vscode.window.showErrorMessage(`Credential test failed: ${errorMessage}`);
    }
  }

  private async handleLoadEnvironments(): Promise<void> {
    const environments = await this.storageManager.getEnvironments();
    const currentEnv = await this.storageManager.getCurrentEnvironment();

    this.panel?.webview.postMessage({
      type: 'environmentsLoaded',
      data: {
        environments,
        currentEnv
      }
    });
  }

  private async handleLoadEnvironment(envName: string): Promise<void> {
    try {
      const environments = await this.storageManager.getEnvironments();
      const environment = environments.find(env => env.name === envName);

      if (environment) {
        this.panel?.webview.postMessage({
          type: 'environmentLoaded',
          data: environment
        });
      } else {
        vscode.window.showErrorMessage(`Environment '${envName}' not found`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      vscode.window.showErrorMessage(`Failed to load environment: ${errorMessage}`);
    }
  }

  private async handleDeleteEnvironment(name: string): Promise<void> {
    try {
      console.log('Deleting environment:', name);
      await this.storageManager.deleteEnvironment(name);
      console.log('Environment deleted successfully');
      vscode.window.showInformationMessage(`✓ Environment '${name}' deleted successfully`);

      // Send confirmation back to webview
      this.panel?.webview.postMessage({
        type: 'environmentDeleted'
      });

      // Also reload the environments list
      await this.handleLoadEnvironments();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Delete environment failed:', error);
      vscode.window.showErrorMessage(`Failed to delete environment: ${errorMessage}`);
    }
  }

  private async handleGetToken(envName: string): Promise<void> {
    try {
      const environments = await this.storageManager.getEnvironments();
      const environment = environments.find(env => env.name === envName);

      if (!environment) {
        vscode.window.showErrorMessage(`Environment '${envName}' not found`);
        return;
      }

      // Check for cached valid token first
      await this.storageManager.removeExpiredTokens();
      const storedTokens = await this.storageManager.getStoredTokens();
      const audience = environment.credentials.audience || '';
      const scope = environment.credentials.scope || '';
      const tokenKey = `${environment.name}-${audience}-${scope}`;

      const cachedToken = storedTokens[tokenKey];
      if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) { // 1 minute buffer
        await vscode.env.clipboard.writeText(cachedToken.token);
        const expiresIn = Math.round((cachedToken.expiresAt - Date.now()) / 1000);
        vscode.window.showInformationMessage(
          `✓ Cached token for '${envName}' copied to clipboard! (expires in ${expiresIn}s)`
        );
        return;
      }

      // Generate new token
      const oauthClient = new OAuthClient(environment.credentials);

      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Generating token for '${envName}'...`,
        cancellable: false
      }, async (progress) => {
        progress.report({ increment: 50, message: "Requesting token from provider..." });

        const tokenResponse = await oauthClient.generateToken();

        progress.report({ increment: 50, message: "Processing response..." });

        // Store the token
        const storedToken = {
          token: tokenResponse.access_token,
          expiresAt: Date.now() + (tokenResponse.expires_in * 1000),
          environment: environment.name,
          audience: audience,
          scope: scope
        };

        await this.storageManager.storeToken(storedToken);
        await vscode.env.clipboard.writeText(tokenResponse.access_token);

        const expiresInMinutes = Math.round(tokenResponse.expires_in / 60);
        vscode.window.showInformationMessage(
          `✓ Token for '${envName}' generated and copied to clipboard! (expires in ${expiresInMinutes}m)`
        );
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      vscode.window.showErrorMessage(`Failed to generate token for '${envName}': ${errorMessage}`);
    }
  }
}