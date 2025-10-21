/**
 * Announcement Actions
 * Sends colored announcements to chat
 */

import { action, KeyDownEvent, SingletonAction } from '@elgato/streamdeck';
import { TwitchClient } from '../../api/twitch-client';
import { logger } from '../../utils/logger';

interface AnnouncementSettings {
  message?: string;
}

class BaseAnnouncementAction extends SingletonAction<AnnouncementSettings> {
  protected twitchClient: TwitchClient | null = null;
  protected color: 'blue' | 'green' | 'orange' | 'purple' = 'blue';
  protected defaultMessage: string = '';

  setTwitchClient(client: TwitchClient): void {
    this.twitchClient = client;
  }

  override async onKeyDown(ev: KeyDownEvent<AnnouncementSettings>): Promise<void> {
    if (!this.twitchClient) {
      await ev.action.showAlert();
      logger.error('Twitch client not initialized');
      return;
    }

    const message = ev.payload.settings.message || this.defaultMessage;
    if (!message) {
      await ev.action.showAlert();
      logger.error('No announcement message configured');
      return;
    }

    try {
      await this.twitchClient.sendAnnouncement(message, this.color);
      await ev.action.showOk();
      logger.info(`Sent ${this.color} announcement: ${message}`);
    } catch (error) {
      logger.error('Failed to send announcement', error);
      await ev.action.showAlert();
    }
  }
}

@action({ UUID: 'com.twitch.moderator.tools.announcement.blue' })
export class BlueAnnouncementAction extends BaseAnnouncementAction {
  protected color: 'blue' | 'green' | 'orange' | 'purple' = 'blue';
  protected defaultMessage = 'Stream event happening now!';
}

@action({ UUID: 'com.twitch.moderator.tools.announcement.purple' })
export class PurpleAnnouncementAction extends BaseAnnouncementAction {
  protected color: 'blue' | 'green' | 'orange' | 'purple' = 'purple';
  protected defaultMessage = 'Please follow the chat rules!';
}

@action({ UUID: 'com.twitch.moderator.tools.announcement.orange' })
export class OrangeAnnouncementAction extends BaseAnnouncementAction {
  protected color: 'blue' | 'green' | 'orange' | 'purple' = 'orange';
  protected defaultMessage = 'Taking a short break, be right back!';
}

@action({ UUID: 'com.twitch.moderator.tools.announcement.green' })
export class GreenAnnouncementAction extends BaseAnnouncementAction {
  protected color: 'blue' | 'green' | 'orange' | 'purple' = 'green';
  protected defaultMessage = 'Thanks for watching! Stream ending soon.';
}
