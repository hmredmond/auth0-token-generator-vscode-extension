import * as vscode from 'vscode';
import { StorageManager } from './storage-manager';
import { OAuthEnvironment, StoredToken } from './types';

export class EnvironmentsTreeProvider implements vscode.TreeDataProvider<EnvironmentTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<EnvironmentTreeItem | undefined | null | void> = new vscode.EventEmitter<EnvironmentTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<EnvironmentTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  constructor(private storageManager: StorageManager) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  dispose(): void {
    this._onDidChangeTreeData.dispose();
  }

  getTreeItem(element: EnvironmentTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: EnvironmentTreeItem): Promise<EnvironmentTreeItem[]> {
    if (!element) {
      // Root level - show all environments
      const environments = await this.storageManager.getEnvironments();
      const currentEnv = await this.storageManager.getCurrentEnvironment();

      if (environments.length === 0) {
        return [new EnvironmentTreeItem('Loading...', '', false, 'loading')];
      }

      return environments.map(env =>
        new EnvironmentTreeItem(
          env.name,
          `${env.credentials.provider} - ${env.credentials.tokenEndpoint}`,
          env.name === currentEnv,
          'environment',
          env
        )
      );
    }

    return [];
  }
}

export class TokensTreeProvider implements vscode.TreeDataProvider<TokenTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<TokenTreeItem | undefined | null | void> = new vscode.EventEmitter<TokenTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<TokenTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  constructor(private storageManager: StorageManager) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  dispose(): void {
    this._onDidChangeTreeData.dispose();
  }

  getTreeItem(element: TokenTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: TokenTreeItem): Promise<TokenTreeItem[]> {
    if (!element) {
      // Root level - show all stored tokens
      await this.storageManager.removeExpiredTokens();
      const tokens = await this.storageManager.getStoredTokens();
      const tokenEntries = Object.entries(tokens);

      if (tokenEntries.length === 0) {
        return [new TokenTreeItem('No tokens stored', '', 'none')];
      }

      return tokenEntries.map(([key, token]) => {
        const expiresIn = Math.round((token.expiresAt - Date.now()) / 1000);
        const expiresInMinutes = Math.round(expiresIn / 60);

        let timeString: string;
        if (expiresInMinutes > 60) {
          const hours = Math.round(expiresInMinutes / 60);
          timeString = `${hours}h`;
        } else if (expiresInMinutes > 0) {
          timeString = `${expiresInMinutes}m`;
        } else {
          timeString = `${expiresIn}s`;
        }

        return new TokenTreeItem(
          token.environment,
          `Expires in ${timeString}`,
          'token',
          token
        );
      });
    }

    return [];
  }
}

export class EnvironmentTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly description: string,
    public readonly isCurrent: boolean,
    public readonly itemType: 'environment' | 'none' | 'loading',
    public readonly environment?: OAuthEnvironment
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);

    if (itemType === 'environment') {
      this.tooltip = `${label}\n${description}${isCurrent ? ' (current)' : ''}`;
      // Add padding to prevent text overlap with inline action button
      this.description = isCurrent ? `${description} (current)                    ` : `${description}                    `;
      this.iconPath = new vscode.ThemeIcon(
        isCurrent ? 'server-environment' : 'server',
        isCurrent ? new vscode.ThemeColor('charts.green') : undefined
      );

      this.contextValue = 'environment';
      this.command = {
        command: 'oauth-token-generator.editEnvironmentFromTree',
        title: 'Edit Environment',
        arguments: [this]
      };
    } else if (itemType === 'loading') {
      this.iconPath = new vscode.ThemeIcon('loading~spin');
      this.contextValue = 'loading';
    } else {
      this.iconPath = new vscode.ThemeIcon('info');
      this.contextValue = 'placeholder';
    }
  }
}

export class TokenTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly description: string,
    public readonly itemType: 'token' | 'none',
    public readonly token?: StoredToken
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);

    if (itemType === 'token') {
      this.tooltip = `Environment: ${label}\n${description}\nAudience: ${token?.audience || 'default'}`;
      this.iconPath = new vscode.ThemeIcon('lock', new vscode.ThemeColor('charts.blue'));
      this.contextValue = 'token';
      this.command = {
        command: 'oauth-token-generator.copyTokenFromTree',
        title: 'Copy Token',
        arguments: [this.token]
      };
    } else {
      this.iconPath = new vscode.ThemeIcon('info');
      this.contextValue = 'placeholder';
    }
  }
}
