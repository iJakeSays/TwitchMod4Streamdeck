/**
 * Shield Mode Status Indicator
 * Displays whether Shield Mode is active or inactive
 */

import { action, SingletonAction, WillAppearEvent, WillDisappearEvent, Action } from '@elgato/streamdeck';
import { TwitchClient } from '../../api/twitch-client';
import { logger } from '../../utils/logger';

interface IndicatorSettings {
  // No specific settings for this indicator
}

@action({ UUID: 'com.twitch.moderator-tools.indicator.shield' })
export class ShieldStatusIndicator extends SingletonAction<IndicatorSettings> {
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
      const isActive = await this.twitchClient.getShieldModeStatus();

      if (isActive) {
        await action.setTitle('SHIELD\nACTIVE');
        await action.setState(1); // Active state
      } else {
        await action.setTitle('Shield\nOff');
        await action.setState(0); // Inactive state
      }
    } catch (error) {
      logger.error('Failed to update shield mode status', error);
      await action.setTitle('ERROR');
    }
  }
}
