/**
 * Slow Mode Toggle Action
 * Toggles slow mode on/off with configurable duration
 */

import { action, KeyDownEvent, SingletonAction, WillAppearEvent } from '@elgato/streamdeck';
import { TwitchClient } from '../../api/twitch-client';
import { logger } from '../../utils/logger';

interface SlowModeSettings {
  slowModeDuration?: number;
}

@action({ UUID: 'com.twitch.moderator.tools.chat.slowmode' })
export class SlowModeAction extends SingletonAction<SlowModeSettings> {
  private twitchClient: TwitchClient | null = null;
  private isEnabled: Map<string, boolean> = new Map();

  setTwitchClient(client: TwitchClient): void {
    this.twitchClient = client;
  }

  override async onWillAppear(ev: WillAppearEvent<SlowModeSettings>): Promise<void> {
    // Get current chat settings to sync state
    if (this.twitchClient) {
      try {
        const settings = await this.twitchClient.getChatSettings();
        const isSlowMode = settings.slow_mode || false;
        this.isEnabled.set(ev.action.id, isSlowMode);
        await ev.action.setState(isSlowMode ? 1 : 0);
      } catch (error) {
        logger.error('Failed to get chat settings', error);
      }
    }
  }

  override async onKeyDown(ev: KeyDownEvent<SlowModeSettings>): Promise<void> {
    if (!this.twitchClient) {
      await ev.action.showAlert();
      logger.error('Twitch client not initialized');
      return;
    }

    try {
      const currentState = this.isEnabled.get(ev.action.id) || false;
      const newState = !currentState;
      const duration = ev.payload.settings.slowModeDuration || 30;

      await this.twitchClient.updateChatSettings({
        slow_mode: newState,
        slow_mode_wait_time: newState ? duration : undefined
      });

      this.isEnabled.set(ev.action.id, newState);
      await ev.action.setState(newState ? 1 : 0);
      await ev.action.showOk();

      logger.info(`Slow mode ${newState ? 'enabled' : 'disabled'} (${duration}s)`);
    } catch (error) {
      logger.error('Failed to toggle slow mode', error);
      await ev.action.showAlert();
    }
  }
}
