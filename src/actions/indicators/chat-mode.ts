/**
 * Chat Mode Indicator
 * Displays which chat modes are currently active
 * S = Slow Mode, E = Emote Only, F = Followers Only, R = R9K (Unique Chat)
 */

import { action, SingletonAction, WillAppearEvent, WillDisappearEvent, Action } from '@elgato/streamdeck';
import { TwitchClient } from '../../api/twitch-client';
import { logger } from '../../utils/logger';

interface IndicatorSettings {
  // No specific settings for this indicator
}

@action({ UUID: 'com.twitch.moderator-tools.indicator.chatmode' })
export class ChatModeIndicator extends SingletonAction<IndicatorSettings> {
  private twitchClient: TwitchClient | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private activeActions: Map<string, Action<IndicatorSettings>> = new Map();
  private readonly UPDATE_INTERVAL = 30000; // 30 seconds

  setTwitchClient(client: TwitchClient): void {
    this.twitchClient = client;
  }

  override async onWillAppear(ev: WillAppearEvent<IndicatorSettings>): Promise<void> {
    this.activeActions.set(ev.action.id, ev.action);

    // Start interval if not running
    if (!this.updateInterval) {
      this.startUpdating();
    }

    // Initial update
    await this.updateStatus(ev.action);
  }

  override async onWillDisappear(ev: WillDisappearEvent<IndicatorSettings>): Promise<void> {
    this.activeActions.delete(ev.action.id);

    // Stop interval if no active actions
    if (this.activeActions.size === 0 && this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  private startUpdating(): void {
    this.updateInterval = setInterval(async () => {
      for (const [, actionInstance] of this.activeActions) {
        await this.updateStatus(actionInstance);
      }
    }, this.UPDATE_INTERVAL);
  }

  private async updateStatus(action: Action<IndicatorSettings>): Promise<void> {
    if (!this.twitchClient) {
      await action.setTitle('No Auth');
      return;
    }

    try {
      const settings = await this.twitchClient.getChatSettings();

      const modes: string[] = [];

      if (settings.slow_mode) {
        modes.push(`S:${settings.slow_mode_wait_time}s`);
      }
      if (settings.emote_mode) {
        modes.push('E');
      }
      if (settings.follower_mode) {
        const duration = settings.follower_mode_duration;
        modes.push(duration ? `F:${duration}m` : 'F');
      }
      if (settings.unique_chat_mode) {
        modes.push('R9K');
      }
      if (settings.subscriber_mode) {
        modes.push('SUB');
      }

      if (modes.length === 0) {
        await action.setTitle('Chat\nOpen');
      } else {
        // Display active modes, max 2 per line for readability
        const displayText = modes.slice(0, 4).join(' ');
        await action.setTitle(`CHAT\n${displayText}`);
      }
    } catch (error) {
      logger.error('Failed to update chat mode indicator', error);
      await action.setTitle('ERROR');
    }
  }
}
