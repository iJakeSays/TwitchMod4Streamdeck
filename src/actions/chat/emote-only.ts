/**
 * Emote-Only Mode Toggle Action
 * Toggles emote-only mode on/off
 */

import { action, KeyDownEvent, SingletonAction, WillAppearEvent } from '@elgato/streamdeck';
import { TwitchClient } from '../../api/twitch-client';
import { logger } from '../../utils/logger';

@action({ UUID: 'com.twitch.moderator.tools.chat.emoteonly' })
export class EmoteOnlyAction extends SingletonAction<any> {
  private twitchClient: TwitchClient | null = null;
  private isEnabled: Map<string, boolean> = new Map();

  setTwitchClient(client: TwitchClient): void {
    this.twitchClient = client;
  }

  override async onWillAppear(ev: WillAppearEvent<any>): Promise<void> {
    // Get current chat settings to sync state
    if (this.twitchClient) {
      try {
        const settings = await this.twitchClient.getChatSettings();
        const isEmoteOnly = settings.emote_mode || false;
        this.isEnabled.set(ev.action.id, isEmoteOnly);
        await ev.action.setState(isEmoteOnly ? 1 : 0);
      } catch (error) {
        logger.error('Failed to get chat settings', error);
      }
    }
  }

  override async onKeyDown(ev: KeyDownEvent<any>): Promise<void> {
    if (!this.twitchClient) {
      await ev.action.showAlert();
      logger.error('Twitch client not initialized');
      return;
    }

    try {
      const currentState = this.isEnabled.get(ev.action.id) || false;
      const newState = !currentState;

      await this.twitchClient.updateChatSettings({
        emote_mode: newState
      });

      this.isEnabled.set(ev.action.id, newState);
      await ev.action.setState(newState ? 1 : 0);
      await ev.action.showOk();

      logger.info(`Emote-only mode ${newState ? 'enabled' : 'disabled'}`);
    } catch (error) {
      logger.error('Failed to toggle emote-only mode', error);
      await ev.action.showAlert();
    }
  }
}
