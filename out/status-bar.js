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
exports.StatusBarManager = void 0;
const vscode = __importStar(require("vscode"));
const storage_manager_1 = require("./storage-manager");
class StatusBarManager {
    constructor(context) {
        this.storageManager = new storage_manager_1.StorageManager(context);
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.statusBarItem.command = 'auth0-token-generator.generateToken';
        context.subscriptions.push(this.statusBarItem);
        this.updateStatusBar();
    }
    async updateStatusBar() {
        const currentEnv = await this.storageManager.getCurrentEnvironment();
        if (currentEnv) {
            this.statusBarItem.text = `$(key) Auth0: ${currentEnv}`;
            this.statusBarItem.tooltip = `Current Auth0 environment: ${currentEnv}\nClick to generate bearer token`;
        }
        else {
            this.statusBarItem.text = `$(key) Auth0: Not configured`;
            this.statusBarItem.tooltip = 'Click to configure Auth0 credentials';
            this.statusBarItem.command = 'auth0-token-generator.configureCredentials';
        }
        this.statusBarItem.show();
    }
    dispose() {
        this.statusBarItem.dispose();
    }
}
exports.StatusBarManager = StatusBarManager;
//# sourceMappingURL=status-bar.js.map