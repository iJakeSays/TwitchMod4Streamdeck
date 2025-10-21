/**
 * Fulfill Redemption Action
 * Fulfills the next unfulfilled channel point redemption
 */

import { action, KeyDownEvent, SingletonAction } from '@elgato/streamdeck';
import { TwitchClient } from '../../api/twitch-client';
import { logger } from '../../utils/logger';

@action({ UUID: 'com.twitch.moderator.tools.redemption.fulfill' })
export class FulfillRedemptionAction extends SingletonAction<any> {
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
        await ev.action.showAlert();
        logger.info('No redemptions to fulfill');
        return;
      }

      const firstRedemption = redemptions[0];
      await this.twitchClient.updateRedemptionStatus(
        firstRedemption.reward.id,
        firstRedemption.id,
        'FULFILLED'
      );

      await ev.action.showOk();
      logger.info(`Fulfilled redemption: ${firstRedemption.id}`);
    } catch (error) {
      logger.error('Failed to fulfill redemption', error);
      await ev.action.showAlert();
    }
  }
}
