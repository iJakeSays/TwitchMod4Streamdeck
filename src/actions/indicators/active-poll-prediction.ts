/**
 * Active Poll/Prediction Indicator
 * Displays whether a poll or prediction is currently active
 */

import { action, SingletonAction, WillAppearEvent, WillDisappearEvent, Action } from '@elgato/streamdeck';
import { TwitchClient } from '../../api/twitch-client';
import { logger } from '../../utils/logger';

interface IndicatorSettings {
  // No specific settings for this indicator
}

@action({ UUID: 'com.twitch.moderator-tools.indicator.active' })
export class ActivePollPredictionIndicator extends SingletonAction<IndicatorSettings> {
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
      // Check for active polls and predictions in parallel
      const [polls, predictions] = await Promise.all([
        this.twitchClient.getPolls(),
        this.twitchClient.getPredictions()
      ]);

      // Find active poll (status: ACTIVE)
      const activePoll = polls.find((p: any) => p.status === 'ACTIVE');

      // Find active prediction (status: ACTIVE or LOCKED)
      const activePrediction = predictions.find(
        (p: any) => p.status === 'ACTIVE' || p.status === 'LOCKED'
      );

      if (activePoll && activePrediction) {
        // Both active
        await action.setTitle('POLL &\nPRED\nACTIVE');
      } else if (activePoll) {
        // Only poll active
        const remaining = this.getTimeRemaining(activePoll.ends_at);
        await action.setTitle(`POLL\n${remaining}`);
      } else if (activePrediction) {
        // Only prediction active
        const status = activePrediction.status === 'LOCKED' ? 'LOCKED' : 'ACTIVE';
        await action.setTitle(`PRED\n${status}`);
      } else {
        // None active
        await action.setTitle('No\nActive');
      }
    } catch (error) {
      logger.error('Failed to update poll/prediction status', error);
      await action.setTitle('ERROR');
    }
  }

  private getTimeRemaining(endsAt: string): string {
    const endTime = new Date(endsAt).getTime();
    const now = Date.now();
    const remaining = Math.max(0, endTime - now);

    const seconds = Math.floor(remaining / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  }
}
