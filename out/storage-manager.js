"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageManager = void 0;
class StorageManager {
    constructor(context) {
        this.context = context;
    }
    async saveEnvironment(environment) {
        const environments = await this.getEnvironments();
        const existingIndex = environments.findIndex(env => env.name === environment.name);
        if (existingIndex >= 0) {
            environments[existingIndex] = environment;
        }
        else {
            environments.push(environment);
        }
        // Store credentials securely
        await this.context.secrets.store(`${StorageManager.ENVIRONMENTS_KEY}.${environment.name}`, JSON.stringify(environment.credentials));
        // Store environment names in global state
        const envNames = environments.map(env => env.name);
        await this.context.globalState.update(StorageManager.ENVIRONMENTS_KEY, envNames);
    }
    async getEnvironments() {
        const envNames = this.context.globalState.get(StorageManager.ENVIRONMENTS_KEY, []);
        const environments = [];
        for (const name of envNames) {
            const credentialsJson = await this.context.secrets.get(`${StorageManager.ENVIRONMENTS_KEY}.${name}`);
            if (credentialsJson) {
                try {
                    const credentials = JSON.parse(credentialsJson);
                    environments.push({ name, credentials });
                }
                catch (error) {
                    console.error(`Failed to parse credentials for environment ${name}:`, error);
                }
            }
        }
        return environments;
    }
    async getCurrentEnvironment() {
        return this.context.globalState.get(StorageManager.CURRENT_ENV_KEY);
    }
    async setCurrentEnvironment(environmentName) {
        await this.context.globalState.update(StorageManager.CURRENT_ENV_KEY, environmentName);
    }
    async storeToken(token) {
        const tokens = await this.getStoredTokens();
        const key = `${token.environment}-${token.audience}-${token.scope}`;
        tokens[key] = token;
        await this.context.globalState.update(StorageManager.TOKENS_KEY, tokens);
    }
    async getStoredTokens() {
        return this.context.globalState.get(StorageManager.TOKENS_KEY, {});
    }
    async removeExpiredTokens() {
        const tokens = await this.getStoredTokens();
        const now = Date.now();
        const validTokens = {};
        Object.entries(tokens).forEach(([key, token]) => {
            if (token.expiresAt > now) {
                validTokens[key] = token;
            }
        });
        await this.context.globalState.update(StorageManager.TOKENS_KEY, validTokens);
    }
}
exports.StorageManager = StorageManager;
StorageManager.ENVIRONMENTS_KEY = 'auth0.environments';
StorageManager.CURRENT_ENV_KEY = 'auth0.currentEnvironment';
StorageManager.TOKENS_KEY = 'auth0.storedTokens';
//# sourceMappingURL=storage-manager.js.map