/**
 * Refund Redemption Action
 * Refunds/cancels the next unfulfilled redemption
 */

import { action, KeyDownEvent, SingletonAction } from '@elgato/streamdeck';
import { TwitchClient } from '../../api/twitch-client';
import { logger } from '../../utils/logger';

@action({ UUID: 'com.twitch.moderator.tools.redemption.refund' })
export class RefundRedemptionAction extends SingletonAction<any> {
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
        logger.info('No redemptions to refund');
        return;
      }

      const firstRedemption = redemptions[0];
      await this.twitchClient.updateRedemptionStatus(
        firstRedemption.reward.id,
        firstRedemption.id,
        'CANCELED'
      );

      await ev.action.showOk();
      logger.info(`Refunded redemption: ${firstRedemption.id}`);
    } catch (error) {
      logger.error('Failed to refund redemption', error);
      await ev.action.showAlert();
    }
  }
}
