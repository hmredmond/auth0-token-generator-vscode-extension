import * as vscode from 'vscode';
import { StorageManager } from './storage-manager';
import { OAuthClient } from './oauth-client';
import { OAuthCredentials } from './types';

export class WebviewManager {
  private context: vscode.ExtensionContext;
  private storageManager: StorageManager;
  private panel?: vscode.WebviewPanel;
  private shouldLoadEnvironment?: string;
  private onTreeViewRefreshCallback?: () => void;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.storageManager = new StorageManager(context);
  }

  setTreeViewRefreshCallback(callback: () => void): void {
    this.onTreeViewRefreshCallback = callback;
  }

  async showConfigurationPanel(environmentName?: string): Promise<void> {
    this.shouldLoadEnvironment = environmentName;

    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.One);
      // If an environment name is provided, load it in the existing panel
      if (this.shouldLoadEnvironment) {
        await this.handleLoadEnvironment(this.shouldLoadEnvironment);
        this.shouldLoadEnvironment = undefined; // Clear the flag after loading
      }
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
            // Only auto-load a specific environment on initial page load, not after saves
            if (this.shouldLoadEnvironment) {
              const envToLoad = this.shouldLoadEnvironment;
              console.log(`Auto-loading environment on initial page load: ${envToLoad}`);
              setTimeout(() => {
                if (this.panel) {
                  this.handleLoadEnvironment(envToLoad);
                }
              }, 50);
              // Clear the flag so we don't reload on subsequent loadEnvironments calls
              this.shouldLoadEnvironment = undefined;
            } else {
              console.log('Skipping auto-load - no environment specified or already loaded once');
            }
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
          case 'exportEnvironments':
            await this.handleExportEnvironments();
            break;
          case 'importEnvironments':
            await this.handleImportEnvironments();
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
            cursor: pointer;
            transition: background-color 0.15s ease;
        }
        .environment-item:hover {
            background-color: var(--vscode-list-hoverBackground);
        }
        .environment-item.current {
            border-color: var(--vscode-focusBorder);
            background-color: var(--vscode-list-activeSelectionBackground);
        }
        .environment-item.current:hover {
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
        .section-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
        }
        .info-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            font-size: 12px;
            font-weight: bold;
            cursor: help;
            position: relative;
            flex-shrink: 0;
        }
        .info-icon:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
        .tooltip {
            visibility: hidden;
            position: absolute;
            z-index: 1000;
            background-color: var(--vscode-editorHoverWidget-background);
            color: var(--vscode-editorHoverWidget-foreground);
            border: 1px solid var(--vscode-editorHoverWidget-border);
            padding: 12px;
            border-radius: 4px;
            font-size: 13px;
            line-height: 1.5;
            min-width: 300px;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            top: 100%;
            left: 0;
            margin-top: 8px;
            white-space: normal;
        }
        .info-icon:hover .tooltip {
            visibility: visible;
        }
        .tooltip code {
            background-color: var(--vscode-textCodeBlock-background);
            color: var(--vscode-textPreformat-foreground);
            padding: 2px 6px;
            border-radius: 3px;
            font-family: var(--vscode-editor-font-family);
            font-size: 12px;
        }
        .tooltip strong {
            display: block;
            margin-bottom: 6px;
            color: var(--vscode-textLink-foreground);
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
        .loading-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.7);
            z-index: 2000;
            align-items: center;
            justify-content: center;
        }
        .loading-overlay.active {
            display: flex;
        }
        .loading-content {
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 24px 32px;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        .spinner {
            border: 3px solid var(--vscode-panel-border);
            border-top: 3px solid var(--vscode-button-background);
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .loading-text {
            font-size: 14px;
            color: var(--vscode-foreground);
            margin: 0;
        }

        /* Responsive styles for narrow panels */
        @media (max-width: 600px) {
            body {
                padding: 12px;
            }

            .container {
                max-width: 100%;
            }

            .modal-content {
                padding: 16px;
                max-width: 100%;
            }

            .header-row {
                flex-direction: column;
                gap: 6px;
            }

            .header-row .header-key,
            .header-row .header-value {
                min-width: auto;
                width: 100%;
            }

            .header-row .button {
                width: 100%;
            }

            .button {
                font-size: 14px;
                padding: 10px 14px;
            }

            .environment-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 8px;
            }

            .environment-header > div:last-child {
                width: 100%;
                justify-content: flex-start;
            }

            .environments-header {
                flex-direction: column;
                align-items: stretch;
                gap: 12px;
            }

            .environments-header .section-title {
                margin: 0;
            }

            .environments-header .button {
                width: 100%;
            }
        }

        @media (max-width: 400px) {
            .button {
                padding: 8px 12px;
                font-size: 13px;
            }

            .form-group {
                margin-bottom: 16px;
            }

            h1 {
                font-size: 1.3em;
            }

            .section-title {
                font-size: 1.1em;
            }
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
                <select id="provider">
                    <option value="">None</option>
                    <option value="Auth0">Auth0</option>
                    <option value="Okta">Okta</option>
                    <option value="Azure AD">Azure AD</option>
                    <option value="Custom">Custom</option>
                </select>
                <div class="help-text">Select your OAuth provider (optional)</div>
            </div>

            <div class="form-group">
                <label for="tokenEndpoint">Token Endpoint URL:</label>
                <input type="text" id="tokenEndpoint" placeholder="https://your-domain.com/oauth/token or \${TOKEN_ENDPOINT}" required>
                <div class="help-text">Full URL to the OAuth token endpoint (supports \${ENV_VAR} syntax)</div>
            </div>

            <div class="form-group">
                <label for="clientId" id="clientIdLabel">Client ID:</label>
                <input type="text" id="clientId" placeholder="Your client ID or \${CLIENT_ID}" required>
                <div class="help-text" id="clientIdHelp">OAuth application client ID (supports \${ENV_VAR} syntax)</div>
            </div>

            <div class="form-group">
                <label for="clientSecret" id="clientSecretLabel">Client Secret:</label>
                <input type="password" id="clientSecret" placeholder="Your client secret or \${CLIENT_SECRET}" required>
                <div class="help-text" id="clientSecretHelp">OAuth application client secret (supports \${ENV_VAR} syntax)</div>
            </div>

            <div class="form-group">
                <label for="audience">Audience (optional):</label>
                <input type="text" id="audience" placeholder="e.g., https://api.example.com or \${AUDIENCE}">
                <div class="help-text">The API identifier (supports \${ENV_VAR} syntax)</div>
            </div>

            <div class="form-group">
                <label for="scope">Scope (optional):</label>
                <input type="text" id="scope" placeholder="e.g., read:users write:users or \${SCOPE}">
                <div class="help-text">Space-separated list of scopes (supports \${ENV_VAR} syntax)</div>
            </div>

            <div class="form-group">
                <label for="authMethod">Authentication Method:</label>
                <select id="authMethod" required>
                    <option value="body">Credentials in Request Body (Default)</option>
                    <option value="basic">Basic Authentication Header</option>
                    <option value="custom-jwt">Custom JWT</option>
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

            <div class="section-header" style="margin-top: 24px;">
                <div class="section-title" style="margin: 0;">Custom Headers (Optional)</div>
                <span class="info-icon">i
                    <span class="tooltip">
                        <strong>Custom Headers with Environment Variables</strong>
                        You can use environment variables in your header values using the format <code>\${ENV_VAR_NAME}</code>
                        <br><br>
                        <strong>Examples:</strong><br>
                        • Static value: <code>my-api-key-123</code><br>
                        • Environment variable: <code>\${API_KEY}</code><br>
                        • Mixed: <code>Bearer \${AUTH_TOKEN}</code>
                        <br><br>
                        Environment variables are read from your system or VSCode terminal environment at runtime.
                    </span>
                </span>
            </div>
            <div id="customHeadersContainer"></div>
            <button type="button" class="button secondary" id="addHeaderBtn">+ Add Header</button>

            <div class="section-header" style="margin-top: 24px;">
                <div class="section-title" style="margin: 0;">Custom Body Fields (Optional)</div>
                <span class="info-icon">i
                    <span class="tooltip">
                        <strong>Custom Request Body Fields</strong>
                        For non-standard OAuth APIs, you can completely customize the request body structure. When custom body fields are defined, they <strong>replace</strong> the standard OAuth fields (client_id, client_secret, etc.).
                        <br><br>
                        <strong>Use Cases:</strong><br>
                        • APIs that use "key" instead of "client_id"<br>
                        • APIs that require additional fields like "groupHash"<br>
                        • Non-OAuth APIs with custom authentication
                        <br><br>
                        <strong>Examples:</strong><br>
                        • Field: <code>key</code>, Value: <code>\${API_KEY}</code><br>
                        • Field: <code>secret</code>, Value: <code>\${API_SECRET}</code><br>
                        • Field: <code>audience</code>, Value: <code>https://api.example.com</code><br>
                        • Field: <code>groupHash</code>, Value: <code>{tenant:group}</code>
                        <br><br>
                        Environment variables are supported using <code>\${ENV_VAR_NAME}</code> syntax.
                    </span>
                </span>
            </div>
            <div id="customBodyFieldsContainer"></div>
            <button type="button" class="button secondary" id="addBodyFieldBtn">+ Add Body Field</button>

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

    <!-- Loading Overlay -->
    <div class="loading-overlay" id="loadingOverlay">
        <div class="loading-content">
            <div class="spinner"></div>
            <p class="loading-text" id="loadingText">Loading...</p>
        </div>
    </div>

    <!-- Main Container -->
    <div class="container">
        <h1>OAuth Token Generator Configuration</h1>

        <div class="environments-header">
            <div class="section-title" style="margin: 0;">Configured Environments</div>
            <div style="display: flex; gap: 8px;">
                <button type="button" class="button secondary" id="exportBtn">Export</button>
                <button type="button" class="button secondary" id="importBtn">Import</button>
                <button type="button" class="button" id="addNewBtn">+ Add New</button>
            </div>
        </div>
        <div id="environmentsList" class="environment-list">
            <!-- Environments will be loaded here -->
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let headerCounter = 0;
        let confirmCallback = null;
        let originalEnvironmentName = null; // Track the original name when editing

        // Loading overlay management
        const loadingOverlay = document.getElementById('loadingOverlay');
        const loadingText = document.getElementById('loadingText');

        function showLoading(message) {
            loadingText.textContent = message;
            loadingOverlay.classList.add('active');
        }

        function hideLoading() {
            loadingOverlay.classList.remove('active');
        }

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
        // Removed: Close confirm dialog when clicking outside
        // Require explicit button click to prevent accidental dismissal
        // confirmDialog.addEventListener('click', (e) => {
        //     if (e.target === confirmDialog) {
        //         hideConfirm(false);
        //     }
        // });

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
            document.getElementById('customBodyFieldsContainer').innerHTML = '';
            headerCounter = 0;
            bodyFieldCounter = 0;
            originalEnvironmentName = null; // Reset when adding new
            openModal('Add New Environment');
        });

        document.getElementById('exportBtn').addEventListener('click', () => {
            vscode.postMessage({ type: 'exportEnvironments' });
        });

        document.getElementById('importBtn').addEventListener('click', () => {
            vscode.postMessage({ type: 'importEnvironments' });
        });

        closeModal.addEventListener('click', closeModalFn);

        // Removed: Close modal when clicking outside
        // The modal should only close when explicitly clicking the X button
        // modalOverlay.addEventListener('click', (e) => {
        //     if (e.target === modalOverlay) {
        //         closeModalFn();
        //     }
        // });

        // Dynamic label updates based on auth method
        const authMethodSelect = document.getElementById('authMethod');
        const clientIdLabel = document.getElementById('clientIdLabel');
        const clientSecretLabel = document.getElementById('clientSecretLabel');
        const clientIdHelp = document.getElementById('clientIdHelp');
        const clientSecretHelp = document.getElementById('clientSecretHelp');
        const clientIdInput = document.getElementById('clientId');
        const clientSecretInput = document.getElementById('clientSecret');

        function updateFieldLabels() {
            const authMethod = authMethodSelect.value;

            if (authMethod === 'basic') {
                clientIdLabel.textContent = 'Username:';
                clientSecretLabel.textContent = 'Password:';
                clientIdHelp.textContent = 'Username for Basic Authentication (supports \${ENV_VAR} syntax)';
                clientSecretHelp.textContent = 'Password for Basic Authentication (supports \${ENV_VAR} syntax)';
                clientIdInput.placeholder = 'Your username or \${USERNAME}';
                clientSecretInput.placeholder = 'Your password or \${PASSWORD}';
            } else if (authMethod === 'custom-jwt') {
                clientIdLabel.textContent = 'Client ID:';
                clientSecretLabel.textContent = 'Client Secret:';
                clientIdHelp.textContent = 'Client credentials for JWT authentication (supports \${ENV_VAR} syntax)';
                clientSecretHelp.textContent = 'Client secret for JWT authentication (supports \${ENV_VAR} syntax)';
                clientIdInput.placeholder = 'Your client ID or \${CLIENT_ID}';
                clientSecretInput.placeholder = 'Your client secret or \${CLIENT_SECRET}';
            } else {
                clientIdLabel.textContent = 'Client ID:';
                clientSecretLabel.textContent = 'Client Secret:';
                clientIdHelp.textContent = 'OAuth application client ID (supports \${ENV_VAR} syntax)';
                clientSecretHelp.textContent = 'OAuth application client secret (supports \${ENV_VAR} syntax)';
                clientIdInput.placeholder = 'Your client ID or \${CLIENT_ID}';
                clientSecretInput.placeholder = 'Your client secret or \${CLIENT_SECRET}';
            }
        }

        // Update labels when auth method changes
        authMethodSelect.addEventListener('change', updateFieldLabels);

        // Update labels on initial load based on current selection
        updateFieldLabels();

        // Dynamic field requirements based on provider selection
        const providerSelect = document.getElementById('provider');
        const tokenEndpointInput = document.getElementById('tokenEndpoint');
        const audienceLabel = document.querySelector('label[for="audience"]');

        function updateFieldRequirements() {
            const isNoneProvider = providerSelect.value === '';

            if (isNoneProvider) {
                // Make fields optional when "None" is selected
                tokenEndpointInput.removeAttribute('required');
                clientIdInput.removeAttribute('required');
                clientSecretInput.removeAttribute('required');

                // Update labels to show (optional)
                document.querySelector('label[for="tokenEndpoint"]').textContent = 'Token Endpoint URL (optional):';
                clientIdLabel.textContent = clientIdLabel.textContent.replace(':', ' (optional):');
                clientSecretLabel.textContent = clientSecretLabel.textContent.replace(':', ' (optional):');
            } else {
                // Make fields required when a provider is selected
                tokenEndpointInput.setAttribute('required', '');
                clientIdInput.setAttribute('required', '');
                clientSecretInput.setAttribute('required', '');

                // Remove (optional) from labels
                document.querySelector('label[for="tokenEndpoint"]').textContent = 'Token Endpoint URL:';
                // Restore original label based on auth method
                updateFieldLabels();
            }
        }

        // Update requirements when provider changes
        providerSelect.addEventListener('change', updateFieldRequirements);

        // Update requirements on initial load
        updateFieldRequirements();

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
            const headerRows = document.querySelectorAll('#customHeadersContainer .header-row');
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

        // Dynamic body field management
        let bodyFieldCounter = 0;

        document.getElementById('addBodyFieldBtn').addEventListener('click', () => {
            addBodyFieldRow();
        });

        function addBodyFieldRow(key = '', value = '') {
            const fieldId = \`bodyfield-\${bodyFieldCounter++}\`;
            const container = document.getElementById('customBodyFieldsContainer');

            const fieldRow = document.createElement('div');
            fieldRow.className = 'header-row';
            fieldRow.id = fieldId;
            fieldRow.innerHTML = \`
                <input type="text"
                       class="bodyfield-key"
                       placeholder="Field name (e.g., key, secret, groupHash)"
                       value="\${key}">
                <input type="text"
                       class="bodyfield-value"
                       placeholder="Field value (use \\\${ENV_VAR} for placeholders)"
                       value="\${value}">
                <button type="button" class="button secondary" onclick="removeBodyField('\${fieldId}')">
                    Remove
                </button>
            \`;

            container.appendChild(fieldRow);
        }

        window.removeBodyField = function(fieldId) {
            const element = document.getElementById(fieldId);
            if (element) {
                element.remove();
            }
        };

        function getCustomBodyFields() {
            const fieldRows = document.querySelectorAll('#customBodyFieldsContainer .header-row');
            const fields = [];

            fieldRows.forEach(row => {
                const key = row.querySelector('.bodyfield-key').value.trim();
                const value = row.querySelector('.bodyfield-value').value.trim();

                if (key && value) {
                    fields.push({ key, value });
                }
            });

            return fields;
        }

        // Set up event delegation for environment action buttons
        document.addEventListener('click', (e) => {
            // Find the element with data-action (traverse up if needed)
            let target = e.target;
            let foundAction = false;

            while (target && target !== document.body && !foundAction) {
                if (target.dataset && target.dataset.action) {
                    const action = target.dataset.action;
                    const envName = target.dataset.envName;

                    console.log('Action triggered:', action, 'for environment:', envName);

                    // Stop propagation to prevent triggering parent actions
                    e.stopPropagation();
                    foundAction = true;

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
                        showLoading('Retrieving ' + envName + '...');
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
                    break;
                }
                target = target.parentElement;
            }
        });

        document.getElementById('credentialsForm').addEventListener('submit', (e) => {
            e.preventDefault();

            const credentials = {
                environmentName: document.getElementById('environmentName').value,
                originalEnvironmentName: originalEnvironmentName, // Include original name for updates
                provider: document.getElementById('provider').value,
                tokenEndpoint: document.getElementById('tokenEndpoint').value,
                clientId: document.getElementById('clientId').value,
                clientSecret: document.getElementById('clientSecret').value,
                audience: document.getElementById('audience').value,
                scope: document.getElementById('scope').value,
                authMethod: document.getElementById('authMethod').value,
                contentType: document.getElementById('contentType').value,
                customHeaders: getCustomHeaders(),
                customBodyFields: getCustomBodyFields()
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
                customHeaders: getCustomHeaders(),
                customBodyFields: getCustomBodyFields()
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
                    // Keep the form as-is and reload the environments list
                    // Don't close the modal - let the user close it manually
                    // Update the original name tracker if this was a rename
                    if (message.data && message.data.wasRenamed) {
                        originalEnvironmentName = message.data.newEnvironmentName;
                    }
                    loadEnvironments();
                    break;
                case 'environmentDeleted':
                    console.log('Environment deleted, reloading list...');
                    loadEnvironments();
                    break;
                case 'environmentLoaded':
                    const env = message.data;

                    // Hide loading spinner
                    hideLoading();

                    // Store the original name for updates
                    originalEnvironmentName = env.name;

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

                    // Clear and populate custom body fields
                    document.getElementById('customBodyFieldsContainer').innerHTML = '';
                    bodyFieldCounter = 0;
                    const bodyFields = env.credentials.customBodyFields || [];
                    bodyFields.forEach(field => {
                        addBodyFieldRow(field.key, field.value);
                    });

                    // Update field labels based on auth method
                    updateFieldLabels();

                    // Open the modal with edit title
                    openModal('Edit Environment');
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
                    <div class="environment-item \${isCurrent ? 'current' : ''}" data-action="edit" data-env-name="\${env.name}">
                        <div class="environment-header">
                            <div>
                                <div class="environment-name">\${env.name} \${isCurrent ? '(current)' : ''}</div>
                                <div class="environment-domain">\${env.credentials.provider} - \${env.credentials.tokenEndpoint}</div>
                            </div>
                            <div style="display: flex; gap: 6px;">
                                <button class="button secondary icon" data-action="getToken" data-env-name="\${env.name}" title="Get Token">↻</button>
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
        customHeaders: data.customHeaders || [],
        customBodyFields: data.customBodyFields || []
      };

      // Check if we're updating an existing environment (rename scenario)
      if (data.originalEnvironmentName && data.originalEnvironmentName !== data.environmentName) {
        // Delete the old environment
        await this.storageManager.deleteEnvironment(data.originalEnvironmentName);

        // Check if the deleted environment was the current one
        const currentEnv = await this.storageManager.getCurrentEnvironment();
        if (currentEnv === data.originalEnvironmentName) {
          // Update current environment to new name
          await this.storageManager.setCurrentEnvironment(data.environmentName);
        }
      }

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
        type: 'credentialsSaved',
        data: {
          newEnvironmentName: data.environmentName,
          wasRenamed: data.originalEnvironmentName && data.originalEnvironmentName !== data.environmentName
        }
      });

      // Show appropriate message based on whether it was a rename or update
      if (data.originalEnvironmentName && data.originalEnvironmentName !== data.environmentName) {
        vscode.window.showInformationMessage(`✓ Environment renamed from '${data.originalEnvironmentName}' to '${data.environmentName}'`);
      } else {
        vscode.window.showInformationMessage(`✓ Credentials saved for environment: ${data.environmentName}`);
      }

      // Refresh tree views
      if (this.onTreeViewRefreshCallback) {
        this.onTreeViewRefreshCallback();
      }
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
        customHeaders: data.customHeaders || [],
        customBodyFields: data.customBodyFields || []
      };

      const oauthClient = new OAuthClient(credentials);
      await oauthClient.validateCredentials();
      vscode.window.showInformationMessage('✓ Credentials are valid!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      // Show error in modal dialog for better visibility
      vscode.window.showErrorMessage(errorMessage, { modal: true });
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

      // Refresh tree views
      if (this.onTreeViewRefreshCallback) {
        this.onTreeViewRefreshCallback();
      }
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

  private async handleExportEnvironments(): Promise<void> {
    try {
      const environments = await this.storageManager.getEnvironments();

      if (environments.length === 0) {
        vscode.window.showInformationMessage('No environments to export.');
        return;
      }

      const jsonData = await this.storageManager.exportEnvironments();

      const uri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file('oauth-environments.json'),
        filters: {
          'JSON Files': ['json'],
          'All Files': ['*']
        },
        saveLabel: 'Export'
      });

      if (uri) {
        await vscode.workspace.fs.writeFile(uri, Buffer.from(jsonData, 'utf8'));
        vscode.window.showInformationMessage(`✓ Exported ${environments.length} environment(s) to ${uri.fsPath}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      vscode.window.showErrorMessage(`Failed to export environments: ${errorMessage}`);
    }
  }

  private async handleImportEnvironments(): Promise<void> {
    try {
      const uri = await vscode.window.showOpenDialog({
        canSelectMany: false,
        filters: {
          'JSON Files': ['json'],
          'All Files': ['*']
        },
        openLabel: 'Import'
      });

      if (!uri || uri.length === 0) {
        return;
      }

      const fileContent = await vscode.workspace.fs.readFile(uri[0]);
      const jsonData = Buffer.from(fileContent).toString('utf8');

      // Ask user if they want to overwrite existing environments
      const overwrite = await vscode.window.showQuickPick(
        [
          { label: 'Skip existing', description: 'Keep existing environments with same name', value: false },
          { label: 'Overwrite existing', description: 'Replace environments with same name', value: true }
        ],
        {
          placeHolder: 'How should we handle environments that already exist?'
        }
      );

      if (overwrite === undefined) {
        return;
      }

      const result = await this.storageManager.importEnvironments(jsonData, overwrite.value);

      let message = `✓ Import completed: ${result.imported} imported`;
      if (result.skipped > 0) {
        message += `, ${result.skipped} skipped`;
      }

      vscode.window.showInformationMessage(message);

      // Reload the environments list in the webview
      await this.handleLoadEnvironments();

      // Refresh tree views in the sidebar
      if (this.onTreeViewRefreshCallback) {
        this.onTreeViewRefreshCallback();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      vscode.window.showErrorMessage(`Failed to import environments: ${errorMessage}`);
    }
  }
}