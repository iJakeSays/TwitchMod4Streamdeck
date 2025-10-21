/**
 * Twitch API client
 * Wrapper for all Twitch API endpoints used by the plugin
 */

import { TwitchAuth } from './auth';
import { twitchRateLimiter } from './rate-limiter';
import { logger } from '../utils/logger';

const TWITCH_API_BASE = 'https://api.twitch.tv/helix';

export interface TwitchClientConfig {
  clientId: string;
  auth: TwitchAuth;
  broadcasterId: string;
}

export interface TwitchAPIError {
  status: number;
  message: string;
}

export class TwitchClient {
  private config: TwitchClientConfig;

  constructor(config: TwitchClientConfig) {
    this.config = config;
  }

  /**
   * Make an authenticated API request to Twitch
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    rateLimitCost: number = 1
  ): Promise<T> {
    try {
      // Wait for rate limiter
      await twitchRateLimiter.acquire(rateLimitCost);

      // Get valid access token
      const accessToken = await this.config.auth.getValidAccessToken();

      const url = `${TWITCH_API_BASE}${endpoint}`;
      const headers = {
        'Client-ID': this.config.clientId,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      };

      logger.debug(`API Request: ${options.method || 'GET'} ${url}`);

      const response = await fetch(url, {
        ...options,
        headers
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error(`API Error: ${response.status} ${error}`);
        throw {
          status: response.status,
          message: error
        } as TwitchAPIError;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      logger.error('API request failed', error);
      throw error;
    }
  }

  // ===== CHAT MANAGEMENT =====

  /**
   * Clear all chat messages
   */
  async clearChat(): Promise<void> {
    await this.request(
      `/moderation/chat?broadcaster_id=${this.config.broadcasterId}&moderator_id=${this.config.broadcasterId}`,
      { method: 'DELETE' }
    );
    logger.info('Chat cleared');
  }

  /**
   * Update chat settings (slow mode, emote-only, etc.)
   */
  async updateChatSettings(settings: {
    slow_mode?: boolean;
    slow_mode_wait_time?: number;
    emote_mode?: boolean;
    follower_mode?: boolean;
    follower_mode_duration?: number;
  }): Promise<void> {
    await this.request(
      `/chat/settings?broadcaster_id=${this.config.broadcasterId}&moderator_id=${this.config.broadcasterId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(settings)
      }
    );
    logger.info('Chat settings updated', settings);
  }

  /**
   * Get current chat settings
   */
  async getChatSettings(): Promise<any> {
    const response = await this.request<any>(
      `/chat/settings?broadcaster_id=${this.config.broadcasterId}`
    );
    return response.data?.[0] || {};
  }

  /**
   * Toggle Shield Mode
   */
  async updateShieldMode(isActive: boolean): Promise<void> {
    await this.request(
      `/moderation/shield_mode?broadcaster_id=${this.config.broadcasterId}&moderator_id=${this.config.broadcasterId}`,
      {
        method: 'PUT',
        body: JSON.stringify({ is_active: isActive })
      }
    );
    logger.info(`Shield mode ${isActive ? 'activated' : 'deactivated'}`);
  }

  /**
   * Get Shield Mode status
   */
  async getShieldModeStatus(): Promise<boolean> {
    const response = await this.request<any>(
      `/moderation/shield_mode?broadcaster_id=${this.config.broadcasterId}&moderator_id=${this.config.broadcasterId}`
    );
    return response.data?.[0]?.is_active || false;
  }

  // ===== AUTOMOD =====

  /**
   * Get held AutoMod messages
   */
  async getAutoModQueue(): Promise<any[]> {
    const response = await this.request<any>(
      `/moderation/automod/message?broadcaster_id=${this.config.broadcasterId}&moderator_id=${this.config.broadcasterId}&first=100`
    );
    return response.data || [];
  }

  /**
   * Approve or deny an AutoMod message
   */
  async manageAutoModMessage(messageId: string, action: 'ALLOW' | 'DENY'): Promise<void> {
    await this.request(
      '/moderation/automod/message',
      {
        method: 'POST',
        body: JSON.stringify({
          user_id: this.config.broadcasterId,
          msg_id: messageId,
          action
        })
      }
    );
    logger.info(`AutoMod message ${action.toLowerCase()}ed: ${messageId}`);
  }

  /**
   * Get AutoMod settings
   */
  async getAutoModSettings(): Promise<any> {
    const response = await this.request<any>(
      `/moderation/automod/settings?broadcaster_id=${this.config.broadcasterId}&moderator_id=${this.config.broadcasterId}`
    );
    return response.data?.[0] || {};
  }

  // ===== STREAM MANAGEMENT =====

  /**
   * Create a stream marker
   */
  async createStreamMarker(description?: string): Promise<string> {
    const response = await this.request<any>(
      '/streams/markers',
      {
        method: 'POST',
        body: JSON.stringify({
          user_id: this.config.broadcasterId,
          description
        })
      }
    );
    const markerId = response.data?.[0]?.id;
    logger.info(`Stream marker created: ${markerId}`);
    return markerId;
  }

  /**
   * Create a clip
   */
  async createClip(): Promise<{ id: string; edit_url: string }> {
    const response = await this.request<any>(
      `/clips?broadcaster_id=${this.config.broadcasterId}`,
      { method: 'POST' }
    );
    const clip = response.data?.[0];
    logger.info(`Clip created: ${clip.id}`);
    return clip;
  }

  /**
   * Update channel information (game category)
   */
  async updateChannelInfo(gameId: string, title?: string): Promise<void> {
    const body: any = { game_id: gameId };
    if (title) body.title = title;

    await this.request(
      `/channels?broadcaster_id=${this.config.broadcasterId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(body)
      }
    );
    logger.info(`Channel game updated to: ${gameId}`);
  }

  /**
   * Search for a game by name
   */
  async searchGame(gameName: string): Promise<{ id: string; name: string } | null> {
    const response = await this.request<any>(
      `/games?name=${encodeURIComponent(gameName)}`
    );
    const game = response.data?.[0];
    return game ? { id: game.id, name: game.name } : null;
  }

  /**
   * Get stream information
   */
  async getStreamInfo(): Promise<any> {
    const response = await this.request<any>(
      `/streams?user_id=${this.config.broadcasterId}`
    );
    return response.data?.[0] || null;
  }

  // ===== ANNOUNCEMENTS & ENGAGEMENT =====

  /**
   * Send a chat announcement
   */
  async sendAnnouncement(message: string, color?: 'blue' | 'green' | 'orange' | 'purple'): Promise<void> {
    await this.request(
      `/chat/announcements?broadcaster_id=${this.config.broadcasterId}&moderator_id=${this.config.broadcasterId}`,
      {
        method: 'POST',
        body: JSON.stringify({
          message,
          color: color || 'primary'
        })
      }
    );
    logger.info(`Announcement sent: ${message}`);
  }

  /**
   * Send a shoutout
   */
  async sendShoutout(targetUserId: string): Promise<void> {
    await this.request(
      `/chat/shoutouts?from_broadcaster_id=${this.config.broadcasterId}&to_broadcaster_id=${targetUserId}&moderator_id=${this.config.broadcasterId}`,
      { method: 'POST' }
    );
    logger.info(`Shoutout sent to user: ${targetUserId}`);
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username: string): Promise<{ id: string; login: string; display_name: string } | null> {
    const response = await this.request<any>(
      `/users?login=${encodeURIComponent(username)}`
    );
    return response.data?.[0] || null;
  }

  // ===== POLLS & PREDICTIONS =====

  /**
   * Get active polls
   */
  async getPolls(): Promise<any[]> {
    const response = await this.request<any>(
      `/polls?broadcaster_id=${this.config.broadcasterId}&first=1`
    );
    return response.data || [];
  }

  /**
   * End a poll
   */
  async endPoll(pollId: string, status: 'TERMINATED' | 'ARCHIVED'): Promise<void> {
    await this.request(
      '/polls',
      {
        method: 'PATCH',
        body: JSON.stringify({
          broadcaster_id: this.config.broadcasterId,
          id: pollId,
          status
        })
      }
    );
    logger.info(`Poll ended: ${pollId}`);
  }

  /**
   * Get active predictions
   */
  async getPredictions(): Promise<any[]> {
    const response = await this.request<any>(
      `/predictions?broadcaster_id=${this.config.broadcasterId}&first=1`
    );
    return response.data || [];
  }

  /**
   * Cancel a prediction
   */
  async cancelPrediction(predictionId: string): Promise<void> {
    await this.request(
      '/predictions',
      {
        method: 'PATCH',
        body: JSON.stringify({
          broadcaster_id: this.config.broadcasterId,
          id: predictionId,
          status: 'CANCELED'
        })
      }
    );
    logger.info(`Prediction canceled: ${predictionId}`);
  }

  // ===== STATUS INDICATORS =====

  /**
   * Get follower count
   */
  async getFollowerCount(): Promise<number> {
    const response = await this.request<any>(
      `/channels/followers?broadcaster_id=${this.config.broadcasterId}&first=1`
    );
    return response.total || 0;
  }

  /**
   * Get subscriber count
   */
  async getSubscriberCount(): Promise<number> {
    const response = await this.request<any>(
      `/subscriptions?broadcaster_id=${this.config.broadcasterId}&first=1`
    );
    return response.total || 0;
  }

  /**
   * Get ad schedule
   */
  async getAdSchedule(): Promise<any> {
    const response = await this.request<any>(
      `/channels/ads?broadcaster_id=${this.config.broadcasterId}`
    );
    return response.data?.[0] || null;
  }

  // ===== CHANNEL POINTS REDEMPTIONS =====

  /**
   * Get channel point redemptions
   */
  async getRedemptions(status: 'UNFULFILLED' | 'FULFILLED' = 'UNFULFILLED'): Promise<any[]> {
    // Note: This requires a specific reward_id, so we'll need to get all rewards first
    const rewards = await this.getCustomRewards();
    const allRedemptions: any[] = [];

    for (const reward of rewards) {
      const response = await this.request<any>(
        `/channel_points/custom_rewards/redemptions?broadcaster_id=${this.config.broadcasterId}&reward_id=${reward.id}&status=${status}&first=50`
      );
      allRedemptions.push(...(response.data || []));
    }

    return allRedemptions;
  }

  /**
   * Get custom rewards
   */
  async getCustomRewards(): Promise<any[]> {
    const response = await this.request<any>(
      `/channel_points/custom_rewards?broadcaster_id=${this.config.broadcasterId}`
    );
    return response.data || [];
  }

  /**
   * Update redemption status
   */
  async updateRedemptionStatus(
    rewardId: string,
    redemptionId: string,
    status: 'FULFILLED' | 'CANCELED'
  ): Promise<void> {
    await this.request(
      `/channel_points/custom_rewards/redemptions?broadcaster_id=${this.config.broadcasterId}&reward_id=${rewardId}&id=${redemptionId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status })
      }
    );
    logger.info(`Redemption ${status.toLowerCase()}: ${redemptionId}`);
  }

  /**
   * Update broadcaster ID (for when settings change)
   */
  setBroadcasterId(broadcasterId: string): void {
    this.config.broadcasterId = broadcasterId;
  }
}
