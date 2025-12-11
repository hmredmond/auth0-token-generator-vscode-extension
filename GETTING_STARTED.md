# Getting Started with OAuth Token Generator

This guide will walk you through setting up and using the OAuth Token Generator extension with practical examples and sample configurations.

## What is this extension for?

The OAuth Token Generator is designed for developers who need to frequently generate OAuth bearer tokens for API testing, development, or integration work. Instead of manually making curl requests or using external tools like Postman, you can generate tokens directly from VS Code and have them automatically copied to your clipboard.

**Common use cases:**
- Testing authenticated API endpoints during development
- Working with multiple environments (dev, staging, production)
- Integrating with Auth0, Okta, Azure AD, or custom OAuth providers
- Quickly switching between different API credentials

---

## Initial Setup: Your First Environment

Let's walk through setting up your first OAuth environment with a practical example.

### Example Scenario

You're developing an API that uses Auth0 for authentication. You have:
- **Environment**: Development
- **Auth0 Domain**: `mycompany-dev.auth0.com`
- **Client ID**: `abc123xyz456demo`
- **Client Secret**: `secretkey789demo`
- **API Identifier**: `https://api.mycompany.com`

### Step-by-Step Configuration

1. **Open the Configuration Panel**
   - Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
   - Type: `OAuth: Configure Credentials`
   - Press Enter

2. **Click "+ Add New Environment"**

3. **Fill in the Form:**

   ```
   Environment Name: Development
   OAuth Provider: Auth0
   Token Endpoint: https://mycompany-dev.auth0.com/oauth/token
   Client ID: abc123xyz456demo
   Client Secret: secretkey789demo
   Audience: https://api.mycompany.com
   Scope: (leave empty or add: read:users write:users)
   Authentication Method: Credentials in Request Body (Default)
   Content Type: JSON (application/json)
   ```

4. **Click "Test Connection"**
   - This verifies your credentials work before saving
   - You should see: ✓ Credentials are valid!

5. **Click "Save Credentials"**
   - Your credentials are now saved securely
   - The environment appears in the "Configured Environments" list

---

## Working with Multiple Environments

### When to use multiple environments:

- **Development**: Testing against your local or dev API
- **Staging**: Integration testing before production
- **Production**: Real customer data (use carefully!)
- **Different APIs**: Separate credentials for different services

### Example: Adding Staging Environment

Let's add a staging environment to complement our development setup:

1. Click "+ Add New Environment" again
2. Fill in staging credentials:
   ```
   Environment Name: Staging
   OAuth Provider: Auth0
   Token Endpoint: https://mycompany-staging.auth0.com/oauth/token
   Client ID: xyz789abc123staging
   Client Secret: stagingsecret456
   Audience: https://api-staging.mycompany.com
   Scope: read:users write:users
   ```
3. Test and Save

Now you have two environments configured!

---

## Using the Sidebar Panel (NEW!)

### The Fastest Way to Work with Tokens

The extension now includes a dedicated sidebar panel for quick access to environments and tokens.

**Opening the Sidebar:**
1. Look for the **key icon (🔑)** in the left-hand activity bar
2. Click it to open the OAuth Token Generator panel

**What you'll see:**

**📁 Environments Section**
- Lists all your configured OAuth environments
- Current environment is highlighted with a green icon
- Click any environment to instantly generate a token
- **Toolbar buttons:**
  - **List icon** - View all environments in the main configuration panel
  - **Import icon** - Import environments from a JSON file
  - **Save icon** - Export all environments to a JSON file
  - **Refresh icon** - Refresh the environment list
  - **Add icon** - Add a new environment

**🔐 Generated Tokens Section**
- Shows all cached tokens
- Displays expiry time for each token (e.g., "Expires in 25m")
- Click any token to copy it to clipboard
- Automatically updates as tokens expire
- **Toolbar button:**
  - **Refresh icon** - Refresh the token list

**Example Workflow:**
```
1. Open sidebar (click 🔑 icon)
2. See all environments at a glance
3. Click "Development" → Token generated and copied!
4. Switch to "Staging" → Click it → New token copied!
5. Check cached tokens in the "Generated Tokens" section
```

**Why use the sidebar?**
- ✓ Visual overview of all environments
- ✓ One-click token generation (no command palette needed)
- ✓ See token expiry times at a glance
- ✓ Works great in narrow panels (responsive design)
- ✓ Always accessible from the activity bar

---

## Generating Tokens

### Method 1: Sidebar Panel (NEW - Recommended!)

**When to use:** Quick daily token generation (fastest method!)

1. Click the **🔑** icon in the left activity bar
2. Click any environment in the "Environments" list
3. Token is generated and copied to clipboard
4. Paste it wherever you need (Postman, curl, etc.)

**Pro tip:** Keep the sidebar open while developing!

### Method 2: Quick Generate from Command Palette

**When to use:** You want to use keyboard shortcuts or the current environment

1. Press `Ctrl+Shift+P` / `Cmd+Shift+P`
2. Type: `OAuth: Generate Bearer Token`
3. Press Enter
4. Token is generated and copied to clipboard

**Pro tip:** Assign a keyboard shortcut for even faster access!
- Go to: File > Preferences > Keyboard Shortcuts
- Search for: `OAuth: Generate Bearer Token`
- Assign something like `Ctrl+Alt+T`

### Method 3: Generate from Configuration Panel

**When to use:** You're already in the configuration panel editing credentials

1. Open `OAuth: Configure Credentials`
2. Find the environment you want
3. Click the **↻** (Get Token) icon button
4. Token is generated and copied to clipboard

### Method 4: Status Bar (Quick Switch & Generate)

**When to use:** You frequently switch between environments

1. Look at the bottom-right of VS Code
2. You'll see the current environment name
3. Click it to switch environments or generate a token

---

## Token Caching

### How it works:

The extension automatically caches valid tokens to avoid unnecessary API calls. This is great for:
- Reducing API quota usage
- Faster token retrieval
- Less network traffic

**Example scenario:**
```
10:00 AM - Generate token (API call made, token expires at 10:30 AM)
10:05 AM - Request token again (cached token returned, no API call)
10:31 AM - Request token again (cached token expired, new API call made)
```

**When cache is invalidated:**
- Token expires (checked automatically)
- You generate a token with different audience/scope
- You restart VS Code

---

## Using Environment Variables

### Overview

**All credential fields** support environment variable substitution using the `${VARIABLE_NAME}` syntax. This is particularly useful for:
- Keeping secrets out of stored configurations
- Sharing configurations between team members
- Managing credentials across different machines
- Improving security by storing secrets in environment variables

### Supported Fields

Environment variables can be used in:
- **Token Endpoint URL** - `${TOKEN_ENDPOINT}`
- **Client ID** - `${CLIENT_ID}`
- **Client Secret** - `${CLIENT_SECRET}`
- **Audience** - `${AUDIENCE}`
- **Scope** - `${SCOPE}`
- **Custom Header Values** - `${HEADER_VALUE}`

### Example 1: Securing Credentials with Environment Variables

Instead of storing your actual client secret in VS Code:

```
Environment Name: Production
Token Endpoint: ${AUTH0_TOKEN_ENDPOINT}
Client ID: ${AUTH0_CLIENT_ID}
Client Secret: ${AUTH0_CLIENT_SECRET}
Audience: ${AUTH0_AUDIENCE}
```

Then set these environment variables before launching VS Code:

**Mac/Linux:**
```bash
export AUTH0_TOKEN_ENDPOINT="https://mycompany.auth0.com/oauth/token"
export AUTH0_CLIENT_ID="abc123xyz456"
export AUTH0_CLIENT_SECRET="supersecretkey789"
export AUTH0_AUDIENCE="https://api.mycompany.com"
code
```

**Windows:**
```cmd
set AUTH0_TOKEN_ENDPOINT=https://mycompany.auth0.com/oauth/token
set AUTH0_CLIENT_ID=abc123xyz456
set AUTH0_CLIENT_SECRET=supersecretkey789
set AUTH0_AUDIENCE=https://api.mycompany.com
code
```

### Example 2: Using .env Files (Recommended)

The extension automatically loads environment variables from `.env` files in your workspace root when it activates.

**Step 1:** Create a `.env` or `.env.local` file in your workspace:
```bash
# .env.local
AUTH0_TOKEN_ENDPOINT=https://mycompany.auth0.com/oauth/token
AUTH0_CLIENT_ID=abc123xyz456
AUTH0_CLIENT_SECRET=supersecretkey789
AUTH0_AUDIENCE=https://api.mycompany.com
```

**Step 2:** Configure your environment with placeholders:
```
Environment Name: Production
Token Endpoint: ${AUTH0_TOKEN_ENDPOINT}
Client ID: ${AUTH0_CLIENT_ID}
Client Secret: ${AUTH0_CLIENT_SECRET}
Audience: ${AUTH0_AUDIENCE}
```

**Step 3:** Add `.env.local` to your `.gitignore`:
```
.env.local
.env.development
.env.production
```

**Supported .env files** (loaded in order):
- `.env` - Base environment variables
- `.env.local` - Local overrides (should be in `.gitignore`)
- `.env.development` - Development-specific variables
- `.env.production` - Production-specific variables

**Benefits:**
- No need to launch VS Code from terminal
- Works automatically when extension activates
- Easy to manage multiple environment configs
- Safe to share `.env.example` with team (without real secrets)

### Example 3: Mixed Static and Dynamic Values

You can mix hardcoded values with environment variables:

```
Environment Name: Development
Token Endpoint: https://mycompany-dev.auth0.com/oauth/token
Client ID: ${DEV_CLIENT_ID}
Client Secret: ${DEV_CLIENT_SECRET}
Audience: https://api.mycompany.com
```

### Example 4: Custom Headers with Environment Variables

Your API requires a tenant context that changes per developer:

```
Custom Headers:
  Header Name: X-Tenant-Context
  Header Value: ${TENANT_ID}
```

### Example 5: Multiple Environment Variables

**Scenario:** Your API requires multiple custom headers with some dynamic values:

```
Header 1:
  Name: X-Api-Version
  Value: v2

Header 2:
  Name: X-Client-Platform
  Value: vscode-extension

Header 3:
  Name: X-User-Context
  Value: ${USER_EMAIL}
```

### Important Notes

- If an environment variable is not found, the placeholder text (e.g., `${CLIENT_ID}`) will be used as-is
- **Recommended:** Use `.env` files in your workspace root - they're loaded automatically when the extension activates
- **Alternative:** Launch VS Code from a terminal to inherit environment variables from your shell
- Environment variables are evaluated at runtime when tokens are generated
- Changes to `.env` files require reloading the VS Code window (`Cmd+R` / `Ctrl+R`) or restarting VS Code
- Changes to shell environment variables require restarting VS Code

---

## Authentication Methods

The extension supports three different authentication methods to work with various OAuth providers and custom APIs.

### Method 1: Credentials in Request Body (Default)

**When to use:** Standard OAuth 2.0 providers (Auth0, Okta, most APIs)

**How it works:** Client ID and Secret are sent in the JSON request body:
```json
{
  "client_id": "abc123",
  "client_secret": "secret456",
  "grant_type": "client_credentials",
  "audience": "https://api.example.com"
}
```

**Providers that use this:**
- Auth0
- Okta
- Most OAuth 2.0 APIs

### Method 2: Basic Authentication Header

**When to use:** Some enterprise APIs require HTTP Basic Auth

**How it works:** Client ID and Secret are encoded in an Authorization header:
```
Authorization: Basic YWJjMTIzOnNlY3JldDQ1Ng==
```

**Example configuration:**
```
Authentication Method: Basic Authentication Header
Content Type: Form Encoded (application/x-www-form-urlencoded)
```

**Form labels automatically change:**
- "Client ID" → "Username"
- "Client Secret" → "Password"

**Providers that may use this:**
- Some banking APIs
- Legacy OAuth implementations
- Enterprise custom APIs

### Method 3: Custom JWT

**When to use:** Custom authentication APIs that use JWT-based authentication but don't follow standard OAuth patterns

**How it works:** Similar to the default method, but designed for proprietary authentication APIs. Often used with **Custom Body Fields** to completely control the request structure.

**Example configuration:**
```
Authentication Method: Custom JWT
Content Type: JSON (application/json)
```

**Form behavior:**
- Help text updates to clarify credentials are for JWT authentication
- Credentials are still stored securely like other methods
- Best used in combination with Custom Body Fields (see below)

**When to use Custom JWT:**
- Your API returns a JWT token but uses custom field names
- You need full control over the request body structure
- Working with proprietary authentication systems
- API documentation specifies "JWT authentication" but not standard OAuth

---

## Content Types

### JSON (application/json) - Default

**When to use:** Modern OAuth providers

**Request format:**
```json
{
  "grant_type": "client_credentials",
  "client_id": "...",
  "client_secret": "...",
  "audience": "..."
}
```

### Form Encoded (application/x-www-form-urlencoded)

**When to use:** Some older OAuth providers

**Request format:**
```
grant_type=client_credentials&client_id=...&client_secret=...&audience=...
```

---

## Custom Body Fields

### Overview

For non-standard OAuth implementations or custom authentication APIs, you can completely customize the request body structure using **Custom Body Fields**.

**When to use Custom Body Fields:**
- Your API uses different field names (e.g., `key` instead of `client_id`)
- Your API requires additional fields not in standard OAuth (e.g., `groupHash`, `tenantId`)
- You're working with a proprietary authentication API that doesn't follow OAuth standards
- Combine with the **Custom JWT** authentication method for full control

### How It Works

When custom body fields are defined, they **completely replace** the standard OAuth body structure. The extension will send exactly the fields you specify, giving you full control over the request body.

### Example 1: Custom Authentication API

**Scenario:** Your API expects this body structure:
```json
{
  "key": "your-api-key",
  "secret": "your-api-secret",
  "audience": "https://api.example.com",
  "groupHash": "{tenant:group}"
}
```

**Configuration steps:**
1. Open `OAuth: Configure Credentials`
2. Select **Authentication Method**: Custom JWT
3. Click **"+ Add Custom Body Field"** and add:
   - Field: `key`, Value: `${API_KEY}`
   - Field: `secret`, Value: `${API_SECRET}`
   - Field: `audience`, Value: `https://api.example.com`
   - Field: `groupHash`, Value: `{tenant:group}`
4. Test and save

The extension will send exactly these fields with environment variable substitution applied.

### Example 2: Banking API with Additional Fields

**Scenario:** Your banking API requires these fields:
```json
{
  "client_id": "your-client-id",
  "client_secret": "your-secret",
  "grant_type": "client_credentials",
  "tenant_id": "bank-tenant-123",
  "branch_code": "NYC-001"
}
```

**Configuration:**
1. Authentication Method: Custom JWT
2. Add custom body fields:
   - Field: `client_id`, Value: `${CLIENT_ID}`
   - Field: `client_secret`, Value: `${CLIENT_SECRET}`
   - Field: `grant_type`, Value: `client_credentials`
   - Field: `tenant_id`, Value: `bank-tenant-123`
   - Field: `branch_code`, Value: `NYC-001`

### Example 3: E-commerce Platform API

**Scenario:** Your e-commerce API needs store context:
```json
{
  "apiKey": "store-key",
  "apiSecret": "store-secret",
  "storeId": "store-12345",
  "environment": "production"
}
```

**Configuration:**
1. Authentication Method: Custom JWT
2. Add custom body fields:
   - Field: `apiKey`, Value: `${STORE_API_KEY}`
   - Field: `apiSecret`, Value: `${STORE_API_SECRET}`
   - Field: `storeId`, Value: `store-12345`
   - Field: `environment`, Value: `production`

### Working with Custom Body Fields

**Adding fields:**
1. In the configuration form, scroll to "Custom Body Fields"
2. Click **"+ Add Custom Body Field"**
3. Enter the field name and value
4. Use `${VAR_NAME}` for environment variables
5. Add as many fields as needed

**Removing fields:**
1. Click the **×** (delete) button next to any field
2. Field is removed immediately

**Editing fields:**
1. Modify the field name or value directly in the form
2. Changes are saved when you click "Save Credentials"

### Important Notes

- Custom body fields **completely replace** the standard OAuth body
- The `grant_type` field is NOT automatically added (add it manually if needed)
- Environment variable substitution works in all field values
- Custom body fields are included in export/import operations
- Test your configuration before saving to verify the API accepts your structure

---

## Managing Environments

### Editing an Environment

**When to do this:**
- Credentials were rotated
- Token endpoint URL changed
- Need to add/modify scope or audience

**Steps:**
1. Open `OAuth: Configure Credentials`
2. Find the environment in the list
3. Click the **✎** (Edit) icon button
4. Modify the fields you need
5. Click "Save Credentials"

### Deleting an Environment

**When to do this:**
- Environment no longer exists
- Cleaning up old test configurations
- Credentials were compromised

**Steps:**
1. Open `OAuth: Configure Credentials`
2. Find the environment in the list
3. Click the **×** (Delete) icon button
4. Confirm the deletion
5. Environment and its cached tokens are removed

### Switching Environments

**When to do this:**
- Moving from dev to staging testing
- Switching between different APIs
- Working on different features

**Method 1: Select Environment Command**
```
Ctrl+Shift+P / Cmd+Shift+P
→ OAuth: Select Environment
→ Choose from list
```

**Method 2: Status Bar**
```
Click the environment name in the bottom-right status bar
```

---

## Viewing Stored Tokens

### When to use this feature:

- Check which tokens are currently cached
- See how long until a token expires
- Copy a previously generated token

**Steps:**
1. Press `Ctrl+Shift+P` / `Cmd+Shift+P`
2. Type: `OAuth: View Stored Tokens`
3. See list of cached tokens with expiry times
4. Select one to copy it to clipboard

**Example output:**
```
Development (Expires in 1245s)
Audience: https://api.mycompany.com

Staging (Expires in 3600s)
Audience: https://api-staging.mycompany.com
```

---

## Import/Export Environments

### Overview

The extension provides import/export functionality to help you:
- **Share configurations** with team members
- **Backup** your environment configurations
- **Migrate** settings between machines or VS Code installations
- **Version control** your configurations (without exposing secrets when using environment variables)

### Exporting Environments

**When to export:**
- Setting up a new team member
- Creating a backup before making changes
- Sharing configurations across multiple machines
- Version controlling your setup (with environment variables)

**How to export:**

**Method 1: From Sidebar (Recommended)**
1. Open the OAuth sidebar (click the 🔑 icon in the activity bar)
2. In the "Environments" section, click the **Save icon** in the toolbar
3. Choose a location and filename (e.g., `oauth-environments.json`)
4. Click "Save"

**Method 2: From Command Palette**
1. Press `Ctrl+Shift+P` / `Cmd+Shift+P`
2. Type: `OAuth: Export Environments`
3. Choose a location and filename
4. Click "Save"

**What gets exported:**
- All environment configurations
- Token endpoints, provider info
- Authentication methods and content types
- Custom headers (including environment variable placeholders)
- Custom body fields (including environment variable placeholders)
- Environment variables are saved as `${VAR_NAME}` placeholders (NOT actual values)

**Example export file:**
```json
{
  "environments": [
    {
      "name": "Development",
      "credentials": {
        "provider": "Auth0",
        "tokenEndpoint": "${AUTH0_TOKEN_ENDPOINT}",
        "clientId": "${AUTH0_CLIENT_ID}",
        "clientSecret": "${AUTH0_CLIENT_SECRET}",
        "audience": "${AUTH0_AUDIENCE}",
        "authMethod": "body",
        "contentType": "application/json",
        "customHeaders": [
          {
            "key": "X-Tenant-Context",
            "value": "${TENANT_ID}"
          }
        ]
      }
    }
  ]
}
```

### Importing Environments

**When to import:**
- Setting up on a new machine
- Restoring from backup
- Receiving configurations from a team member
- Switching between different project configurations

**How to import:**

**Method 1: From Sidebar (Recommended)**
1. Open the OAuth sidebar (click the 🔑 icon)
2. In the "Environments" section, click the **Import icon** in the toolbar
3. Select the JSON file to import
4. Environments are imported and added to your configuration

**Method 2: From Command Palette**
1. Press `Ctrl+Shift+P` / `Cmd+Shift+P`
2. Type: `OAuth: Import Environments`
3. Select the JSON file
4. Environments are imported

**Import behavior:**
- Existing environments with the same name are **overwritten**
- New environments are added
- Environment variables are NOT imported (you must set them separately)
- Custom headers and body fields are preserved with their `${VAR_NAME}` placeholders

**After importing:**
1. Set any required environment variables before launching VS Code
2. Or use `.env` files in your workspace (see Environment Variables section)
3. Test your connections to verify everything works

### Sharing Configurations with Teams

**Best practice workflow:**

**Team Lead (Creating shared config):**
```bash
1. Configure all environments using environment variable syntax
   - Client ID: ${AUTH0_CLIENT_ID}
   - Client Secret: ${AUTH0_CLIENT_SECRET}

2. Export environments to a file
   - Name it descriptively: "team-oauth-config.json"

3. Share the JSON file via:
   - Git repository (safe because it uses ${} placeholders)
   - Slack/Teams
   - Email

4. Create a separate .env.example file:
   AUTH0_CLIENT_ID=your-client-id-here
   AUTH0_CLIENT_SECRET=your-secret-here
   AUTH0_TOKEN_ENDPOINT=https://your-tenant.auth0.com/oauth/token
```

**Team Member (Using shared config):**
```bash
1. Copy the .env.example to .env.local
2. Fill in actual credentials (get from team lead or password manager)
3. Import the team-oauth-config.json file
4. Test connection
5. Start generating tokens!
```

### Security Best Practices

**DO:**
- ✓ Use environment variable placeholders (`${VAR_NAME}`) in configurations
- ✓ Share exported JSON files with placeholders
- ✓ Keep actual credentials in `.env.local` (add to `.gitignore`)
- ✓ Export regularly as backups
- ✓ Version control the export file with placeholders

**DON'T:**
- ✗ Export with hardcoded credentials and commit to git
- ✗ Share export files with actual secrets via email/Slack
- ✗ Store export files with real credentials in public places
- ✗ Forget to document which environment variables are needed

### Troubleshooting Import/Export

**Problem:** Import fails with "Invalid JSON"
- **Solution:** Open the file in a text editor and verify it's valid JSON
- Use a JSON validator online if needed

**Problem:** Imported environments don't work
- **Solution:** Check that you've set all required environment variables
- Review the exported file to see which `${VAR_NAME}` placeholders exist
- Set those variables before launching VS Code

**Problem:** Export doesn't include some environments
- **Solution:** Refresh the environments list first (click refresh icon)
- Verify the environments exist in the configuration panel

---

## Complete Workflow Example

### Daily Development Workflow (Using Sidebar - Recommended!)

**Morning Setup:**
```
1. Open VS Code
2. Click the 🔑 icon in the left activity bar
3. Click "Development" in the Environments list
4. Token copied to clipboard
5. Paste into Postman/curl for testing
```

**Testing Different Environments:**
```
1. Testing dev API endpoint ✓
2. Need to test staging now...
3. Look at sidebar (already open)
4. Click "Staging" environment
5. Token generated and copied instantly ✓
6. Test staging endpoint ✓
```

**Checking Cached Tokens:**
```
1. Look at "Generated Tokens" section in sidebar
2. See all cached tokens with expiry times
3. Click any token to copy it (no new API call needed)
4. Expired tokens are automatically removed
```

**Switching Between Projects:**
```
Project A (Uses Auth0):
- Sidebar shows: "Project A - Dev" (highlighted in green)
- Click it → Token generated → Test endpoints

Project B (Uses Okta):
- Sidebar shows: "Project B - Dev"
- Click it → Token generated → Test endpoints
```

### Alternative Workflow (Using Command Palette)

**Morning Setup:**
```
1. Open VS Code
2. Press Ctrl+Shift+P
3. Run: OAuth: Generate Bearer Token
4. Token copied to clipboard
5. Paste into Postman/curl for testing
```

**Testing Different Environments:**
```
1. Testing dev API endpoint ✓
2. Need to test staging now...
3. Press Ctrl+Shift+P
4. Run: OAuth: Select Environment
5. Choose "Staging"
6. Run: OAuth: Generate Bearer Token
7. Test staging endpoint ✓
```

---

## Advanced Tips & Best Practices

### 1. Keyboard Shortcuts
Set up shortcuts for commonly used commands:
- `Ctrl+Alt+T`: Generate Bearer Token
- `Ctrl+Alt+E`: Configure Credentials
- `Ctrl+Alt+S`: Select Environment

### 2. Environment Naming Conventions
Use clear, descriptive names:
- ✓ Good: `MyAPI-Dev`, `MyAPI-Staging`, `MyAPI-Prod`
- ✗ Bad: `Dev`, `Test`, `Thing1`

### 3. Security Best Practices
- Never commit credentials to git
- Use environment variables for sensitive headers
- Rotate credentials regularly
- Delete environments when projects end

### 4. Token Expiry Management
- Tokens are cached but automatically refreshed when expired
- If you get 401 errors, try generating a fresh token
- Check token expiry with "View Stored Tokens"

### 5. Testing New Configurations
Always use the "Test Connection" button before saving:
- Validates credentials immediately
- Catches typos in endpoints
- Verifies network connectivity

---

## Troubleshooting Common Scenarios

### Scenario 1: "Invalid credentials" error

**Problem:** Test connection fails

**Checklist:**
1. ✓ Token endpoint URL is correct and accessible
2. ✓ Client ID copied correctly (no extra spaces)
3. ✓ Client Secret copied correctly (no quotes)
4. ✓ OAuth application has "Client Credentials" grant enabled
5. ✓ Audience matches your API identifier exactly

**Example fix:**
```
Wrong: https://mycompany.auth0.com/oauth/token/
Right: https://mycompany.auth0.com/oauth/token
(Note: no trailing slash)
```

### Scenario 2: Token generates but API returns 401

**Problem:** Token is valid but API rejects it

**Possible causes:**
1. **Wrong Audience:** Token is for different API
   - Fix: Check audience matches your API identifier
2. **Missing Scopes:** API requires specific scopes
   - Fix: Add required scopes to configuration
3. **Expired Token:** Cached token expired
   - Fix: Generate a fresh token

### Scenario 3: Custom body fields not working

**Problem:** API returns error when using custom body fields

**Checklist:**
1. ✓ Authentication Method is set to "Custom JWT"
2. ✓ All required fields are defined in custom body fields
3. ✓ Field names match exactly what the API expects (case-sensitive)
4. ✓ Values are properly formatted (strings, not JSON objects)
5. ✓ Environment variables in values are set correctly
6. ✓ If API needs `grant_type`, it's explicitly added as a custom field

**Common mistake:**
```
Wrong:
  Authentication Method: Credentials in Request Body
  Custom Body Fields: key=mykey, secret=mysecret
  (Custom fields are ignored because auth method is not Custom JWT)

Right:
  Authentication Method: Custom JWT
  Custom Body Fields:
    - Field: key, Value: mykey
    - Field: secret, Value: mysecret
```

**Debugging:**
1. Use "Test Connection" to see exact error from API
2. Check VS Code Developer Console for request details
3. Verify the API documentation for required fields
4. Try with a tool like Postman first to confirm the structure

### Scenario 4: Environment variables not working

**Problem:** Environment variable not substituted in credentials or headers

**Checklist:**
1. ✓ Syntax is `${VAR_NAME}` (with curly braces)
2. ✓ Variable name is correct (case-sensitive)
3. ✓ If using `.env` files:
   - File exists in workspace root
   - File is named correctly (`.env`, `.env.local`, etc.)
   - Variables are in `KEY=value` format (no `export`)
   - VS Code window was reloaded after creating/editing `.env`
4. ✓ If using terminal method:
   - Environment variable is set before launching VS Code
   - VS Code was launched from terminal (to inherit variables)

**Test with .env file (Recommended):**
```bash
# Create .env.local in workspace root
echo "CLIENT_ID=your-client-id" > .env.local
echo "CLIENT_SECRET=your-secret" >> .env.local

# Reload VS Code window
# Cmd+R (Mac) or Ctrl+R (Windows/Linux)
```

**Test with terminal method:**
```bash
# Mac/Linux
echo $CLIENT_ID    # Should print your value
export CLIENT_ID="your-client-id"
export CLIENT_SECRET="your-secret"
code

# Windows
echo %CLIENT_ID%   # Should print your value
set CLIENT_ID=your-client-id
set CLIENT_SECRET=your-secret
code
```

**Verification:**
If you're unsure whether the variable was substituted:
1. Check VS Code Developer Console (`Help > Toggle Developer Tools`)
2. Look for error messages about authentication
3. If you see literal `${VAR_NAME}` in errors, the variable wasn't set
4. Try the "Test Connection" button to see detailed error messages

---

## Next Steps

Now that you're familiar with the extension, try:

1. **Set up all your environments** - Add dev, staging, and prod
2. **Assign keyboard shortcuts** - Speed up your workflow
3. **Configure custom headers** - If your API needs them
4. **Share with your team** - Help teammates set up their credentials

For more detailed information, see the [README.md](README.md).

For issues or feature requests, visit our [GitHub repository](https://github.com/hmredmond/oauth-token-generator-vscode-extension).

---

**Happy token generating! 🔑**
