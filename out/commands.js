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
exports.CommandManager = void 0;
const vscode = __importStar(require("vscode"));
const auth0_client_1 = require("./auth0-client");
const storage_manager_1 = require("./storage-manager");
const webview_manager_1 = require("./webview-manager");
class CommandManager {
    constructor(context) {
        this.storageManager = new storage_manager_1.StorageManager(context);
        this.webviewManager = new webview_manager_1.WebviewManager(context);
    }
    async generateToken() {
        try {
            const currentEnv = await this.storageManager.getCurrentEnvironment();
            let environment;
            if (!currentEnv) {
                const environments = await this.storageManager.getEnvironments();
                if (environments.length === 0) {
                    vscode.window.showInformationMessage('No Auth0 environments configured. Please configure credentials first.', 'Configure Now').then(selection => {
                        if (selection === 'Configure Now') {
                            this.configureCredentials();
                        }
                    });
                    return;
                }
                if (environments.length === 1) {
                    environment = environments[0];
                    await this.storageManager.setCurrentEnvironment(environment.name);
                }
                else {
                    await this.selectEnvironment();
                    return;
                }
            }
            else {
                const environments = await this.storageManager.getEnvironments();
                environment = environments.find(env => env.name === currentEnv);
                if (!environment) {
                    vscode.window.showErrorMessage('Current environment not found. Please select a valid environment.');
                    await this.selectEnvironment();
                    return;
                }
            }
            // Check for cached valid token first
            await this.storageManager.removeExpiredTokens();
            const storedTokens = await this.storageManager.getStoredTokens();
            const audience = environment.credentials.audience || '';
            const scope = environment.credentials.scope || '';
            const tokenKey = `${environment.name}-${audience}-${scope}`;
            const cachedToken = storedTokens[tokenKey];
            if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) { // 1 minute buffer
                await this.copyTokenToClipboard(cachedToken.token);
                const expiresIn = Math.round((cachedToken.expiresAt - Date.now()) / 1000);
                vscode.window.showInformationMessage(`✓ Cached bearer token copied to clipboard! (expires in ${expiresIn}s)`);
                return;
            }
            const auth0Client = new auth0_client_1.Auth0Client(environment.credentials);
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Generating Auth0 bearer token...",
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 50, message: "Requesting token from Auth0..." });
                const tokenResponse = await auth0Client.generateToken();
                progress.report({ increment: 50, message: "Processing response..." });
                // Store the token
                if (environment) {
                    const storedToken = {
                        token: tokenResponse.access_token,
                        expiresAt: Date.now() + (tokenResponse.expires_in * 1000),
                        environment: environment.name,
                        audience: audience,
                        scope: scope
                    };
                    await this.storageManager.storeToken(storedToken);
                }
                await this.copyTokenToClipboard(tokenResponse.access_token);
                const expiresInMinutes = Math.round(tokenResponse.expires_in / 60);
                vscode.window.showInformationMessage(`✓ Bearer token generated and copied to clipboard! (expires in ${expiresInMinutes}m)`);
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            vscode.window.showErrorMessage(`Failed to generate token: ${errorMessage}`);
        }
    }
    async configureCredentials() {
        await this.webviewManager.showConfigurationPanel();
    }
    async selectEnvironment() {
        const environments = await this.storageManager.getEnvironments();
        if (environments.length === 0) {
            vscode.window.showInformationMessage('No environments configured.', 'Configure Now').then(selection => {
                if (selection === 'Configure Now') {
                    this.configureCredentials();
                }
            });
            return;
        }
        const options = environments.map(env => ({
            label: env.name,
            description: env.credentials.domain
        }));
        const selected = await vscode.window.showQuickPick(options, {
            placeHolder: 'Select Auth0 environment'
        });
        if (selected) {
            await this.storageManager.setCurrentEnvironment(selected.label);
            vscode.window.showInformationMessage(`✓ Environment switched to: ${selected.label}`);
        }
    }
    async viewStoredTokens() {
        await this.storageManager.removeExpiredTokens();
        const tokens = await this.storageManager.getStoredTokens();
        const tokenEntries = Object.entries(tokens);
        if (tokenEntries.length === 0) {
            vscode.window.showInformationMessage('No stored tokens found.');
            return;
        }
        const options = tokenEntries.map(([key, token]) => {
            const expiresIn = Math.round((token.expiresAt - Date.now()) / 1000);
            return {
                label: token.environment,
                description: `Expires in ${expiresIn}s`,
                detail: `Audience: ${token.audience || 'default'}`,
                token: token.token
            };
        });
        const selected = await vscode.window.showQuickPick(options, {
            placeHolder: 'Select token to copy to clipboard'
        });
        if (selected) {
            await this.copyTokenToClipboard(selected.token);
            vscode.window.showInformationMessage('✓ Token copied to clipboard!');
        }
    }
    async copyTokenToClipboard(token) {
        await vscode.env.clipboard.writeText(token);
    }
}
exports.CommandManager = CommandManager;
//# sourceMappingURL=commands.js.map