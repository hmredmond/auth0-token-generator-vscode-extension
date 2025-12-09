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
    
    this.statusBarItem.command = 'oauth-token-generator.generateToken';
    context.subscriptions.push(this.statusBarItem);

    this.updateStatusBar();
  }

  async updateStatusBar(): Promise<void> {
    const currentEnv = await this.storageManager.getCurrentEnvironment();

    if (currentEnv) {
      this.statusBarItem.text = `$(key) OAuth: ${currentEnv}`;
      this.statusBarItem.tooltip = `Current OAuth environment: ${currentEnv}\nClick to generate bearer token`;
    } else {
      this.statusBarItem.text = `$(key) OAuth: Not configured`;
      this.statusBarItem.tooltip = 'Click to configure OAuth credentials';
      this.statusBarItem.command = 'oauth-token-generator.configureCredentials';
    }
    
    this.statusBarItem.show();
  }

  dispose(): void {
    this.statusBarItem.dispose();
  }
}