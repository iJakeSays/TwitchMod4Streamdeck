/**
 * SVG icon generator for Stream Deck buttons
 * Generates placeholder SVG icons for all actions
 */

export interface IconConfig {
  backgroundColor?: string;
  foregroundColor?: string;
  text?: string;
  icon?: string;
}

/**
 * Generate a simple SVG icon with text or symbol
 */
export function generateSVG(config: IconConfig): string {
  const {
    backgroundColor = '#2c2c2c',
    foregroundColor = '#ffffff',
    text = '',
    icon = ''
  } = config;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="144" height="144" viewBox="0 0 144 144" xmlns="http://www.w3.org/2000/svg">
  <rect width="144" height="144" fill="${backgroundColor}"/>
  ${icon ? icon : ''}
  ${text ? `<text x="72" y="80" font-family="Arial, sans-serif" font-size="16" fill="${foregroundColor}" text-anchor="middle" font-weight="bold">${text}</text>` : ''}
</svg>`;
}

/**
 * Predefined icon generators for each action type
 */
export const icons = {
  clearChat: () => generateSVG({
    backgroundColor: '#e74c3c',
    text: 'CLEAR',
    icon: '<circle cx="72" cy="50" r="25" stroke="#ffffff" stroke-width="3" fill="none"/><line x1="55" y1="33" x2="89" y2="67" stroke="#ffffff" stroke-width="3"/>'
  }),

  slowMode: (active: boolean) => generateSVG({
    backgroundColor: active ? '#27ae60' : '#95a5a6',
    text: active ? 'SLOW\nON' : 'SLOW\nOFF',
    icon: '<path d="M72 30 L72 60 L90 75" stroke="#ffffff" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="72" cy="60" r="30" stroke="#ffffff" stroke-width="3" fill="none"/>'
  }),

  emoteOnly: (active: boolean) => generateSVG({
    backgroundColor: active ? '#27ae60' : '#95a5a6',
    text: active ? 'EMOTE\nON' : 'EMOTE\nOFF',
    icon: '<circle cx="72" cy="50" r="25" stroke="#ffffff" stroke-width="3" fill="none"/><circle cx="62" cy="45" r="3" fill="#ffffff"/><circle cx="82" cy="45" r="3" fill="#ffffff"/><path d="M55 60 Q72 70 89 60" stroke="#ffffff" stroke-width="3" fill="none"/>'
  }),

  shieldMode: (active: boolean) => generateSVG({
    backgroundColor: active ? '#27ae60' : '#e74c3c',
    text: active ? 'SHIELD\nON' : 'SHIELD\nOFF',
    icon: '<path d="M72 25 L95 35 L95 60 Q95 80 72 95 Q49 80 49 60 L49 35 Z" stroke="#ffffff" stroke-width="3" fill="none"/>'
  }),

  approveAutomod: () => generateSVG({
    backgroundColor: '#27ae60',
    text: 'APPROVE',
    icon: '<path d="M55 65 L65 75 L85 45" stroke="#ffffff" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
  }),

  denyAutomod: () => generateSVG({
    backgroundColor: '#e74c3c',
    text: 'DENY',
    icon: '<line x1="55" y1="45" x2="89" y2="75" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/><line x1="89" y1="45" x2="55" y2="75" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>'
  }),

  clearAutomod: () => generateSVG({
    backgroundColor: '#f39c12',
    text: 'CLEAR\nQUEUE',
    icon: '<rect x="55" y="35" width="34" height="40" stroke="#ffffff" stroke-width="3" fill="none"/><line x1="60" y1="30" x2="60" y2="35" stroke="#ffffff" stroke-width="3"/><line x1="84" y1="30" x2="84" y2="35" stroke="#ffffff" stroke-width="3"/><line x1="65" y1="28" x2="79" y2="28" stroke="#ffffff" stroke-width="3"/>'
  }),

  streamMarker: () => generateSVG({
    backgroundColor: '#9b59b6',
    text: 'MARKER',
    icon: '<path d="M72 30 L72 70 M55 60 L72 70 L89 60" stroke="#ffffff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
  }),

  createClip: () => generateSVG({
    backgroundColor: '#e67e22',
    text: 'CLIP',
    icon: '<rect x="50" y="40" width="44" height="35" rx="3" stroke="#ffffff" stroke-width="3" fill="none"/><circle cx="72" cy="57" r="8" fill="#ffffff"/>'
  }),

  gameCategory: (gameName?: string) => generateSVG({
    backgroundColor: '#3498db',
    text: gameName || 'GAME',
    icon: '<rect x="55" y="35" width="34" height="24" rx="2" stroke="#ffffff" stroke-width="2" fill="none"/><circle cx="63" cy="65" r="4" stroke="#ffffff" stroke-width="2" fill="none"/><circle cx="81" cy="65" r="4" stroke="#ffffff" stroke-width="2" fill="none"/>'
  }),

  announcement: (color: string) => generateSVG({
    backgroundColor: color,
    text: 'ANNOUNCE',
    icon: '<path d="M50 50 L65 50 L75 40 L75 70 L65 60 L50 60 Z" stroke="#ffffff" stroke-width="2" fill="none"/><path d="M80 45 Q85 50 80 55 M85 40 Q92 50 85 60" stroke="#ffffff" stroke-width="2" fill="none"/>'
  }),

  shoutout: (streamerName?: string) => generateSVG({
    backgroundColor: '#9b59b6',
    text: streamerName || 'SHOUTOUT',
    icon: '<polygon points="72,35 78,55 98,55 82,67 88,87 72,75 56,87 62,67 46,55 66,55" stroke="#ffffff" stroke-width="2" fill="none"/>'
  }),

  poll: () => generateSVG({
    backgroundColor: '#1abc9c',
    text: 'END\nPOLL',
    icon: '<rect x="55" y="40" width="10" height="30" fill="#ffffff"/><rect x="70" y="35" width="10" height="35" fill="#ffffff"/><rect x="85" y="45" width="10" height="25" fill="#ffffff"/>'
  }),

  prediction: () => generateSVG({
    backgroundColor: '#e74c3c',
    text: 'CANCEL\nPRED',
    icon: '<circle cx="72" cy="50" r="25" stroke="#ffffff" stroke-width="3" fill="none"/><text x="72" y="60" font-family="Arial" font-size="24" fill="#ffffff" text-anchor="middle">?</text>'
  }),

  redemption: () => generateSVG({
    backgroundColor: '#f39c12',
    text: 'REDEEM',
    icon: '<rect x="55" y="40" width="34" height="30" stroke="#ffffff" stroke-width="3" fill="none"/><path d="M65 40 L65 32 L79 32 L79 40" stroke="#ffffff" stroke-width="3" fill="none"/><circle cx="72" cy="55" r="5" fill="#ffffff"/>'
  }),

  streamStatus: (isLive: boolean, viewers?: number) => generateSVG({
    backgroundColor: isLive ? '#27ae60' : '#e74c3c',
    text: isLive ? `LIVE\n${viewers || ''}` : 'OFFLINE',
    icon: `<circle cx="72" cy="40" r="8" fill="${isLive ? '#ff0000' : '#666666'}"/>`
  }),

  followerCount: (count?: number) => generateSVG({
    backgroundColor: '#3498db',
    text: count !== undefined ? `${count}\nFollowers` : 'Followers',
    icon: '<path d="M72 35 Q77 30 82 35 Q87 40 82 45 L72 55 L62 45 Q57 40 62 35 Q67 30 72 35" stroke="#ffffff" stroke-width="2" fill="none"/>'
  }),

  subCount: (count?: number) => generateSVG({
    backgroundColor: '#9b59b6',
    text: count !== undefined ? `${count}\nSubs` : 'Subs',
    icon: '<polygon points="72,32 78,45 92,45 81,53 85,66 72,58 59,66 63,53 52,45 66,45" stroke="#ffffff" stroke-width="2" fill="none"/>'
  }),

  chatMode: (modes: string) => generateSVG({
    backgroundColor: '#34495e',
    text: `MODES\n${modes}`,
    icon: '<rect x="50" y="35" width="44" height="30" rx="3" stroke="#ffffff" stroke-width="2" fill="none"/>'
  })
};
