# Auth0 Token Generator

A VS Code extension that generates bearer tokens for Auth0 clients using the client credentials flow.

## Features

- 🔐 **Secure Credential Storage**: Uses VS Code's built-in secure storage for Auth0 credentials
- 🌍 **Multi-Environment Support**: Configure and switch between different Auth0 environments (dev, staging, prod)
- ⚡ **Quick Token Generation**: Generate bearer tokens with a single command
- 📋 **Clipboard Integration**: Automatically copies generated tokens to clipboard
- 💾 **Token Caching**: Caches valid tokens to avoid unnecessary API calls
- 📊 **Status Bar Integration**: Shows current environment and provides quick access
- 🧪 **Credential Testing**: Test your Auth0 configuration before saving

## Getting Started

### 1. Install the Extension

Install the extension in vscode

1. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Select `Extensions: Install from VISX...`
3. Select the Provided Visx file
4. Refresh extensions 

### 2. Configure Auth0 Credentials

1. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Run `Auth0: Configure Credentials`
3. Fill in your Auth0 application details:
   - **Environment Name**: A friendly name (e.g., "dev", "staging", "prod")
   - **Domain**: Your Auth0 tenant domain (e.g., `your-tenant.auth0.com`)
   - **Client ID**: Your Auth0 application's client ID
   - **Client Secret**: Your Auth0 application's client secret
   - **Audience**: (Optional) The API identifier for your Auth0 API
   - **Scope**: (Optional) Space-separated list of scopes

### 3. Generate Bearer Tokens

Once configured, you can generate tokens using any of these methods:

- **Command Palette**: Run `Auth0: Generate Bearer Token`
- **Status Bar**: Click on the Auth0 status item in the bottom-right
- **Keyboard Shortcut**: Assign a custom shortcut to the generate token command

## Commands

| Command | Description |
|---------|-------------|
| `Auth0: Generate Bearer Token` | Generates a new bearer token for the current environment |
| `Auth0: Configure Credentials` | Opens the configuration panel to manage Auth0 credentials |
| `Auth0: Select Environment` | Switch between configured Auth0 environments |
| `Auth0: View Stored Tokens` | View and copy previously generated tokens |

## Requirements

- VS Code version 1.74.0 or higher
- Auth0 application configured with client credentials grant type
- Network access to your Auth0 tenant

## Security

- All sensitive credentials are stored using VS Code's secure storage API
- Tokens are cached locally but automatically removed when expired
- No credentials are logged or transmitted except to Auth0's token endpoint

## Configuration

The extension supports the following VS Code settings:

- `auth0TokenGenerator.defaultAudience`: Default audience for token requests
- `auth0TokenGenerator.tokenExpiryWarning`: Show warning when token expires in X seconds

## Troubleshooting

### "Invalid credentials" error
- Verify your Auth0 domain, client ID, and client secret
- Ensure your Auth0 application has the "Client Credentials" grant type enabled
- Check that the audience (if specified) exists in your Auth0 tenant

### "Network error" messages
- Check your internet connection
- Verify that your Auth0 domain is accessible
- Ensure no corporate firewall is blocking Auth0 requests

### Tokens not generating
- Use the "Test Connection" feature in the configuration panel
- Check the VS Code Developer Console for detailed error messages
- Verify your Auth0 application configuration

## License

MIT License - see LICENSE file for details.

## Contributions

Love this extension? [Star us]() and [buy me a coffee](https://buymeacoffee.com/hannahredmond) 

Want to make this extension even more awesome? [Send us your wish]().

Hate how it is working? [Raise an issue]().