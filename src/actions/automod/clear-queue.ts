/**
 * Clear AutoMod Queue Action
 * Approves all held AutoMod messages
 */

import { action, KeyDownEvent, SingletonAction } from '@elgato/streamdeck';
import { TwitchClient } from '../../api/twitch-client';
import { logger } from '../../utils/logger';

@action({ UUID: 'com.twitch.moderator.tools.automod.clear' })
export class ClearAutoModQueueAction extends SingletonAction<any> {
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
      const queue = await this.twitchClient.getAutoModQueue();

      if (queue.length === 0) {
        await ev.action.showOk();
        logger.info('AutoMod queue already empty');
        return;
      }

      // Approve all messages in queue
      for (const message of queue) {
        await this.twitchClient.manageAutoModMessage(message.msg_id, 'ALLOW');
      }

      await ev.action.showOk();
      logger.info(`Cleared ${queue.length} AutoMod messages`);
    } catch (error) {
      logger.error('Failed to clear AutoMod queue', error);
      await ev.action.showAlert();
    }
  }
}
