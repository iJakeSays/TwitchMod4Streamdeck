/**
 * AutoMod Level Display
 * Displays the current AutoMod level (0-4)
 */

import { action, SingletonAction, WillAppearEvent, WillDisappearEvent, Action } from '@elgato/streamdeck';
import { TwitchClient } from '../../api/twitch-client';
import { logger } from '../../utils/logger';

interface IndicatorSettings {
  // No specific settings for this indicator
}

@action({ UUID: 'com.twitch.moderator-tools.indicator.automod' })
export class AutoModLevelIndicator extends SingletonAction<IndicatorSettings> {
  private twitchClient: TwitchClient | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private activeActions: Map<string, Action<IndicatorSettings>> = new Map();
  private readonly UPDATE_INTERVAL = 60000; // 60 seconds

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
      const settings = await this.twitchClient.getAutoModSettings();

      // AutoMod overall level (0-4)
      const level = settings.overall_level ?? 'N/A';

      // Display level with description
      let description = '';
      switch (level) {
        case 0:
          description = 'Off';
          break;
        case 1:
          description = 'Low';
          break;
        case 2:
          description = 'Medium';
          break;
        case 3:
          description = 'High';
          break;
        case 4:
          description = 'Max';
          break;
        default:
          description = 'Custom';
      }

      await action.setTitle(`AutoMod\nLv ${level}\n${description}`);
    } catch (error) {
      logger.error('Failed to update AutoMod level', error);
      await action.setTitle('ERROR');
    }
  }
}
