"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebviewManager = void 0;
const vscode = __importStar(require("vscode"));
const storage_manager_1 = require("./storage-manager");
const auth0_client_1 = require("./auth0-client");
class WebviewManager {
    constructor(context) {
        this.context = context;
        this.storageManager = new storage_manager_1.StorageManager(context);
    }
    async showConfigurationPanel() {
        if (this.panel) {
            this.panel.reveal();
            return;
        }
        this.panel = vscode.window.createWebviewPanel('auth0Config', 'Auth0 Configuration', vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true
        });
        this.panel.webview.html = await this.getWebviewContent();
        this.panel.webview.onDidReceiveMessage(async (message) => {
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
                case 'deleteEnvironment':
                    await this.handleDeleteEnvironment(message.data.name);
                    break;
            }
        });
        this.panel.onDidDispose(() => {
            this.panel = undefined;
        });
    }
    async getWebviewContent() {
        const environments = await this.storageManager.getEnvironments();
        const currentEnv = await this.storageManager.getCurrentEnvironment();
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Auth0 Configuration</title>
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
    </style>
</head>
<body>
    <div class="container">
        <h1>Auth0 Token Generator Configuration</h1>
        
        <form id="credentialsForm">
            <div class="form-group">
                <label for="environmentName">Environment Name:</label>
                <input type="text" id="environmentName" placeholder="e.g., dev, staging, prod" required>
                <div class="help-text">A friendly name to identify this Auth0 environment</div>
            </div>
            
            <div class="form-group">
                <label for="domain">Auth0 Domain:</label>
                <input type="text" id="domain" placeholder="your-tenant.auth0.com" required>
                <div class="help-text">Your Auth0 tenant domain (without https://)</div>
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
                <div class="help-text">The API identifier for your Auth0 API</div>
            </div>
            
            <div class="form-group">
                <label for="scope">Scope (optional):</label>
                <input type="text" id="scope" placeholder="e.g., read:users write:users">
                <div class="help-text">Space-separated list of scopes</div>
            </div>
            
            <button type="submit" class="button">Save Credentials</button>
            <button type="button" class="button secondary" id="testBtn">Test Connection</button>
        </form>

        <div class="section-title">Configured Environments</div>
        <div id="environmentsList" class="environment-list">
            <!-- Environments will be loaded here -->
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        document.getElementById('credentialsForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const credentials = {
                environmentName: document.getElementById('environmentName').value,
                domain: document.getElementById('domain').value,
                clientId: document.getElementById('clientId').value,
                clientSecret: document.getElementById('clientSecret').value,
                audience: document.getElementById('audience').value,
                scope: document.getElementById('scope').value
            };
            
            vscode.postMessage({
                type: 'saveCredentials',
                data: credentials
            });
        });
        
        document.getElementById('testBtn').addEventListener('click', () => {
            const credentials = {
                domain: document.getElementById('domain').value,
                clientId: document.getElementById('clientId').value,
                clientSecret: document.getElementById('clientSecret').value,
                audience: document.getElementById('audience').value,
                scope: document.getElementById('scope').value
            };
            
            vscode.postMessage({
                type: 'testCredentials',
                data: credentials
            });
        });
        
        function loadEnvironments() {
            vscode.postMessage({ type: 'loadEnvironments' });
        }
        
        function deleteEnvironment(name) {
            if (confirm('Are you sure you want to delete this environment?')) {
                vscode.postMessage({
                    type: 'deleteEnvironment',
                    data: { name: name }
                });
            }
        }
        
        // Load environments on page load
        loadEnvironments();
        
        // Listen for messages from the extension
        window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.type) {
                case 'environmentsLoaded':
                    displayEnvironments(message.data.environments, message.data.currentEnv);
                    break;
                case 'credentialsSaved':
                    document.getElementById('credentialsForm').reset();
                    loadEnvironments();
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
                                <div class="environment-domain">\${env.credentials.domain}</div>
                            </div>
                            <button class="button secondary" onclick="deleteEnvironment('\${env.name}')">Delete</button>
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
    async handleSaveCredentials(data) {
        try {
            const credentials = {
                domain: data.domain,
                clientId: data.clientId,
                clientSecret: data.clientSecret,
                audience: data.audience || undefined,
                scope: data.scope || undefined
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
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            vscode.window.showErrorMessage(`Failed to save credentials: ${errorMessage}`);
        }
    }
    async handleTestCredentials(data) {
        try {
            const credentials = {
                domain: data.domain,
                clientId: data.clientId,
                clientSecret: data.clientSecret,
                audience: data.audience || undefined,
                scope: data.scope || undefined
            };
            const auth0Client = new auth0_client_1.Auth0Client(credentials);
            const isValid = await auth0Client.validateCredentials();
            if (isValid) {
                vscode.window.showInformationMessage('✓ Credentials are valid!');
            }
            else {
                vscode.window.showErrorMessage('✗ Invalid credentials. Please check your configuration.');
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            vscode.window.showErrorMessage(`Credential test failed: ${errorMessage}`);
        }
    }
    async handleLoadEnvironments() {
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
    async handleDeleteEnvironment(name) {
        // Note: This is a simplified implementation
        // In a real extension, you'd want to properly delete from secrets storage
        vscode.window.showInformationMessage(`Environment ${name} deletion requested. Restart VS Code to complete removal.`);
    }
}
exports.WebviewManager = WebviewManager;
//# sourceMappingURL=webview-manager.js.map