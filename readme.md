# OAuth Token Generator

A VS Code extension that generates bearer tokens for OAuth providers using the client credentials flow. Supports Auth0, Okta, Azure AD, and any custom OAuth provider.

## Features

- 🔐 **Secure Credential Storage**: Uses VS Code's built-in secure storage for OAuth credentials
- 🌍 **Multi-Provider Support**: Configure Auth0, Okta, Azure AD, or custom OAuth providers
- 🔄 **Multi-Environment Support**: Configure and switch between different environments (dev, staging, prod)
- ⚡ **Quick Token Generation**: Generate bearer tokens with a single command
- 📋 **Clipboard Integration**: Automatically copies generated tokens to clipboard
- 💾 **Token Caching**: Caches valid tokens to avoid unnecessary API calls
- 📊 **Status Bar Integration**: Shows current environment and provides quick access
- 🧪 **Credential Testing**: Test your OAuth configuration before saving

## Getting Started

### 1. Install the Extension

Install the extension in VS Code:

1. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Select `Extensions: Install from VSIX...`
3. Select the provided VSIX file
4. Reload VS Code

### 2. Configure OAuth Credentials

1. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Run `OAuth: Configure Credentials`
3. Fill in your OAuth application details:
   - **Environment Name**: A friendly name (e.g., "dev", "staging", "prod")
   - **OAuth Provider**: Select your provider (Auth0, Okta, Azure AD, or Custom)
   - **Token Endpoint**: The full URL to your OAuth token endpoint
   - **Client ID**: Your OAuth application's client ID
   - **Client Secret**: Your OAuth application's client secret
   - **Audience**: (Optional) The API identifier/resource for your OAuth API
   - **Scope**: (Optional) Space-separated list of scopes

#### Example Configurations

**Auth0:**
- Token Endpoint: `https://your-tenant.auth0.com/oauth/token`
- Audience: `https://your-api.example.com`

**Okta:**
- Token Endpoint: `https://your-domain.okta.com/oauth2/default/v1/token`
- Scope: `api:read api:write`

**Azure AD:**
- Token Endpoint: `https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/token`
- Scope: `https://graph.microsoft.com/.default`

### 3. Generate Bearer Tokens

Once configured, you can generate tokens using any of these methods:

- **Command Palette**: Run `OAuth: Generate Bearer Token`
- **Status Bar**: Click on the OAuth status item in the bottom-right
- **Keyboard Shortcut**: Assign a custom shortcut to the generate token command

## Commands

| Command | Description |
|---------|-------------|
| `OAuth: Generate Bearer Token` | Generates a new bearer token for the current environment |
| `OAuth: Configure Credentials` | Opens the configuration panel to manage OAuth credentials |
| `OAuth: Select Environment` | Switch between configured OAuth environments |
| `OAuth: View Stored Tokens` | View and copy previously generated tokens |

## Requirements

- VS Code version 1.74.0 or higher
- OAuth application configured with client credentials grant type
- Network access to your OAuth provider

## Security

- All sensitive credentials are stored using VS Code's secure storage API
- Tokens are cached locally but automatically removed when expired
- No credentials are logged or transmitted except to your configured OAuth token endpoint

## Configuration

The extension supports the following VS Code settings:

- `oauthTokenGenerator.defaultAudience`: Default audience for token requests
- `oauthTokenGenerator.tokenExpiryWarning`: Show warning when token expires in X seconds

## Troubleshooting

### "Invalid credentials" error
- Verify your token endpoint URL is correct and accessible
- Ensure your client ID and client secret are correct
- Check that your OAuth application has the "Client Credentials" grant type enabled
- Verify that the audience/scope (if specified) is valid for your provider

### "Network error" messages
- Check your internet connection
- Verify that your OAuth provider's domain is accessible
- Ensure no corporate firewall is blocking OAuth requests
- Check if the token endpoint URL is correct

### Tokens not generating
- Use the "Test Connection" feature in the configuration panel
- Check the VS Code Developer Console for detailed error messages (`Help > Toggle Developer Tools`)
- Verify your OAuth application configuration with your provider

## Supported OAuth Providers

This extension supports any OAuth 2.0 provider that implements the client credentials flow, including:

- **Auth0** - Identity platform for applications
- **Okta** - Enterprise identity management
- **Azure AD** - Microsoft Azure Active Directory
- **Custom** - Any OAuth 2.0 compliant provider

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed list of changes and version history.

## License

MIT License - see LICENSE file for details.

## Contributions

Love this extension? [Star us on GitHub](https://github.com/hmredmond/oauth-token-generator-vscode-extension) and [buy me a coffee](https://buymeacoffee.com/hannahredmond)

Want to make this extension even more awesome? [Send us your wish](https://github.com/hmredmond/oauth-token-generator-vscode-extension/issues/new?labels=enhancement).

Hate how it is working? [Raise an issue](https://github.com/hmredmond/oauth-token-generator-vscode-extension/issues/new?labels=bug).
