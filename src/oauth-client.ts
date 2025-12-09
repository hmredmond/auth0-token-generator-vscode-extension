import axios from 'axios';
import { OAuthCredentials, TokenResponse } from './types';

export class OAuthClient {
  private credentials: OAuthCredentials;

  constructor(credentials: OAuthCredentials) {
    this.credentials = credentials;
  }

  async generateToken(audience?: string, scope?: string): Promise<TokenResponse> {
    const tokenEndpoint = this.credentials.tokenEndpoint;
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
        `${this.credentials.clientId}:${this.credentials.clientSecret}`
      ).toString('base64');
      headers['Authorization'] = `Basic ${basicAuth}`;
    }

    // Add custom headers with placeholder substitution
    for (const header of customHeaders) {
      headers[header.key] = this.substituteHeaderValue(header.value);
    }

    // Build payload based on auth method
    let payload: any;
    if (authMethod === 'body') {
      // Original JSON body approach
      payload = {
        client_id: this.credentials.clientId,
        client_secret: this.credentials.clientSecret,
        audience: audience || this.credentials.audience,
        grant_type: 'client_credentials',
        scope: scope || this.credentials.scope || ''
      };
    } else {
      // Basic Auth approach - credentials NOT in body
      payload = {
        grant_type: 'client_credentials',
        scope: scope || this.credentials.scope || ''
      };

      // Only add audience if provided
      if (audience || this.credentials.audience) {
        payload.audience = audience || this.credentials.audience;
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

  private substituteHeaderValue(value: string): string {
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