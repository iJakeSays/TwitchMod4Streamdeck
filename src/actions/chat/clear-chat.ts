/**
 * Clear Chat Action
 * Deletes all messages from the chat
 */

import { action, KeyDownEvent, SingletonAction, WillAppearEvent } from '@elgato/streamdeck';
import { TwitchClient } from '../../api/twitch-client';
import { logger } from '../../utils/logger';

@action({ UUID: 'com.twitch.moderator.tools.chat.clear' })
export class ClearChatAction extends SingletonAction<any> {
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
      await this.twitchClient.clearChat();
      await ev.action.showOk();
      logger.info('Chat cleared successfully');
    } catch (error) {
      logger.error('Failed to clear chat', error);
      await ev.action.showAlert();
    }
  }
}
