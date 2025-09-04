export interface Auth0Credentials {
  domain: string;
  clientId: string;
  clientSecret: string;
  audience?: string;
  scope?: string;
}

export interface Auth0Environment {
  name: string;
  credentials: Auth0Credentials;
}

export interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

export interface StoredToken {
  token: string;
  expiresAt: number;
  environment: string;
  audience: string;
  scope: string;
}