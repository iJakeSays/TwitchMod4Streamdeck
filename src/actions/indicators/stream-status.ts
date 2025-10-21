/**
 * Stream Status Indicator
 * Displays stream status (live/offline) and viewer count
 */

import { action, SingletonAction, WillAppearEvent, WillDisappearEvent } from '@elgato/streamdeck';
import { TwitchClient } from '../../api/twitch-client';
import { logger } from '../../utils/logger';

@action({ UUID: 'com.twitch.moderator.tools.indicator.stream' })
export class StreamStatusIndicator extends SingletonAction<any> {
  private twitchClient: TwitchClient | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private activeActions: Set<string> = new Set();

  setTwitchClient(client: TwitchClient): void {
    this.twitchClient = client;
  }

  override async onWillAppear(ev: WillAppearEvent<any>): Promise<void> {
    this.activeActions.add(ev.action.id);

    if (!this.updateInterval && this.twitchClient) {
      this.startUpdating();
    }

    await this.updateStatus(ev.action);
  }

  override async onWillDisappear(ev: WillDisappearEvent<any>): Promise<void> {
    this.activeActions.delete(ev.action.id);

    if (this.activeActions.size === 0 && this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  private startUpdating(): void {
    this.updateInterval = setInterval(async () => {
      // Update all active instances
      for (const actionId of this.activeActions) {
        // Note: In a real implementation, we'd need to keep references to action instances
        // For now, this demonstrates the pattern
      }
    }, 60000); // Update every 60 seconds
  }

  private async updateStatus(action: any): Promise<void> {
    if (!this.twitchClient) return;

    try {
      const streamInfo = await this.twitchClient.getStreamInfo();

      if (streamInfo) {
        const viewerCount = streamInfo.viewer_count || 0;
        await action.setTitle(`LIVE\n${viewerCount} viewers`);
        await action.setState(1); // Use state 1 for "live"
      } else {
        await action.setTitle('OFFLINE');
        await action.setState(0); // Use state 0 for "offline"
      }
    } catch (error) {
      logger.error('Failed to update stream status', error);
      await action.setTitle('ERROR');
    }
  }
}
