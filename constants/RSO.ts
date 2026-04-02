export const RSO_CONFIG = {
    CLIENT_ID: 'riot-client',
    REDIRECT_URI: 'http://localhost/redirect',
    SCOPE: 'openid link ban lol_region',
    // Using riot-client ID which is more stable for third-party apps
    AUTH_URL: 'https://auth.riotgames.com/authorize?client_id=riot-client&nonce=1&redirect_uri=http%3A%2F%2Flocalhost%2Fredirect&response_type=token%20id_token&scope=openid%20link%20ban%20lol_region'
};

export const VALORANT_ENDPOINTS = {
    ENTITLEMENTS: 'https://entitlements.auth.riotgames.com/api/token/v1',
    USER_INFO: 'https://auth.riotgames.com/userinfo',
};
