"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Auth0Client = void 0;
const axios_1 = __importDefault(require("axios"));
class Auth0Client {
    constructor(credentials) {
        this.credentials = credentials;
    }
    async generateToken(audience, scope) {
        const tokenEndpoint = `https://${this.credentials.domain}/oauth/token`;
        const payload = {
            client_id: this.credentials.clientId,
            client_secret: this.credentials.clientSecret,
            audience: audience || this.credentials.audience,
            grant_type: 'client_credentials',
            scope: scope || this.credentials.scope || ''
        };
        try {
            const response = await axios_1.default.post(tokenEndpoint, payload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                const message = error.response?.data?.error_description ||
                    error.response?.data?.error ||
                    error.message;
                throw new Error(`Auth0 token generation failed: ${message}`);
            }
            throw error;
        }
    }
    async validateCredentials() {
        try {
            await this.generateToken();
            return true;
        }
        catch {
            return false;
        }
    }
}
exports.Auth0Client = Auth0Client;
//# sourceMappingURL=auth0-client.js.map