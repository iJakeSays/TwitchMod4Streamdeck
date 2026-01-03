/**
 * Next Ad Timer Indicator
 * Displays countdown to the next scheduled ad
 */

import { action, SingletonAction, WillAppearEvent, WillDisappearEvent, Action } from '@elgato/streamdeck';
import { TwitchClient } from '../../api/twitch-client';
import { logger } from '../../utils/logger';

interface IndicatorSettings {
  // No specific settings for this indicator
}

interface AdSchedule {
  next_ad_at?: string;
  last_ad_at?: string;
  duration?: number;
  preroll_free_time?: number;
  snooze_count?: number;
  snooze_refresh_at?: string;
}

@action({ UUID: 'com.twitch.moderator-tools.indicator.ad' })
export class NextAdIndicator extends SingletonAction<IndicatorSettings> {
  private twitchClient: TwitchClient | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private activeActions: Map<string, Action<IndicatorSettings>> = new Map();
  private readonly UPDATE_INTERVAL = 30000; // 30 seconds
  private cachedSchedule: AdSchedule | null = null;
  private lastCacheTime = 0;
  private readonly CACHE_DURATION = 60000; // Cache schedule for 60 seconds

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
      this.cachedSchedule = null;
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
      // Get ad schedule (with caching)
      const now = Date.now();
      if (!this.cachedSchedule || (now - this.lastCacheTime) > this.CACHE_DURATION) {
        this.cachedSchedule = await this.twitchClient.getAdSchedule();
        this.lastCacheTime = now;
      }

      if (!this.cachedSchedule) {
        await action.setTitle('No Ads\nScheduled');
        return;
      }

      const schedule = this.cachedSchedule;

      if (schedule.next_ad_at) {
        const remaining = this.getTimeRemaining(schedule.next_ad_at);
        if (remaining === 'NOW') {
          await action.setTitle('AD\nNOW!');
        } else {
          await action.setTitle(`Next Ad\n${remaining}`);
        }
      } else if (schedule.preroll_free_time && schedule.preroll_free_time > 0) {
        // Show preroll-free time remaining
        const minutes = Math.floor(schedule.preroll_free_time / 60);
        await action.setTitle(`PreRoll\nFree ${minutes}m`);
      } else {
        await action.setTitle('Ads\nReady');
      }
    } catch (error) {
      logger.error('Failed to update ad schedule', error);
      await action.setTitle('ERROR');
    }
  }

  private getTimeRemaining(nextAdAt: string): string {
    const adTime = new Date(nextAdAt).getTime();
    const now = Date.now();
    const remaining = adTime - now;

    if (remaining <= 0) {
      return 'NOW';
    }

    const seconds = Math.floor(remaining / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    } else if (minutes > 0) {
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  }
}
