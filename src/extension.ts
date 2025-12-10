import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { config } from 'dotenv';
import { CommandManager } from './commands';
import { StatusBarManager } from './status-bar';
import { StorageManager } from './storage-manager';
import { EnvironmentsTreeProvider, TokensTreeProvider } from './tree-providers';
import { OAuthEnvironment, StoredToken } from './types';

let commandManager: CommandManager;
let statusBarManager: StatusBarManager;
let environmentsTreeProvider: EnvironmentsTreeProvider;
let tokensTreeProvider: TokensTreeProvider;

/**
 * Load environment variables from .env files in the workspace root
 * Supports .env, .env.local, .env.development, .env.production
 */
function loadEnvironmentVariables() {
  const workspaceFolders = vscode.workspace.workspaceFolders;

  if (!workspaceFolders || workspaceFolders.length === 0) {
    console.log('No workspace folder open, skipping .env file loading');
    return;
  }

  const workspaceRoot = workspaceFolders[0].uri.fsPath;

  // Try loading in order of precedence (later files override earlier ones)
  // .env.local and .env.production/.env.development override .env
  const envFiles = ['.env', '.env.local', '.env.development', '.env.production'];
  let loadedCount = 0;

  for (const envFile of envFiles) {
    const envPath = path.join(workspaceRoot, envFile);

    if (fs.existsSync(envPath)) {
      try {
        // Use override: true so later files can override earlier ones
        const result = config({ path: envPath, override: true });
        if (result.parsed) {
          loadedCount++;
          console.log(`Loaded environment variables from ${envFile}`);
        }
      } catch (error) {
        console.warn(`Failed to load ${envFile}:`, error);
      }
    }
  }

  if (loadedCount > 0) {
    console.log(`Successfully loaded environment variables from ${loadedCount} file(s)`);
  } else {
    console.log('No .env files found in workspace root');
  }
}

export function activate(context: vscode.ExtensionContext) {
  console.log('OAuth Token Generator extension is now active!');

  // Load .env files from workspace root if they exist
  loadEnvironmentVariables();

  // Initialize managers
  const storageManager = new StorageManager(context);
  commandManager = new CommandManager(context);
  statusBarManager = new StatusBarManager(context);

  // Initialize tree view providers
  environmentsTreeProvider = new EnvironmentsTreeProvider(storageManager);
  tokensTreeProvider = new TokensTreeProvider(storageManager);

  // Set up refresh callback for command manager
  commandManager.setTreeViewRefreshCallback(() => {
    environmentsTreeProvider.refresh();
    tokensTreeProvider.refresh();
  });

  // Register tree views
  const environmentsTreeView = vscode.window.createTreeView('auth0Environments', {
    treeDataProvider: environmentsTreeProvider,
    showCollapseAll: false
  });

  const tokensTreeView = vscode.window.createTreeView('auth0Tokens', {
    treeDataProvider: tokensTreeProvider,
    showCollapseAll: false
  });

  // Trigger initial refresh after a brief delay to load actual data
  setTimeout(() => {
    environmentsTreeProvider.refresh();
    tokensTreeProvider.refresh();
  }, 100);

  // Register commands
  const generateTokenCommand = vscode.commands.registerCommand(
    'oauth-token-generator.generateToken',
    () => commandManager.generateToken()
  );

  const configureCredentialsCommand = vscode.commands.registerCommand(
    'oauth-token-generator.configureCredentials',
    () => commandManager.configureCredentials()
  );

  const selectEnvironmentCommand = vscode.commands.registerCommand(
    'oauth-token-generator.selectEnvironment',
    () => commandManager.selectEnvironment()
  );

  const viewStoredTokensCommand = vscode.commands.registerCommand(
    'oauth-token-generator.viewStoredTokens',
    () => commandManager.viewStoredTokens()
  );

  // Register tree view commands
  const generateTokenFromTreeCommand = vscode.commands.registerCommand(
    'oauth-token-generator.generateTokenFromTree',
    async (environment: OAuthEnvironment) => {
      if (environment) {
        await storageManager.setCurrentEnvironment(environment.name);
        await commandManager.generateToken();
        environmentsTreeProvider.refresh();
        tokensTreeProvider.refresh();
      }
    }
  );

  const copyTokenFromTreeCommand = vscode.commands.registerCommand(
    'oauth-token-generator.copyTokenFromTree',
    async (token: StoredToken) => {
      if (token) {
        await vscode.env.clipboard.writeText(token.token);
        const expiresIn = Math.round((token.expiresAt - Date.now()) / 1000);
        vscode.window.showInformationMessage(`✓ Token copied to clipboard! (expires in ${expiresIn}s)`);
      }
    }
  );

  const refreshEnvironmentsCommand = vscode.commands.registerCommand(
    'oauth-token-generator.refreshEnvironments',
    () => environmentsTreeProvider.refresh()
  );

  const refreshTokensCommand = vscode.commands.registerCommand(
    'oauth-token-generator.refreshTokens',
    () => tokensTreeProvider.refresh()
  );

  const openConfigFromTreeCommand = vscode.commands.registerCommand(
    'oauth-token-generator.openConfigFromTree',
    () => commandManager.configureCredentials()
  );

  const viewAllEnvironmentsCommand = vscode.commands.registerCommand(
    'oauth-token-generator.viewAllEnvironments',
    () => commandManager.viewAllEnvironments()
  );

  const editEnvironmentFromTreeCommand = vscode.commands.registerCommand(
    'oauth-token-generator.editEnvironmentFromTree',
    async (item: any) => {
      if (item && item.environment) {
        await commandManager.editEnvironment(item.environment.name);
      }
    }
  );

  const generateTokenFromTreeInlineCommand = vscode.commands.registerCommand(
    'oauth-token-generator.generateTokenFromTreeInline',
    async (item: any) => {
      if (item && item.environment) {
        await storageManager.setCurrentEnvironment(item.environment.name);
        await commandManager.generateToken();
        environmentsTreeProvider.refresh();
        tokensTreeProvider.refresh();
      }
    }
  );

  const exportEnvironmentsCommand = vscode.commands.registerCommand(
    'oauth-token-generator.exportEnvironments',
    () => commandManager.exportEnvironments()
  );

  const importEnvironmentsCommand = vscode.commands.registerCommand(
    'oauth-token-generator.importEnvironments',
    async () => {
      await commandManager.importEnvironments();
      environmentsTreeProvider.refresh();
    }
  );

  // Register event listeners
  const onConfigurationChanged = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('oauthTokenGenerator')) {
      statusBarManager.updateStatusBar();
    }
  });

  // Add to subscriptions
  context.subscriptions.push(
    generateTokenCommand,
    configureCredentialsCommand,
    selectEnvironmentCommand,
    viewStoredTokensCommand,
    generateTokenFromTreeCommand,
    copyTokenFromTreeCommand,
    refreshEnvironmentsCommand,
    refreshTokensCommand,
    openConfigFromTreeCommand,
    viewAllEnvironmentsCommand,
    editEnvironmentFromTreeCommand,
    generateTokenFromTreeInlineCommand,
    exportEnvironmentsCommand,
    importEnvironmentsCommand,
    environmentsTreeView,
    tokensTreeView,
    onConfigurationChanged
  );

  // Show welcome message for first-time users
  const hasShownWelcome = context.globalState.get('hasShownWelcome', false);
  if (!hasShownWelcome) {
    vscode.window.showInformationMessage(
      'Welcome to OAuth Token Generator! Configure your OAuth credentials to get started.',
      'Configure Now',
      'Later'
    ).then(selection => {
      if (selection === 'Configure Now') {
        commandManager.configureCredentials();
      }
    });
    context.globalState.update('hasShownWelcome', true);
  }
}

export function deactivate() {
  if (statusBarManager) {
    statusBarManager.dispose();
  }
  if (environmentsTreeProvider) {
    environmentsTreeProvider.dispose();
  }
  if (tokensTreeProvider) {
    tokensTreeProvider.dispose();
  }
}