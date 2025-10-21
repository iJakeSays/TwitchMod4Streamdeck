/**
 * Shoutout Preset Actions
 * Sends shoutouts to configured streamers
 */

import { action, KeyDownEvent, SingletonAction } from '@elgato/streamdeck';
import { TwitchClient } from '../../api/twitch-client';
import { logger } from '../../utils/logger';

interface ShoutoutSettings {
  username?: string;
}

class BaseShoutoutAction extends SingletonAction<ShoutoutSettings> {
  protected twitchClient: TwitchClient | null = null;

  setTwitchClient(client: TwitchClient): void {
    this.twitchClient = client;
  }

  override async onKeyDown(ev: KeyDownEvent<ShoutoutSettings>): Promise<void> {
    if (!this.twitchClient) {
      await ev.action.showAlert();
      logger.error('Twitch client not initialized');
      return;
    }

    const username = ev.payload.settings.username;
    if (!username) {
      await ev.action.showAlert();
      logger.error('No username configured');
      return;
    }

    try {
      const user = await this.twitchClient.getUserByUsername(username);
      if (!user) {
        await ev.action.showAlert();
        logger.error(`User not found: ${username}`);
        return;
      }

      await this.twitchClient.sendShoutout(user.id);
      await ev.action.showOk();
      logger.info(`Sent shoutout to: ${user.display_name}`);
    } catch (error) {
      logger.error('Failed to send shoutout', error);
      await ev.action.showAlert();
    }
  }
}

@action({ UUID: 'com.twitch.moderator.tools.shoutout1' })
export class Shoutout1Action extends BaseShoutoutAction {}

@action({ UUID: 'com.twitch.moderator.tools.shoutout2' })
export class Shoutout2Action extends BaseShoutoutAction {}

@action({ UUID: 'com.twitch.moderator.tools.shoutout3' })
export class Shoutout3Action extends BaseShoutoutAction {}

@action({ UUID: 'com.twitch.moderator.tools.shoutout4' })
export class Shoutout4Action extends BaseShoutoutAction {}

@action({ UUID: 'com.twitch.moderator.tools.shoutout5' })
export class Shoutout5Action extends BaseShoutoutAction {}
