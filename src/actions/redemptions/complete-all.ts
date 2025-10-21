/**
 * Complete All Redemptions Action
 * Fulfills all unfulfilled redemptions
 */

import { action, KeyDownEvent, SingletonAction } from '@elgato/streamdeck';
import { TwitchClient } from '../../api/twitch-client';
import { logger } from '../../utils/logger';

@action({ UUID: 'com.twitch.moderator.tools.redemption.completeall' })
export class CompleteAllRedemptionsAction extends SingletonAction<any> {
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
      const redemptions = await this.twitchClient.getRedemptions('UNFULFILLED');

      if (redemptions.length === 0) {
        await ev.action.showOk();
        logger.info('No redemptions to complete');
        return;
      }

      for (const redemption of redemptions) {
        await this.twitchClient.updateRedemptionStatus(
          redemption.reward.id,
          redemption.id,
          'FULFILLED'
        );
      }

      await ev.action.showOk();
      logger.info(`Completed ${redemptions.length} redemptions`);
    } catch (error) {
      logger.error('Failed to complete all redemptions', error);
      await ev.action.showAlert();
    }
  }
}
