/**
 * Game Category Preset Action
 * Changes the stream category to a configured game
 */

import { action, KeyDownEvent, SingletonAction, WillAppearEvent } from '@elgato/streamdeck';
import { TwitchClient } from '../../api/twitch-client';
import { logger } from '../../utils/logger';

interface GameCategorySettings {
  gameName?: string;
}

@action({ UUID: 'com.twitch.moderator.tools.stream.category1' })
export class GameCategory1Action extends SingletonAction<GameCategorySettings> {
  private twitchClient: TwitchClient | null = null;

  setTwitchClient(client: TwitchClient): void {
    this.twitchClient = client;
  }

  override async onKeyDown(ev: KeyDownEvent<GameCategorySettings>): Promise<void> {
    await this.changeCategory(ev);
  }

  private async changeCategory(ev: KeyDownEvent<GameCategorySettings>): Promise<void> {
    if (!this.twitchClient) {
      await ev.action.showAlert();
      logger.error('Twitch client not initialized');
      return;
    }

    const gameName = ev.payload.settings.gameName;
    if (!gameName) {
      await ev.action.showAlert();
      logger.error('No game name configured');
      return;
    }

    try {
      const game = await this.twitchClient.searchGame(gameName);
      if (!game) {
        await ev.action.showAlert();
        logger.error(`Game not found: ${gameName}`);
        return;
      }

      await this.twitchClient.updateChannelInfo(game.id);
      await ev.action.showOk();
      logger.info(`Changed category to: ${game.name}`);
    } catch (error) {
      logger.error('Failed to change category', error);
      await ev.action.showAlert();
    }
  }
}

@action({ UUID: 'com.twitch.moderator.tools.stream.category2' })
export class GameCategory2Action extends GameCategory1Action {}

@action({ UUID: 'com.twitch.moderator.tools.stream.category3' })
export class GameCategory3Action extends GameCategory1Action {}

@action({ UUID: 'com.twitch.moderator.tools.stream.category4' })
export class GameCategory4Action extends GameCategory1Action {}

@action({ UUID: 'com.twitch.moderator.tools.stream.category5' })
export class GameCategory5Action extends GameCategory1Action {}
