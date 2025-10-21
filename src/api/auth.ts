/**
 * OAuth 2.0 authentication with PKCE for Twitch
 * Handles the authorization flow, token storage, and refresh
 */

import * as crypto from 'crypto';
import { logger } from '../utils/logger';

export interface TwitchTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string[];
  obtained_at: number; // timestamp when token was obtained
}

export interface OAuthConfig {
  clientId: string;
  clientSecret?: string; // Optional for PKCE flow
  redirectUri: string;
  scopes: string[];
}

/**
 * Generate a random code verifier for PKCE
 */
function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Generate code challenge from verifier
 */
function generateCodeChallenge(verifier: string): string {
  return crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url');
}

export class TwitchAuth {
  private config: OAuthConfig;
  private tokens: TwitchTokens | null = null;
  private codeVerifier: string | null = null;

  constructor(config: OAuthConfig) {
    this.config = config;
  }

  /**
   * Get the authorization URL for the user to visit
   */
  getAuthorizationUrl(): { url: string; codeVerifier: string } {
    this.codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(this.codeVerifier);

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scopes.join(' '),
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      force_verify: 'true'
    });

    const url = `https://id.twitch.tv/oauth2/authorize?${params.toString()}`;
    logger.info('Generated authorization URL');

    return { url, codeVerifier: this.codeVerifier };
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string, codeVerifier: string): Promise<TwitchTokens> {
    try {
      const params = new URLSearchParams({
        client_id: this.config.clientId,
        code,
        code_verifier: codeVerifier,
        grant_type: 'authorization_code',
        redirect_uri: this.config.redirectUri
      });

      if (this.config.clientSecret) {
        params.append('client_secret', this.config.clientSecret);
      }

      const response = await fetch('https://id.twitch.tv/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Token exchange failed: ${error}`);
      }

      const data = await response.json();

      this.tokens = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        token_type: data.token_type,
        scope: data.scope || this.config.scopes,
        obtained_at: Date.now()
      };

      logger.info('Successfully obtained access token');
      return this.tokens;
    } catch (error) {
      logger.error('Failed to exchange code for token', error);
      throw error;
    }
  }

  /**
   * Refresh the access token using the refresh token
   */
  async refreshAccessToken(): Promise<TwitchTokens> {
    if (!this.tokens?.refresh_token) {
      throw new Error('No refresh token available');
    }

    try {
      const params = new URLSearchParams({
        client_id: this.config.clientId,
        refresh_token: this.tokens.refresh_token,
        grant_type: 'refresh_token'
      });

      if (this.config.clientSecret) {
        params.append('client_secret', this.config.clientSecret);
      }

      const response = await fetch('https://id.twitch.tv/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Token refresh failed: ${error}`);
      }

      const data = await response.json();

      this.tokens = {
        access_token: data.access_token,
        refresh_token: data.refresh_token || this.tokens.refresh_token,
        expires_in: data.expires_in,
        token_type: data.token_type,
        scope: data.scope || this.tokens.scope,
        obtained_at: Date.now()
      };

      logger.info('Successfully refreshed access token');
      return this.tokens;
    } catch (error) {
      logger.error('Failed to refresh token', error);
      throw error;
    }
  }

  /**
   * Check if the current token is expired or about to expire
   */
  isTokenExpired(): boolean {
    if (!this.tokens) return true;

    const expiresAt = this.tokens.obtained_at + (this.tokens.expires_in * 1000);
    const now = Date.now();

    // Consider token expired if it expires in less than 5 minutes
    return (expiresAt - now) < (5 * 60 * 1000);
  }

  /**
   * Get a valid access token, refreshing if necessary
   */
  async getValidAccessToken(): Promise<string> {
    if (!this.tokens) {
      throw new Error('Not authenticated. Please authenticate first.');
    }

    if (this.isTokenExpired()) {
      logger.info('Token expired, refreshing...');
      await this.refreshAccessToken();
    }

    return this.tokens.access_token;
  }

  /**
   * Revoke the current access token
   */
  async revokeToken(): Promise<void> {
    if (!this.tokens?.access_token) {
      return;
    }

    try {
      const params = new URLSearchParams({
        client_id: this.config.clientId,
        token: this.tokens.access_token
      });

      await fetch('https://id.twitch.tv/oauth2/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      this.tokens = null;
      logger.info('Successfully revoked token');
    } catch (error) {
      logger.error('Failed to revoke token', error);
    }
  }

  /**
   * Set tokens (used when loading from storage)
   */
  setTokens(tokens: TwitchTokens): void {
    this.tokens = tokens;
  }

  /**
   * Get current tokens
   */
  getTokens(): TwitchTokens | null {
    return this.tokens;
  }

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return this.tokens !== null && !this.isTokenExpired();
  }
}
