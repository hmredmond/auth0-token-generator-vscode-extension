import * as vscode from 'vscode';
import { StorageManager } from './storage-manager';

export class StatusBarManager {
  private statusBarItem: vscode.StatusBarItem;
  private storageManager: StorageManager;

  constructor(context: vscode.ExtensionContext) {
    this.storageManager = new StorageManager(context);
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    
    this.statusBarItem.command = 'auth0-token-generator.generateToken';
    context.subscriptions.push(this.statusBarItem);
    
    this.updateStatusBar();
  }

  async updateStatusBar(): Promise<void> {
    const currentEnv = await this.storageManager.getCurrentEnvironment();
    
    if (currentEnv) {
      this.statusBarItem.text = `$(key) Auth0: ${currentEnv}`;
      this.statusBarItem.tooltip = `Current Auth0 environment: ${currentEnv}\nClick to generate bearer token`;
    } else {
      this.statusBarItem.text = `$(key) Auth0: Not configured`;
      this.statusBarItem.tooltip = 'Click to configure Auth0 credentials';
      this.statusBarItem.command = 'auth0-token-generator.configureCredentials';
    }
    
    this.statusBarItem.show();
  }

  dispose(): void {
    this.statusBarItem.dispose();
  }
}