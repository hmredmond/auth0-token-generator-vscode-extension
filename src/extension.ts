import * as vscode from 'vscode';
import { CommandManager } from './commands';
import { StatusBarManager } from './status-bar';

let commandManager: CommandManager;
let statusBarManager: StatusBarManager;

export function activate(context: vscode.ExtensionContext) {
  console.log('Auth0 Token Generator extension is now active!');

  // Initialize managers
  commandManager = new CommandManager(context);
  statusBarManager = new StatusBarManager(context);

  // Register commands
  const generateTokenCommand = vscode.commands.registerCommand(
    'auth0-token-generator.generateToken',
    () => commandManager.generateToken()
  );

  const configureCredentialsCommand = vscode.commands.registerCommand(
    'auth0-token-generator.configureCredentials',
    () => commandManager.configureCredentials()
  );

  const selectEnvironmentCommand = vscode.commands.registerCommand(
    'auth0-token-generator.selectEnvironment',
    () => commandManager.selectEnvironment()
  );

  const viewStoredTokensCommand = vscode.commands.registerCommand(
    'auth0-token-generator.viewStoredTokens',
    () => commandManager.viewStoredTokens()
  );

  // Register event listeners
  const onConfigurationChanged = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('auth0TokenGenerator')) {
      statusBarManager.updateStatusBar();
    }
  });

  // Add to subscriptions
  context.subscriptions.push(
    generateTokenCommand,
    configureCredentialsCommand,
    selectEnvironmentCommand,
    viewStoredTokensCommand,
    onConfigurationChanged
  );

  // Show welcome message for first-time users
  const hasShownWelcome = context.globalState.get('hasShownWelcome', false);
  if (!hasShownWelcome) {
    vscode.window.showInformationMessage(
      'Welcome to Auth0 Token Generator! Configure your credentials to get started.',
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
}