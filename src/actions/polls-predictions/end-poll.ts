/**
 * End Poll Action
 * Ends the currently active poll
 */

import { action, KeyDownEvent, SingletonAction } from '@elgato/streamdeck';
import { TwitchClient } from '../../api/twitch-client';
import { logger } from '../../utils/logger';

@action({ UUID: 'com.twitch.moderator.tools.poll.end' })
export class EndPollAction extends SingletonAction<any> {
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
      const polls = await this.twitchClient.getPolls();
      const activePoll = polls.find(p => p.status === 'ACTIVE');

      if (!activePoll) {
        await ev.action.showAlert();
        logger.info('No active poll to end');
        return;
      }

      await this.twitchClient.endPoll(activePoll.id, 'TERMINATED');
      await ev.action.showOk();
      logger.info(`Ended poll: ${activePoll.id}`);
    } catch (error) {
      logger.error('Failed to end poll', error);
      await ev.action.showAlert();
    }
  }
}
