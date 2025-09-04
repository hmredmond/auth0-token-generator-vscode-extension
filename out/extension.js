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
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const commands_1 = require("./commands");
const status_bar_1 = require("./status-bar");
let commandManager;
let statusBarManager;
function activate(context) {
    console.log('Auth0 Token Generator extension is now active!');
    // Initialize managers
    commandManager = new commands_1.CommandManager(context);
    statusBarManager = new status_bar_1.StatusBarManager(context);
    // Register commands
    const generateTokenCommand = vscode.commands.registerCommand('auth0-token-generator.generateToken', () => commandManager.generateToken());
    const configureCredentialsCommand = vscode.commands.registerCommand('auth0-token-generator.configureCredentials', () => commandManager.configureCredentials());
    const selectEnvironmentCommand = vscode.commands.registerCommand('auth0-token-generator.selectEnvironment', () => commandManager.selectEnvironment());
    const viewStoredTokensCommand = vscode.commands.registerCommand('auth0-token-generator.viewStoredTokens', () => commandManager.viewStoredTokens());
    // Register event listeners
    const onConfigurationChanged = vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('auth0TokenGenerator')) {
            statusBarManager.updateStatusBar();
        }
    });
    // Add to subscriptions
    context.subscriptions.push(generateTokenCommand, configureCredentialsCommand, selectEnvironmentCommand, viewStoredTokensCommand, onConfigurationChanged);
    // Show welcome message for first-time users
    const hasShownWelcome = context.globalState.get('hasShownWelcome', false);
    if (!hasShownWelcome) {
        vscode.window.showInformationMessage('Welcome to Auth0 Token Generator! Configure your credentials to get started.', 'Configure Now', 'Later').then(selection => {
            if (selection === 'Configure Now') {
                commandManager.configureCredentials();
            }
        });
        context.globalState.update('hasShownWelcome', true);
    }
}
exports.activate = activate;
function deactivate() {
    if (statusBarManager) {
        statusBarManager.dispose();
    }
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map