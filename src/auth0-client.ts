import axios from 'axios';
import { Auth0Credentials, TokenResponse } from './types';

export class Auth0Client {
  private credentials: Auth0Credentials;

  constructor(credentials: Auth0Credentials) {
    this.credentials = credentials;
  }

  async generateToken(audience?: string, scope?: string): Promise<TokenResponse> {
    const tokenEndpoint = `https://${this.credentials.domain}/oauth/token`;
    
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
        throw new Error(`Auth0 token generation failed: ${message}`);
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