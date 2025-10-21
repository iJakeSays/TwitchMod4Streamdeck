/**
 * Create Clip Action
 * Creates a clip of the current stream
 */

import { action, KeyDownEvent, SingletonAction } from '@elgato/streamdeck';
import { TwitchClient } from '../../api/twitch-client';
import { logger } from '../../utils/logger';

@action({ UUID: 'com.twitch.moderator.tools.stream.clip' })
export class CreateClipAction extends SingletonAction<any> {
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
      const clip = await this.twitchClient.createClip();
      await ev.action.showOk();
      logger.info(`Clip created: ${clip.id} - ${clip.edit_url}`);
    } catch (error) {
      logger.error('Failed to create clip', error);
      await ev.action.showAlert();
    }
  }
}
