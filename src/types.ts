export type AuthMethod = 'body' | 'basic';
export type ContentType = 'application/json' | 'application/x-www-form-urlencoded';

export interface CustomHeader {
  key: string;
  value: string;
}

export interface CustomBodyField {
  key: string;
  value: string;
}

export interface OAuthCredentials {
  provider: string; // e.g., "Auth0", "Okta", "Custom"
  tokenEndpoint: string; // Full URL to the token endpoint
  clientId: string;
  clientSecret: string;
  audience?: string;
  scope?: string;
  // New optional fields (defaults ensure backward compatibility)
  authMethod?: AuthMethod; // defaults to 'body'
  contentType?: ContentType; // defaults to 'application/json'
  customHeaders?: CustomHeader[]; // defaults to []
  customBodyFields?: CustomBodyField[]; // defaults to []
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