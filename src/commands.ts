import * as vscode from 'vscode';
import { OAuthClient } from './oauth-client';
import { StorageManager } from './storage-manager';
import { WebviewManager } from './webview-manager';
import { OAuthCredentials, StoredToken, OAuthEnvironment } from './types';

export class CommandManager {
  private storageManager: StorageManager;
  private webviewManager: WebviewManager;
  private onTreeViewRefreshCallback?: () => void;

  constructor(context: vscode.ExtensionContext) {
    this.storageManager = new StorageManager(context);
    this.webviewManager = new WebviewManager(context);
  }

  setTreeViewRefreshCallback(callback: () => void): void {
    this.onTreeViewRefreshCallback = callback;
  }

  async generateToken(): Promise<void> {
    try {
      const currentEnv = await this.storageManager.getCurrentEnvironment();
      let environment: OAuthEnvironment | undefined;

      if (!currentEnv) {
        const environments = await this.storageManager.getEnvironments();
        if (environments.length === 0) {
          vscode.window.showInformationMessage(
            'No OAuth environments configured. Please configure credentials first.',
            'Configure Now'
          ).then(selection => {
            if (selection === 'Configure Now') {
              this.configureCredentials();
            }
          });
          return;
        }

        if (environments.length === 1) {
          environment = environments[0];
          await this.storageManager.setCurrentEnvironment(environment.name);
        } else {
          await this.selectEnvironment();
          return;
        }
      } else {
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
        vscode.window.showInformationMessage(
          `✓ Cached bearer token copied to clipboard! (expires in ${expiresIn}s)`
        );
        return;
      }

      const oauthClient = new OAuthClient(environment.credentials);

      vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Generating OAuth bearer token...",
        cancellable: false
      }, async (progress) => {
        progress.report({ increment: 50, message: "Requesting token from provider..." });

        const tokenResponse = await oauthClient.generateToken();
        
        progress.report({ increment: 50, message: "Processing response..." });
        
        // Store the token
        if (environment) {
          const storedToken: StoredToken = {
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
        vscode.window.showInformationMessage(
          `✓ Bearer token generated and copied to clipboard! (expires in ${expiresInMinutes}m)`
        );
      });

      // Refresh tree views
      if (this.onTreeViewRefreshCallback) {
        this.onTreeViewRefreshCallback();
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      vscode.window.showErrorMessage(`Failed to generate token: ${errorMessage}`);
    }
  }

  async configureCredentials(): Promise<void> {
    await this.webviewManager.showConfigurationPanel();
  }

  async selectEnvironment(): Promise<void> {
    const environments = await this.storageManager.getEnvironments();
    
    if (environments.length === 0) {
      vscode.window.showInformationMessage(
        'No environments configured.',
        'Configure Now'
      ).then(selection => {
        if (selection === 'Configure Now') {
          this.configureCredentials();
        }
      });
      return;
    }

    const options = environments.map(env => ({
      label: env.name,
      description: `${env.credentials.provider} - ${env.credentials.tokenEndpoint}`
    }));

    const selected = await vscode.window.showQuickPick(options, {
      placeHolder: 'Select OAuth environment'
    });

    if (selected) {
      await this.storageManager.setCurrentEnvironment(selected.label);
      vscode.window.showInformationMessage(`✓ Environment switched to: ${selected.label}`);

      // Refresh tree views
      if (this.onTreeViewRefreshCallback) {
        this.onTreeViewRefreshCallback();
      }
    }
  }

  async viewStoredTokens(): Promise<void> {
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

  private async copyTokenToClipboard(token: string): Promise<void> {
    await vscode.env.clipboard.writeText(token);
  }
}