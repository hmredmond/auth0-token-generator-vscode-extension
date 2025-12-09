import axios from 'axios';
import { OAuthCredentials, TokenResponse } from './types';

export class OAuthClient {
  private credentials: OAuthCredentials;

  constructor(credentials: OAuthCredentials) {
    this.credentials = credentials;
  }

  async generateToken(audience?: string, scope?: string): Promise<TokenResponse> {
    const tokenEndpoint = this.credentials.tokenEndpoint;

    const payload = {
      client_id: this.credentials.clientId,
      client_secret: this.credentials.clientSecret,
      audience: audience || this.credentials.audience,
      grant_type: 'client_credentials',
      scope: scope || this.credentials.scope || ''
    };

    try {
      const response = await axios.post(tokenEndpoint, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

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

  async validateCredentials(): Promise<boolean> {
    try {
      await this.generateToken();
      return true;
    } catch {
      return false;
    }
  }
}