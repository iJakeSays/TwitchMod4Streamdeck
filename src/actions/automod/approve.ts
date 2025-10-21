/**
 * Approve AutoMod Action
 * Approves the next held AutoMod message
 */

import { action, KeyDownEvent, SingletonAction } from '@elgato/streamdeck';
import { TwitchClient } from '../../api/twitch-client';
import { logger } from '../../utils/logger';

@action({ UUID: 'com.twitch.moderator.tools.automod.approve' })
export class ApproveAutoModAction extends SingletonAction<any> {
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
        await ev.action.showAlert();
        logger.info('No AutoMod messages to approve');
        return;
      }

      const firstMessage = queue[0];
      await this.twitchClient.manageAutoModMessage(firstMessage.msg_id, 'ALLOW');

      await ev.action.showOk();
      logger.info(`Approved AutoMod message: ${firstMessage.msg_id}`);
    } catch (error) {
      logger.error('Failed to approve AutoMod message', error);
      await ev.action.showAlert();
    }
  }
}
