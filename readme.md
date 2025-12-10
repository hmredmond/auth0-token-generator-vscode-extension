# OAuth Token Generator

A VS Code extension that generates bearer tokens for OAuth providers using the client credentials flow. Supports Auth0, Okta, Azure AD, and any custom OAuth provider.

**👉 [Complete Getting Started Guide](GETTING_STARTED.md)** - Step-by-step walkthrough with examples

## Features

- 🔐 **Secure Credential Storage**: Uses VS Code's built-in secure storage for OAuth credentials
- 🌍 **Multi-Provider Support**: Configure Auth0, Okta, Azure AD, or custom OAuth providers
- 🔄 **Multi-Environment Support**: Configure and switch between different environments (dev, staging, prod)
- 📱 **Sidebar Panel Integration**: View and manage environments and tokens from the left-hand activity bar
- 🎨 **Responsive Design**: UI adapts seamlessly to narrow panels and different screen sizes
- 🔑 **Multiple Auth Methods**: Supports both request body credentials and Basic Authentication headers
- 🎯 **Custom Headers**: Add custom HTTP headers to token requests with environment variable support
- 🛠️ **Custom Body Fields**: Fully customize request body structure for non-standard OAuth APIs
- ⚡ **Quick Token Generation**: Generate bearer tokens with a single command or from the sidebar
- 📋 **Clipboard Integration**: Automatically copies generated tokens to clipboard
- 💾 **Token Caching**: Caches valid tokens to avoid unnecessary API calls
- 📊 **Status Bar Integration**: Shows current environment and provides quick access
- ✏️ **Easy Management**: Edit, delete, and manage configurations with intuitive icon buttons
- 🧪 **Credential Testing**: Test your OAuth configuration before saving
- 🌳 **Tree View**: Visual organization of environments and tokens in the sidebar

## Getting Started

📚 **New to this extension?** Check out our [comprehensive Getting Started guide](GETTING_STARTED.md) with step-by-step examples and sample configurations!

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
   - **Authentication Method**: Choose how credentials are sent:
     - **Credentials in Request Body** (Default) - Standard OAuth 2.0 flow
     - **Basic Authentication Header** - For providers requiring HTTP Basic Auth
       - *Note: When Basic Auth is selected, the form fields automatically rename to "Username" and "Password" to better reflect their usage*
   - **Content Type**: Select request format (JSON or Form Encoded)
   - **Custom Headers**: (Optional) Add custom HTTP headers with dynamic values

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

**Custom Provider with Basic Auth:**
- Token Endpoint: `https://api.example.com/oauth2/token`
- Authentication Method: `Basic Authentication Header`
- Content Type: `Form Encoded`
- Custom Headers:
  - `X-EnterpriseId`: `your-enterprise-id`
  - `X-StoreId`: `your-store-id`
  - `X-Context`: `${TENANT_CONTEXT}` (uses environment variable)

### 3. Using the Sidebar Panel

The extension adds a sidebar panel to the left-hand activity bar where you can:

- **View all configured environments** - See your dev, staging, and prod configurations at a glance
- **View cached tokens** - Check which tokens are stored and when they expire
- **Quick actions** - Edit, generate tokens, and manage environments with intuitive buttons
- **Toolbar actions** - Import, export, refresh, and add new environments

**To access the sidebar:**
1. Look for the key icon (🔑) in the left-hand activity bar
2. Click it to open the OAuth Token Generator panel
3. You'll see two sections:
   - **Environments**: All your configured OAuth environments
   - **Generated Tokens**: Currently cached tokens with expiry times

**Working with environments in the sidebar:**
- **Click an environment item** → Opens the configuration editor for that environment
- **Click the 🔑 key icon** (on hover) → Generates and copies a token to clipboard
- **Toolbar buttons** (top of panel):
  - **📋 List icon** - View all environments in the main configuration panel
  - **📥 Import** - Import environments from a JSON file
  - **💾 Export** - Export all environments to a JSON file
  - **🔄 Refresh** - Refresh the environment list
  - **➕ Add** - Add a new environment

**Working with tokens:**
- Click any cached token to copy it to clipboard
- Tokens show their expiry time and automatically refresh when expired
- The extension caches tokens to reduce API calls

### 4. Generate Bearer Tokens

Once configured, you can generate tokens using any of these methods:

- **Sidebar Panel**: Click any environment in the OAuth sidebar panel (fastest!)
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
| `OAuth: Refresh Environments` | Refreshes the environments tree view in the sidebar |
| `OAuth: Refresh Tokens` | Refreshes the tokens tree view in the sidebar |

## Requirements

- VS Code version 1.74.0 or higher
- OAuth application configured with client credentials grant type
- Network access to your OAuth provider

## Security

- All sensitive credentials are stored using VS Code's secure storage API
- Tokens are cached locally but automatically removed when expired
- No credentials are logged or transmitted except to your configured OAuth token endpoint

## Advanced Features

### Authentication Methods

The extension supports two authentication methods for OAuth token requests:

**1. Credentials in Request Body (Default)**
- Standard OAuth 2.0 client credentials flow
- Sends `client_id` and `client_secret` in the request body
- Most common method used by providers like Auth0, Okta, and Azure AD

**2. Basic Authentication Header**
- Encodes credentials as HTTP Basic Authentication
- Sends credentials in the `Authorization: Basic <base64>` header
- Required by some custom OAuth providers

**Dynamic Form Labels:**
When you select "Basic Authentication Header" as the authentication method, the form automatically updates the field labels:
- "Client ID" → "Username"
- "Client Secret" → "Password"

This helps clarify that in Basic Auth mode, these fields represent the username and password credentials rather than OAuth client credentials. The underlying functionality remains the same - the values are Base64-encoded and sent in the Authorization header.

### Custom Body Fields

For non-standard OAuth implementations or custom authentication APIs, you can completely customize the request body structure using **Custom Body Fields**.

**When to use Custom Body Fields:**
- Your API uses different field names (e.g., `key` instead of `client_id`)
- Your API requires additional fields not in standard OAuth (e.g., `groupHash`, `tenantId`)
- You're working with a proprietary authentication API that doesn't follow OAuth standards

**How it works:**
When custom body fields are defined, they **completely replace** the standard OAuth body structure. The extension will send exactly the fields you specify, giving you full control over the request body.

**Example: Custom Authentication API**

Your API expects this body structure:
```json
{
  "key": "your-api-key",
  "secret": "your-api-secret",
  "audience": "https://api.example.com",
  "groupHash": "{tenant:group}"
}
```

Configure custom body fields:
1. Field: `key`, Value: `${API_KEY}`
2. Field: `secret`, Value: `${API_SECRET}`
3. Field: `audience`, Value: `https://api.example.com`
4. Field: `groupHash`, Value: `{tenant:group}`

The extension will send exactly these fields with environment variable substitution applied.

**Import/Export Support:**
Custom body fields are included when you export/import environments, making it easy to share configurations across teams.

### Environment Variables Support

You can use environment variables in **any credential field** using the `${VARIABLE_NAME}` syntax. This is especially useful for keeping secrets out of your stored configurations.

**Supported fields:**
- Token Endpoint URL
- Client ID
- Client Secret
- Custom Body Field Values
- Audience
- Scope
- Custom Header Values

**Examples:**

```json
{
  "tokenEndpoint": "${AUTH0_TOKEN_ENDPOINT}",
  "clientId": "${AUTH0_CLIENT_ID}",
  "clientSecret": "${AUTH0_CLIENT_SECRET}",
  "audience": "${AUTH0_AUDIENCE}",
  "customHeaders": [
    { "key": "X-Context", "value": "${TENANT_CONTEXT}" }
  ]
}
```

The extension will substitute `${VARIABLE_NAME}` with the value from `process.env.VARIABLE_NAME` at runtime. If a variable is not found, the placeholder text is used as-is.

**Setting environment variables:**

**Option 1: Using .env files (Recommended)**

Create a `.env` or `.env.local` file in your workspace root:

```bash
# .env.local
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-secret
AUTH0_TOKEN_ENDPOINT=https://your-tenant.auth0.com/oauth/token
AUTH0_AUDIENCE=https://api.example.com
```

The extension will automatically load environment variables from these files when it activates:
- `.env` - Base environment variables
- `.env.local` - Local overrides (add to `.gitignore`)
- `.env.development` - Development-specific variables
- `.env.production` - Production-specific variables

**Option 2: Launch VSCode from terminal**

macOS/Linux:
```bash
export AUTH0_CLIENT_ID="your-client-id"
export AUTH0_CLIENT_SECRET="your-secret"
export AUTH0_TOKEN_ENDPOINT="https://your-tenant.auth0.com/oauth/token"
code  # Launch VS Code from terminal to inherit environment
```

Windows:
```cmd
set AUTH0_CLIENT_ID=your-client-id
set AUTH0_CLIENT_SECRET=your-secret
set AUTH0_TOKEN_ENDPOINT=https://your-tenant.auth0.com/oauth/token
code
```

### Managing Existing Configurations

The configuration panel provides easy management of all your OAuth environments:

**To edit an environment:**
- **From sidebar**: Click on the environment item in the OAuth sidebar panel
- **From configuration panel**:
  1. Open `OAuth: Configure Credentials`
  2. Click anywhere on the environment item you want to edit
  3. The form will populate with existing values
  4. Make your changes and click **Save Credentials**

**To rename an environment:**
1. Edit the environment (using either method above)
2. Change the "Environment Name" field
3. Click **Save Credentials**
4. The environment will be renamed with a confirmation message

**To delete an environment:**
- **From configuration panel**:
  1. Open `OAuth: Configure Credentials`
  2. Click the **× (Delete)** button on the environment item
  3. Confirm the deletion when prompted

**To generate a token for a specific environment:**
- **From sidebar**: Click the **🔑 (key)** icon that appears when you hover over an environment
- **From configuration panel**: Click the **↻ (refresh)** button next to any environment
- The token will be generated and automatically copied to your clipboard

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

## Recent Updates (v2.0.0)

- 🌳 **NEW**: Sidebar panel with tree views for environments and tokens
- 📱 **NEW**: Responsive design that adapts to narrow panels and different screen sizes
- ⚡ **NEW**: One-click token generation from the sidebar
- 🔄 **NEW**: Real-time view of cached tokens with expiry times
- 📊 **NEW**: Visual organization of environments with current environment highlighting
- 🎨 Improved webview responsiveness with media queries
- ✨ Enhanced user experience with sidebar integration

**Previous Updates (v1.9.0)**
- ✨ Improved configuration UI with compact icon buttons
- 🗑️ Added ability to delete environments directly from the configuration panel
- 🎯 Enhanced button interactions with custom confirmation dialogs
- 🐛 Fixed environment deletion and list refresh functionality
- 💅 Cleaner, more modern interface design

See [CHANGELOG.md](CHANGELOG.md) for a complete version history.

## License

MIT License - see LICENSE file for details.

## Contributions

Love this extension? [Star us on GitHub](https://github.com/hmredmond/oauth-token-generator-vscode-extension) and [buy me a coffee](https://buymeacoffee.com/hannahredmond)

Want to make this extension even more awesome? [Send us your wish](https://github.com/hmredmond/oauth-token-generator-vscode-extension/issues/new?labels=enhancement).

Hate how it is working? [Raise an issue](https://github.com/hmredmond/oauth-token-generator-vscode-extension/issues/new?labels=bug).
