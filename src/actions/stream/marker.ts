/**
 * Create Stream Marker Action
 * Creates a stream marker at the current timestamp
 */

import { action, KeyDownEvent, SingletonAction } from '@elgato/streamdeck';
import { TwitchClient } from '../../api/twitch-client';
import { logger } from '../../utils/logger';

@action({ UUID: 'com.twitch.moderator.tools.stream.marker' })
export class StreamMarkerAction extends SingletonAction<any> {
  private twitchClient: TwitchClient | null = null;

  setTwitchClient(client: TwitchClient): void {
    this.twitchClient = client;
  }

  override async onKeyDown(ev: KeyDownEvent<any>): Promise<void> {
    if (!this.twitchClient) {
      await ev.action.showAlert();
      logger.error('Twitch client not initialized');
      return;
    }

    try {
      const markerId = await this.twitchClient.createStreamMarker();
      await ev.action.showOk();
      logger.info(`Stream marker created: ${markerId}`);
    } catch (error) {
      logger.error('Failed to create stream marker', error);
      await ev.action.showAlert();
    }
  }
}
