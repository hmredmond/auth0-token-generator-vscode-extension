import * as vscode from 'vscode';
import { Auth0Environment, StoredToken } from './types';

export class StorageManager {
  private context: vscode.ExtensionContext;
  private static readonly ENVIRONMENTS_KEY = 'auth0.environments';
  private static readonly CURRENT_ENV_KEY = 'auth0.currentEnvironment';
  private static readonly TOKENS_KEY = 'auth0.storedTokens';

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  async saveEnvironment(environment: Auth0Environment): Promise<void> {
    const environments = await this.getEnvironments();
    const existingIndex = environments.findIndex(env => env.name === environment.name);
    
    if (existingIndex >= 0) {
      environments[existingIndex] = environment;
    } else {
      environments.push(environment);
    }

    // Store credentials securely
    await this.context.secrets.store(
      `${StorageManager.ENVIRONMENTS_KEY}.${environment.name}`,
      JSON.stringify(environment.credentials)
    );

    // Store environment names in global state
    const envNames = environments.map(env => env.name);
    await this.context.globalState.update(StorageManager.ENVIRONMENTS_KEY, envNames);
  }

  async getEnvironments(): Promise<Auth0Environment[]> {
    const envNames = this.context.globalState.get<string[]>(StorageManager.ENVIRONMENTS_KEY, []);
    const environments: Auth0Environment[] = [];

    for (const name of envNames) {
      const credentialsJson = await this.context.secrets.get(`${StorageManager.ENVIRONMENTS_KEY}.${name}`);
      if (credentialsJson) {
        try {
          const credentials = JSON.parse(credentialsJson);
          environments.push({ name, credentials });
        } catch (error) {
          console.error(`Failed to parse credentials for environment ${name}:`, error);
        }
      }
    }

    return environments;
  }

  async getCurrentEnvironment(): Promise<string | undefined> {
    return this.context.globalState.get<string>(StorageManager.CURRENT_ENV_KEY);
  }

  async setCurrentEnvironment(environmentName: string): Promise<void> {
    await this.context.globalState.update(StorageManager.CURRENT_ENV_KEY, environmentName);
  }

  async storeToken(token: StoredToken): Promise<void> {
    const tokens = await this.getStoredTokens();
    const key = `${token.environment}-${token.audience}-${token.scope}`;
    tokens[key] = token;
    
    await this.context.globalState.update(StorageManager.TOKENS_KEY, tokens);
  }

  async getStoredTokens(): Promise<Record<string, StoredToken>> {
    return this.context.globalState.get<Record<string, StoredToken>>(StorageManager.TOKENS_KEY, {});
  }

  async removeExpiredTokens(): Promise<void> {
    const tokens = await this.getStoredTokens();
    const now = Date.now();
    const validTokens: Record<string, StoredToken> = {};

    Object.entries(tokens).forEach(([key, token]) => {
      if (token.expiresAt > now) {
        validTokens[key] = token;
      }
    });

    await this.context.globalState.update(StorageManager.TOKENS_KEY, validTokens);
  }
}