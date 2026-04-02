export const RSO_CONFIG = {
    CLIENT_ID: 'riot-client',
    REDIRECT_URI: 'http://localhost/redirect', 
    SCOPE: 'openid link ban lol_region',
    AUTH_URL: 'https://auth.riotgames.com/authorize?client_id=riot-client&redirect_uri=http%3A%2F%2Flocalhost%2Fredirect&response_type=token%20id_token&scope=openid%20link%20ban%20lol_region&nonce=1'
};

export const VALORANT_ENDPOINTS = {
    ENTITLEMENTS: 'https://entitlements.auth.riotgames.com/api/token/v1',
    USER_INFO: 'https://auth.riotgames.com/userinfo',
    REGION: 'https://riot-geo.pas.si/jasmine/v1/userinfo', // Standard endpoint to get region/shard
};
