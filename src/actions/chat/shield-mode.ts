/**
 * Shield Mode Toggle Action
 * Toggles Shield Mode on/off
 */

import { action, KeyDownEvent, SingletonAction, WillAppearEvent } from '@elgato/streamdeck';
import { TwitchClient } from '../../api/twitch-client';
import { logger } from '../../utils/logger';

@action({ UUID: 'com.twitch.moderator.tools.chat.shield' })
export class ShieldModeAction extends SingletonAction<any> {
  private twitchClient: TwitchClient | null = null;
  private isEnabled: Map<string, boolean> = new Map();

  setTwitchClient(client: TwitchClient): void {
    this.twitchClient = client;
  }

  override async onWillAppear(ev: WillAppearEvent<any>): Promise<void> {
    // Get current shield mode status to sync state
    if (this.twitchClient) {
      try {
        const isActive = await this.twitchClient.getShieldModeStatus();
        this.isEnabled.set(ev.action.id, isActive);
        await ev.action.setState(isActive ? 1 : 0);
      } catch (error) {
        logger.error('Failed to get shield mode status', error);
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

      await this.twitchClient.updateShieldMode(newState);

      this.isEnabled.set(ev.action.id, newState);
      await ev.action.setState(newState ? 1 : 0);
      await ev.action.showOk();

      logger.info(`Shield mode ${newState ? 'activated' : 'deactivated'}`);
    } catch (error) {
      logger.error('Failed to toggle shield mode', error);
      await ev.action.showAlert();
    }
  }
}
