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
        const statusCode = error.response?.status;
        const errorData = error.response?.data;
        const errorDescription = errorData?.error_description || errorData?.message;
        const errorType = errorData?.error || 'unknown_error';

        // Build detailed error message
        let message = `OAuth token request failed`;

        if (statusCode) {
          message += ` (HTTP ${statusCode})`;
        }

        if (errorType) {
          message += `\n• Error Type: ${errorType}`;
        }

        if (errorDescription) {
          message += `\n• Details: ${errorDescription}`;
        }

        // Add helpful hints based on status code
        if (statusCode === 401) {
          message += `\n\n💡 Troubleshooting Tips:`;
          message += `\n  - Check that your Client ID and Client Secret are correct`;
          message += `\n  - If using \${ENV_VAR} placeholders, verify environment variables are set`;
          message += `\n  - Create a .env.local file in your workspace root with your credentials`;
          message += `\n  - Verify the Authentication Method (Body vs Basic Auth)`;
          message += `\n  - Ensure credentials haven't expired`;
        } else if (statusCode === 403) {
          message += `\n\n💡 Troubleshooting Tips:`;
          message += `\n  - Check if the application has the required permissions`;
          message += `\n  - Verify the Audience value is correct`;
          message += `\n  - Ensure the application is enabled in your OAuth provider`;
        } else if (statusCode === 404) {
          message += `\n\n💡 Troubleshooting Tips:`;
          message += `\n  - Check that the Token Endpoint URL is correct`;
          message += `\n  - Verify the domain/tenant name in the URL`;
          message += `\n  - URL should end with /oauth/token or similar`;
        } else if (!statusCode && error.code === 'ENOTFOUND') {
          message = `Cannot reach OAuth server: ${error.message}`;
          message += `\n\n💡 Troubleshooting Tips:`;
          message += `\n  - Check your internet connection`;
          message += `\n  - Verify the Token Endpoint URL is correct`;
          message += `\n  - Check if you need a VPN or proxy`;
        }

        // Add request details for debugging
        message += `\n\n📋 Request Details:`;
        message += `\n  - Endpoint: ${tokenEndpoint}`;
        message += `\n  - Auth Method: ${authMethod}`;
        message += `\n  - Content Type: ${contentType}`;
        if (audience || credentialAudience) {
          message += `\n  - Audience: ${audience || credentialAudience}`;
        }

        throw new Error(message);
      }
      throw error;
    }
  }

  private substituteEnvVars(value: string): string {
    // Replace ${ENV_VAR_NAME} with process.env[ENV_VAR_NAME]
    const missingVars: string[] = [];
    const result = value.replace(/\$\{([^}]+)\}/g, (match, varName) => {
      const envValue = process.env[varName];
      if (!envValue) {
        missingVars.push(varName);
      }
      return envValue || match; // Fallback to original if not found
    });

    // Log warning if variables were not found (helps with debugging)
    if (missingVars.length > 0) {
      console.warn(`Environment variables not found: ${missingVars.join(', ')}`);
      console.warn('Make sure VSCode was launched from a terminal with these variables exported, or use the actual values directly.');
    }

    return result;
  }

  async validateCredentials(): Promise<boolean> {
    try {
      await this.generateToken();
      return true;
    } catch (error) {
      // Re-throw the error so we can show detailed message to user
      throw error;
    }
  }
}