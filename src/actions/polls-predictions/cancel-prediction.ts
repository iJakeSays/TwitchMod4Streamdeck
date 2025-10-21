/**
 * Cancel Prediction Action
 * Cancels the currently active prediction
 */

import { action, KeyDownEvent, SingletonAction } from '@elgato/streamdeck';
import { TwitchClient } from '../../api/twitch-client';
import { logger } from '../../utils/logger';

@action({ UUID: 'com.twitch.moderator.tools.prediction.cancel' })
export class CancelPredictionAction extends SingletonAction<any> {
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
      const predictions = await this.twitchClient.getPredictions();
      const activePrediction = predictions.find(p => p.status === 'ACTIVE' || p.status === 'LOCKED');

      if (!activePrediction) {
        await ev.action.showAlert();
        logger.info('No active prediction to cancel');
        return;
      }

      await this.twitchClient.cancelPrediction(activePrediction.id);
      await ev.action.showOk();
      logger.info(`Canceled prediction: ${activePrediction.id}`);
    } catch (error) {
      logger.error('Failed to cancel prediction', error);
      await ev.action.showAlert();
    }
  }
}
