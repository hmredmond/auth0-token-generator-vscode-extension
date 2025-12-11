import * as vscode from 'vscode';
import { OAuthEnvironment, StoredToken } from './types';

export class StorageManager {
  private context: vscode.ExtensionContext;
  private static readonly ENVIRONMENTS_KEY = 'oauth.environments';
  private static readonly CURRENT_ENV_KEY = 'oauth.currentEnvironment';
  private static readonly TOKENS_KEY = 'oauth.storedTokens';

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  async saveEnvironment(environment: OAuthEnvironment): Promise<void> {
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

  async getEnvironments(): Promise<OAuthEnvironment[]> {
    const envNames = this.context.globalState.get<string[]>(StorageManager.ENVIRONMENTS_KEY, []);
    const environments: OAuthEnvironment[] = [];

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

  async deleteEnvironment(environmentName: string): Promise<void> {
    const envNames = this.context.globalState.get<string[]>(StorageManager.ENVIRONMENTS_KEY, []);
    const updatedEnvNames = envNames.filter(name => name !== environmentName);

    // Remove credentials from secrets
    await this.context.secrets.delete(`${StorageManager.ENVIRONMENTS_KEY}.${environmentName}`);

    // Update environment names in global state
    await this.context.globalState.update(StorageManager.ENVIRONMENTS_KEY, updatedEnvNames);

    // If this was the current environment, clear it
    const currentEnv = await this.getCurrentEnvironment();
    if (currentEnv === environmentName) {
      await this.context.globalState.update(StorageManager.CURRENT_ENV_KEY, undefined);
    }

    // Remove any tokens associated with this environment
    const tokens = await this.getStoredTokens();
    const updatedTokens: Record<string, StoredToken> = {};
    Object.entries(tokens).forEach(([key, token]) => {
      if (token.environment !== environmentName) {
        updatedTokens[key] = token;
      }
    });
    await this.context.globalState.update(StorageManager.TOKENS_KEY, updatedTokens);
  }

  async exportEnvironments(): Promise<string> {
    const environments = await this.getEnvironments();

    // Create a sanitized version with secrets masked (only if not empty)
    const sanitizedEnvironments = environments.map(env => ({
      ...env,
      credentials: {
        ...env.credentials,
        clientSecret: env.credentials.clientSecret ? '*****' : ''
      }
    }));

    return JSON.stringify(sanitizedEnvironments, null, 2);
  }

  async importEnvironments(jsonData: string, overwrite: boolean = false): Promise<{ imported: number; skipped: number }> {
    try {
      const importedEnvironments = JSON.parse(jsonData) as OAuthEnvironment[];

      if (!Array.isArray(importedEnvironments)) {
        throw new Error('Invalid format: Expected an array of environments');
      }

      const existingEnvironments = await this.getEnvironments();
      const existingNames = new Set(existingEnvironments.map(env => env.name));

      let imported = 0;
      let skipped = 0;

      for (const env of importedEnvironments) {
        if (!env.name || !env.credentials) {
          skipped++;
          continue;
        }

        if (existingNames.has(env.name) && !overwrite) {
          skipped++;
          continue;
        }

        await this.saveEnvironment(env);
        imported++;
      }

      return { imported, skipped };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to import environments: ${error.message}`);
      }
      throw new Error('Failed to import environments: Unknown error');
    }
  }
}