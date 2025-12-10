import axios from 'axios';
import { OAuthCredentials, TokenResponse } from './types';

export class OAuthClient {
  private readonly credentials: OAuthCredentials;

  constructor(credentials: OAuthCredentials) {
    this.credentials = credentials;
  }

  async generateToken(audience?: string, scope?: string): Promise<TokenResponse> {
    // Substitute environment variables in all credential fields
    const tokenEndpoint = this.substituteEnvVars(this.credentials.tokenEndpoint);
    const clientId = this.substituteEnvVars(this.credentials.clientId);
    const clientSecret = this.substituteEnvVars(this.credentials.clientSecret);
    const credentialAudience = this.credentials.audience ? this.substituteEnvVars(this.credentials.audience) : undefined;
    const credentialScope = this.credentials.scope ? this.substituteEnvVars(this.credentials.scope) : undefined;

    const authMethod = this.credentials.authMethod || 'body';
    const contentType = this.credentials.contentType || 'application/json';
    const customHeaders = this.credentials.customHeaders || [];

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': contentType
    };

    // Add authorization header for Basic Auth
    if (authMethod === 'basic') {
      const basicAuth = Buffer.from(
        `${clientId}:${clientSecret}`
      ).toString('base64');
      headers['Authorization'] = `Basic ${basicAuth}`;
    }

    // Add custom headers with placeholder substitution
    for (const header of customHeaders) {
      headers[header.key] = this.substituteEnvVars(header.value);
    }

    // Build payload based on auth method
    let payload: any;
    if (authMethod === 'body') {
      // Original JSON body approach
      payload = {
        client_id: clientId,
        client_secret: clientSecret,
        audience: audience || credentialAudience,
        grant_type: 'client_credentials',
        scope: scope || credentialScope || ''
      };
    } else {
      // Basic Auth approach - credentials NOT in body
      payload = {
        grant_type: 'client_credentials',
        scope: scope || credentialScope || ''
      };

      // Only add audience if provided
      if (audience || credentialAudience) {
        payload.audience = audience || credentialAudience;
      }
    }

    // Convert payload based on content type
    let requestData: any;
    if (contentType === 'application/x-www-form-urlencoded') {
      requestData = new URLSearchParams(payload).toString();
    } else {
      requestData = payload;
    }

    try {
      const response = await axios.post(tokenEndpoint, requestData, { headers });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error_description ||
                       error.response?.data?.error ||
                       error.message;
        throw new Error(`OAuth token generation failed: ${message}`);
      }
      throw error;
    }
  }

  private substituteEnvVars(value: string): string {
    // Replace ${ENV_VAR_NAME} with process.env[ENV_VAR_NAME]
    return value.replace(/\$\{([^}]+)\}/g, (match, varName) => {
      return process.env[varName] || match; // Fallback to original if not found
    });
  }

  async validateCredentials(): Promise<boolean> {
    try {
      await this.generateToken();
      return true;
    } catch {
      return false;
    }
  }
}