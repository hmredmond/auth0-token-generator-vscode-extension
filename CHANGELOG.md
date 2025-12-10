# Changelog

All notable changes to the OAuth Token Generator extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **🔐 Environment Variables Support for All Credential Fields**
  - All credential fields now support environment variable substitution using `${VARIABLE_NAME}` syntax
  - Supported fields: Token Endpoint URL, Client ID, Client Secret, Audience, Scope, and Custom Header Values
  - Enables keeping secrets out of stored configurations for improved security
  - Useful for sharing configurations between team members without exposing credentials
  - Environment variables are evaluated at runtime when generating tokens

### Changed

- **Form UI Enhancements**
  - Updated all form field placeholders to show environment variable syntax examples (e.g., `${CLIENT_ID}`)
  - Added help text to each field indicating environment variable support

### Improved

- **Documentation**
  - Updated README.md with comprehensive environment variables section
  - Updated GETTING_STARTED.md with detailed examples of using environment variables in all credential fields
  - Added troubleshooting guidance for environment variable issues
  - Included setup instructions for macOS/Linux and Windows

### Technical Details

- Extended `substituteEnvVars` method in `OAuthClient` to work with all credential fields (previously only supported custom headers)
- Method renamed from `substituteHeaderValue` to `substituteEnvVars` for clarity
- All credential fields are now processed through environment variable substitution before use

## [2.0.0] - 2025-12-09

### Added - Major UI Enhancement with Sidebar Integration

This major release introduces a completely new way to interact with the extension through a dedicated sidebar panel with tree views.

#### New Features

- **🌳 Sidebar Panel Integration**
  - Dedicated OAuth Token Generator panel in the activity bar (left-hand sidebar)
  - Visual tree views for environments and tokens
  - One-click access from the key icon (🔑) in the activity bar

- **📁 Environments Tree View**
  - Lists all configured OAuth environments in a visual tree structure
  - Current environment highlighted with green icon
  - Click any environment to instantly generate and copy a token
  - Environment metadata displayed (provider and token endpoint)
  - Quick access buttons: refresh (🔄) and add new environment (➕)

- **🔐 Generated Tokens Tree View**
  - Real-time view of all cached tokens
  - Expiry time displayed for each token (e.g., "Expires in 25m")
  - Click any token to copy it to clipboard without making a new API call
  - Automatically refreshes when tokens expire
  - Color-coded icons for visual distinction

- **📱 Responsive Design**
  - Webview configuration panel now fully responsive
  - Media queries adapt UI to narrow panels (< 600px)
  - Optimized for sidebar usage and different screen sizes
  - Form elements stack vertically on narrow screens
  - Button sizes and spacing adjust for better usability

#### Changed

- **Enhanced User Experience**
  - Token generation now possible from three locations: sidebar, command palette, and configuration panel
  - Tree views automatically refresh after token generation or environment changes
  - Visual feedback with icons indicating current environment and token status
  - Improved workflow efficiency with always-visible environment list

- **Architecture Improvements**
  - Added `tree-providers.ts` with `EnvironmentsTreeProvider` and `TokensTreeProvider`
  - Extended `CommandManager` with tree view refresh callbacks
  - New commands: `refreshEnvironments`, `refreshTokens`, `generateTokenFromTree`, `copyTokenFromTree`
  - Context menu integration for tree views

#### Technical Details

- **New Files**:
  - `src/tree-providers.ts`: Tree view data providers and tree item classes

- **Updated Files**:
  - `src/extension.ts`: Tree view registration and command wiring
  - `src/commands.ts`: Tree view refresh callbacks integration
  - `src/webview-manager.ts`: Responsive CSS media queries
  - `package.json`: View containers, views, and menu contributions

- **Package.json Changes**:
  - Added `viewsContainers.activitybar` configuration with `auth0-token-generator` container
  - Added two views: `auth0Environments` and `auth0Tokens`
  - Added commands: `refreshEnvironments`, `refreshTokens`, `openConfigFromTree`
  - Added `menus.view/title` contributions for tree view toolbar buttons

- **CSS Enhancements**:
  - Media query for screens < 600px (sidebar and narrow panels)
  - Media query for screens < 400px (very narrow panels)
  - Responsive form layouts with flexbox
  - Adaptive button sizing and spacing

#### Benefits

- **Faster Workflow**: Generate tokens with a single click instead of multiple steps
- **Better Visibility**: See all environments and tokens at a glance
- **Improved Organization**: Visual tree structure makes it easy to manage multiple environments
- **Enhanced UX**: Responsive design works seamlessly in any panel configuration
- **Always Accessible**: Sidebar remains visible while working in editor

#### Migration Notes

No breaking changes. All existing configurations and workflows continue to work as before. The sidebar panel is an additional feature that enhances the existing functionality.

## [0.2.0] - 2025-12-09

### Changed - Major Refactor to Generic OAuth Support

This release transforms the extension from Auth0-specific to a generic OAuth token generator supporting multiple providers.

#### Breaking Changes
- Extension renamed from `auth0-token-generator` to `oauth-token-generator`
- All command IDs changed from `auth0-token-generator.*` to `oauth-token-generator.*`
- Configuration keys changed from `auth0TokenGenerator.*` to `oauthTokenGenerator.*`
- Storage keys changed from `auth0.*` to `oauth.*` (existing configurations will need to be recreated)
- Credential schema updated: removed `domain` field, added `provider` and `tokenEndpoint` fields

#### Added
- **Multi-Provider Support**: Now supports Auth0, Okta, Azure AD, and custom OAuth providers
- **Configurable Token Endpoints**: Users can specify any OAuth token endpoint URL
- **Provider Selection**: Dropdown to select OAuth provider type (Auth0, Okta, Azure AD, Custom)
- **Provider Display**: Environment selection now shows provider and endpoint information
- Enhanced documentation with examples for Auth0, Okta, and Azure AD

#### Changed
- **Extension Metadata**:
  - Display name: "Auth0 Token Generator" → "OAuth Token Generator"
  - Description updated to reflect generic OAuth support
  - Keywords expanded to include multiple OAuth providers

- **Type Definitions** (`src/types.ts`):
  - `Auth0Credentials` interface renamed to `OAuthCredentials`
  - `Auth0Environment` interface renamed to `OAuthEnvironment`
  - Added `provider: string` field to credentials
  - Added `tokenEndpoint: string` field to credentials (replaces domain-based URL construction)

- **OAuth Client** (`src/oauth-client.ts`):
  - File renamed from `auth0-client.ts` to `oauth-client.ts`
  - Class renamed from `Auth0Client` to `OAuthClient`
  - Token endpoint now configurable instead of Auth0-specific URL construction
  - Error messages updated to be provider-agnostic

- **User Interface**:
  - All "Auth0" references replaced with "OAuth" throughout the extension
  - Configuration webview now includes provider selection dropdown
  - Token endpoint input field added to configuration form
  - Status bar updated to display "OAuth" instead of "Auth0"
  - Welcome message updated to be provider-agnostic

- **Commands** (`src/commands.ts`):
  - All user-facing messages updated to be provider-agnostic
  - Progress notifications updated ("Requesting token from provider..." instead of "from Auth0...")
  - Environment display now shows provider and token endpoint

- **Storage** (`src/storage-manager.ts`):
  - Storage keys updated to use `oauth.*` prefix instead of `auth0.*`
  - Type references updated to use new `OAuthEnvironment` type

- **Documentation** (`readme.md`):
  - Complete rewrite to focus on generic OAuth support
  - Added configuration examples for Auth0, Okta, and Azure AD
  - Updated troubleshooting guide for multiple providers
  - Added "Supported OAuth Providers" section

#### Migration Guide

Existing users will need to reconfigure their environments due to storage key and schema changes:

1. Open the Command Palette and run `OAuth: Configure Credentials`
2. For Auth0 configurations:
   - Provider: Select "Auth0"
   - Token Endpoint: `https://your-tenant.auth0.com/oauth/token`
   - Enter your existing Client ID and Client Secret
   - Add Audience and Scope if previously configured
3. For other providers:
   - Select the appropriate provider or "Custom"
   - Enter the full token endpoint URL
   - Configure client credentials and optional audience/scope

#### Technical Details

- Removed activation events (automatically generated by VS Code 1.75.0+)
- All TypeScript files updated to use new type definitions
- Compilation verified with zero errors
- Core OAuth 2.0 client credentials flow implementation unchanged

## [0.1.7] - Previous Release

- Auth0-specific implementation (before generic OAuth refactor)
