export interface OAuthCredentials {
  provider: string; // e.g., "Auth0", "Okta", "Custom"
  tokenEndpoint: string; // Full URL to the token endpoint
  clientId: string;
  clientSecret: string;
  audience?: string;
  scope?: string;
}

export interface OAuthEnvironment {
  name: string;
  credentials: OAuthCredentials;
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