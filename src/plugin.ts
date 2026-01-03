/**
 * Twitch Moderator Tools - Stream Deck Plugin
 * Main entry point
 */

import streamDeck, { LogLevel } from '@elgato/streamdeck';
import { TwitchAuth } from './api/auth';
import { TwitchClient } from './api/twitch-client';
import { logger } from './utils/logger';

// Import all actions
import { ClearChatAction } from './actions/chat/clear-chat';
import { SlowModeAction } from './actions/chat/slow-mode';
import { EmoteOnlyAction } from './actions/chat/emote-only';
import { ShieldModeAction } from './actions/chat/shield-mode';

import { ApproveAutoModAction } from './actions/automod/approve';
import { DenyAutoModAction } from './actions/automod/deny';
import { ClearAutoModQueueAction } from './actions/automod/clear-queue';

import { StreamMarkerAction } from './actions/stream/marker';
import { CreateClipAction } from './actions/stream/clip';
import {
  GameCategory1Action,
  GameCategory2Action,
  GameCategory3Action,
  GameCategory4Action,
  GameCategory5Action
} from './actions/stream/game-category';

import {
  BlueAnnouncementAction,
  PurpleAnnouncementAction,
  OrangeAnnouncementAction,
  GreenAnnouncementAction
} from './actions/announcements/announcement';

import {
  Shoutout1Action,
  Shoutout2Action,
  Shoutout3Action,
  Shoutout4Action,
  Shoutout5Action
} from './actions/announcements/shoutout';

import { EndPollAction } from './actions/polls-predictions/end-poll';
import { CancelPredictionAction } from './actions/polls-predictions/cancel-prediction';

import { FulfillRedemptionAction } from './actions/redemptions/fulfill';
import { RefundRedemptionAction } from './actions/redemptions/refund';
import { CompleteAllRedemptionsAction } from './actions/redemptions/complete-all';

import { StreamStatusIndicator } from './actions/indicators/stream-status';
import { FollowerCountIndicator } from './actions/indicators/follower-count';
import { SubCountIndicator } from './actions/indicators/sub-count';
import { ChatModeIndicator } from './actions/indicators/chat-mode';
import { ShieldStatusIndicator } from './actions/indicators/shield-status';
import { AutoModLevelIndicator } from './actions/indicators/automod-level';
import { ActivePollPredictionIndicator } from './actions/indicators/active-poll-prediction';
import { NextAdIndicator } from './actions/indicators/next-ad';

// Global state
let twitchAuth: TwitchAuth | null = null;
let twitchClient: TwitchClient | null = null;
let globalSettings: any = {};

/**
 * Initialize the Twitch client with saved settings
 */
async function initializeTwitchClient(): Promise<void> {
  logger.info('Initializing Twitch client...');

  const clientId = globalSettings.clientId;
  const broadcasterId = globalSettings.broadcasterId;
  const tokens = globalSettings.tokens;

  if (!clientId) {
    logger.warn('No client ID configured');
    return;
  }

  if (!broadcasterId) {
    logger.warn('No broadcaster ID configured');
    return;
  }

  // Initialize auth
  twitchAuth = new TwitchAuth({
    clientId,
    redirectUri: 'http://localhost:3000/callback',
    scopes: [
      'moderator:manage:chat_messages',
      'moderator:manage:chat_settings',
      'moderator:manage:automod',
      'moderator:manage:shield_mode',
      'channel:manage:broadcast',
      'clips:edit',
      'moderator:read:followers',
      'channel:read:subscriptions',
      'channel:read:redemptions',
      'channel:manage:redemptions',
      'moderator:manage:announcements',
      'moderator:manage:shoutouts',
      'channel:manage:polls',
      'channel:manage:predictions',
      'channel:read:ads'
    ]
  });

  // Load saved tokens if available
  if (tokens) {
    twitchAuth.setTokens(tokens);
    logger.info('Loaded saved authentication tokens');
  }

  // Initialize client
  twitchClient = new TwitchClient({
    clientId,
    auth: twitchAuth,
    broadcasterId
  });

  // Set the Twitch client on all action instances
  setTwitchClientOnActions();

  logger.info('Twitch client initialized successfully');
}

/**
 * Set the Twitch client on all action instances
 */
function setTwitchClientOnActions(): void {
  if (!twitchClient) return;

  const actions = [
    ClearChatAction,
    SlowModeAction,
    EmoteOnlyAction,
    ShieldModeAction,
    ApproveAutoModAction,
    DenyAutoModAction,
    ClearAutoModQueueAction,
    StreamMarkerAction,
    CreateClipAction,
    GameCategory1Action,
    GameCategory2Action,
    GameCategory3Action,
    GameCategory4Action,
    GameCategory5Action,
    BlueAnnouncementAction,
    PurpleAnnouncementAction,
    OrangeAnnouncementAction,
    GreenAnnouncementAction,
    Shoutout1Action,
    Shoutout2Action,
    Shoutout3Action,
    Shoutout4Action,
    Shoutout5Action,
    EndPollAction,
    CancelPredictionAction,
    FulfillRedemptionAction,
    RefundRedemptionAction,
    CompleteAllRedemptionsAction,
    StreamStatusIndicator,
    FollowerCountIndicator,
    SubCountIndicator,
    ChatModeIndicator,
    ShieldStatusIndicator,
    AutoModLevelIndicator,
    ActivePollPredictionIndicator,
    NextAdIndicator
  ];

  // Note: In the actual Stream Deck SDK, we'd get instances differently
  // This is a simplified version for demonstration
  logger.info(`Setting Twitch client on ${actions.length} action types`);
}

/**
 * Handle global settings changes
 */
streamDeck.settings.onDidReceiveGlobalSettings((event) => {
  globalSettings = event.settings || {};
  logger.info('Global settings updated:', Object.keys(globalSettings));

  // Re-initialize client if settings changed
  initializeTwitchClient().catch((error) => {
    logger.error('Failed to initialize Twitch client', error);
  });
});

/**
 * Plugin initialization
 */
streamDeck.logger.setLevel(LogLevel.DEBUG);
logger.info('Twitch Moderator Tools plugin starting...');

// Request global settings on startup
streamDeck.settings.getGlobalSettings().then((settings) => {
  globalSettings = settings || {};
  logger.info('Loaded global settings');

  // Initialize Twitch client
  return initializeTwitchClient();
}).catch((error) => {
  logger.error('Failed to load global settings', error);
});

// Connect to Stream Deck
export default streamDeck;
