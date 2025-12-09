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

## Generating Tokens

### Method 1: Quick Generate (Recommended for daily use)

**When to use:** You need a token right now for the current environment

1. Press `Ctrl+Shift+P` / `Cmd+Shift+P`
2. Type: `OAuth: Generate Bearer Token`
3. Press Enter
4. Token is generated and copied to clipboard
5. Paste it wherever you need (Postman, curl, etc.)

**Pro tip:** Assign a keyboard shortcut for even faster access!
- Go to: File > Preferences > Keyboard Shortcuts
- Search for: `OAuth: Generate Bearer Token`
- Assign something like `Ctrl+Alt+T`

### Method 2: Generate from Configuration Panel

**When to use:** You want to generate a token for a specific environment without switching

1. Open `OAuth: Configure Credentials`
2. Find the environment you want
3. Click the **↻** (Get Token) icon button
4. Token is generated and copied to clipboard

### Method 3: Status Bar (Quick Switch & Generate)

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

## Using Custom Headers

### When to use custom headers:

Some OAuth providers require additional headers for authentication or context.

**Example 1: Static Custom Header**

Your API requires an enterprise ID header:

```
Custom Headers:
  Header Name: X-Enterprise-Id
  Header Value: ent_12345
```

**Example 2: Dynamic Header with Environment Variable**

Your API requires a tenant context that changes per developer:

```
Custom Headers:
  Header Name: X-Tenant-Context
  Header Value: ${TENANT_ID}
```

Then set the environment variable before launching VS Code:

**Mac/Linux:**
```bash
export TENANT_ID="tenant_abc123"
code
```

**Windows:**
```cmd
set TENANT_ID=tenant_abc123
code
```

**Example 3: Multiple Custom Headers**

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

---

## Authentication Methods

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

**Providers that may use this:**
- Some banking APIs
- Legacy OAuth implementations
- Enterprise custom APIs

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

## Complete Workflow Example

### Daily Development Workflow

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

**Switching Between Projects:**
```
Project A (Uses Auth0):
- Current Environment: "Project A - Dev"
- Generate token → Test endpoints

Project B (Uses Okta):
- Switch to: "Project B - Dev"
- Generate token → Test endpoints
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

### Scenario 3: Custom headers not working

**Problem:** Environment variable not substituted

**Checklist:**
1. ✓ Environment variable is set before launching VS Code
2. ✓ Syntax is `${VAR_NAME}` (with curly braces)
3. ✓ VS Code was launched from terminal (to inherit variables)

**Test:**
```bash
# Mac/Linux
echo $TENANT_ID    # Should print your value
export TENANT_ID="tenant123"
code

# Windows
echo %TENANT_ID%   # Should print your value
set TENANT_ID=tenant123
code
```

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
