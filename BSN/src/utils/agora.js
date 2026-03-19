/**
 * Agora RTC token generation utility.
 *
 * Reads AGORA_APP_ID and AGORA_APP_CERTIFICATE from environment variables.
 * Uses the agora-access-token package (RtcTokenBuilder).
 */

let RtcTokenBuilder, RtcRole;

try {
    const agoraToken = require('agora-access-token');
    RtcTokenBuilder = agoraToken.RtcTokenBuilder;
    RtcRole = agoraToken.RtcRole;
} catch (_e) {
    try {
        const agoraToken = require('agora-token');
        RtcTokenBuilder = agoraToken.RtcTokenBuilder;
        RtcRole = agoraToken.RtcRole;
    } catch (_e2) {
        console.warn('No Agora token library available');
    }
}

const APP_ID = process.env.AGORA_APP_ID;
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

/**
 * Generate an Agora RTC token for a user joining a channel.
 *
 * @param {string} channelName - The channel/conference name
 * @param {number|string} uid  - User identifier (0 for wildcard)
 * @param {string} role        - 'publisher' or 'subscriber'
 * @param {number} ttlSeconds  - Token lifetime in seconds (default: 3600)
 * @returns {{ token: string, appId: string } | null}
 */
function generateRtcToken(channelName, uid = 0, role = 'publisher', ttlSeconds = 3600) {
    if (!RtcTokenBuilder || !APP_ID || !APP_CERTIFICATE) {
        console.warn('Agora not configured — returning null token');
        return null;
    }

    const agoraRole = role === 'subscriber' ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER;
    const expirationTimeInSeconds = Math.floor(Date.now() / 1000) + ttlSeconds;
    const privilegeExpiredTs = expirationTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
        APP_ID,
        APP_CERTIFICATE,
        channelName,
        typeof uid === 'string' ? 0 : uid,
        agoraRole,
        privilegeExpiredTs
    );

    return { token, appId: APP_ID };
}

module.exports = { generateRtcToken };
