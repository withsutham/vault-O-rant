import { VALORANT_ENDPOINTS } from '../constants/RSO';
import { getTokens, deleteTokens } from '../utils/secureStore';
import { getClientVersion } from './mappingService';

const CLIENT_PLATFORM = 'ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIldpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogIlVua25vd24iDQp9';
const USER_AGENT = 'ShooterGame/13 Windows/10.0.19042.1.256.64bit';

const getRiotHeaders = async () => {
    const version = await getClientVersion();
    const { accessToken, entitlementsToken } = await getTokens();
    
    // Diagnostic logging
    console.log(`[Headers] Retrieving authentication headers...`);
    console.log(`[Headers] Access Token Length: ${accessToken ? accessToken.length : 0} chars ${!accessToken ? '⚠️ MISSING' : '✓'}`);
    console.log(`[Headers] Entitlements Token Length: ${entitlementsToken ? entitlementsToken.length : 0} chars ${!entitlementsToken ? '⚠️ MISSING' : '✓'}`);
    console.log(`[Headers] Client Version: ${version}`);
    
    return {
        'Authorization': `Bearer ${accessToken}`,
        'X-Riot-Entitlements-JWT': entitlementsToken || '',
        'X-Riot-ClientPlatform': CLIENT_PLATFORM,
        'X-Riot-ClientVersion': version,
        'User-Agent': USER_AGENT,
        'Content-Type': 'application/json',
    };
};

const fetchWithTimeout = async (resource: string, options: any = {}, timeout = 8000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(resource, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (e) {
        clearTimeout(id);
        throw e;
    }
};

export const getPlayerData = async () => {
    const { accessToken } = await getTokens();
    if (!accessToken) return { info: null, region: null };
    try {
        const infoRes = await fetchWithTimeout(VALORANT_ENDPOINTS.USER_INFO, {
            headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        const info = await infoRes.json();
        return { info, region: { pas_region: 'ap', pas_affinity: 'AP' } };
    } catch (e) {
        return { info: null, region: { pas_region: 'ap', pas_affinity: 'AP' } };
    }
};

// Custom error class to distinguish different error types
export class APIError extends Error {
    constructor(
        message: string,
        public statusCode: number,
        public errorCode?: string,
        public endpoint?: string,
    ) {
        super(message);
        this.name = 'APIError';
    }
}

const fetchWithShardFallback = async (puuid: string, path: string) => {
    // Validate PUUID format
    const puuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!puuidRegex.test(puuid)) {
        console.log(`[API] ⚠️ PUUID Format Invalid: "${puuid}"`);
        throw new APIError(`Invalid PUUID format: ${puuid}`, 400);
    }
    console.log(`[API] ✓ PUUID Format Valid: ${puuid.substring(0, 8)}...`);
    
    const headers = await getRiotHeaders();
    
    // Validate critical headers
    if (!headers.Authorization) {
        console.log('[API] ⚠️ CRITICAL: Missing Authorization header!');
        throw new APIError('Missing Authorization header', 401);
    }
    if (!headers['X-Riot-Entitlements-JWT']) {
        console.log('[API] ⚠️ WARNING: Missing Entitlements Token - may cause 401 errors');
    }
    console.log(`[API] Request Headers Summary:`);
    console.log(`  - Authorization: ${headers.Authorization ? 'Bearer ****' + headers.Authorization.slice(-10) : 'MISSING'}`);
    console.log(`  - Entitlements: ${headers['X-Riot-Entitlements-JWT'] ? `JWT ****${headers['X-Riot-Entitlements-JWT'].slice(-8)}` : 'MISSING'}`);
    console.log(`  - ClientVersion: ${headers['X-Riot-ClientVersion']}`);
    
    // Try AP first (detected shard for Thailand), then fallback to others
    const shards = ['ap', 'kr', 'na', 'eu'];
    let lastErrorCode = '';
    let hasAuthError = false;
    
    for (const shard of shards) {
        const url = `https://pd.${shard}.a.pvp.net${path}`;
        console.log(`\n[API] ======================================`);
        console.log(`[API] Attempting Shard: ${shard.toUpperCase()}`);
        console.log(`[API] URL: ${url}`);
        console.log(`[API] ======================================`);
        
        try {
            const res = await fetchWithTimeout(url, { headers }, 5000);
            
            console.log(`[API] Response Status: ${res.status} ${res.statusText}`);
            
            if (res.ok) {
                console.log(`[API] ✓ SUCCESS on ${shard.toUpperCase()}`);
                const data = await res.json();
                console.log(`[API] Response size: ${JSON.stringify(data).length} bytes`);
                return data;
            }
            
            // Log response body for failed requests
            let errorBody = '';
            let parsedError = null;
            try {
                errorBody = await res.text();
                console.log(`[API] ✗ Shard ${shard.toUpperCase()} failed with ${res.status}`);
                console.log(`[API] Response body: ${errorBody}`);
                
                // Try to parse as JSON to get error code
                if (errorBody) {
                    try {
                        parsedError = JSON.parse(errorBody);
                        lastErrorCode = parsedError.errorCode || '';
                    } catch {
                        // Not JSON, ignore
                    }
                }
            } catch (e) {
                console.log(`[API] ✗ Shard ${shard.toUpperCase()} failed with ${res.status} (couldn't read body)`);
            }
            
            // Track auth errors
            if (res.status === 401 || res.status === 403) {
                hasAuthError = true;
            }
        } catch (e: any) {
            console.log(`[API] ✗ Shard ${shard.toUpperCase()} error: ${e.message}`);
        }
    }
    
    // All shards failed - determine the type of error
    if (hasAuthError) {
        console.log('[API] ✗ Authentication Error Detected');
        throw new APIError(
            'Authentication failed - your tokens may have expired. Please log in again.',
            401,
            'AUTH_FAILED',
            path
        );
    }
    
    if (lastErrorCode === 'RESOURCE_NOT_FOUND') {
        console.log('[API] ✗ Account data not found - likely account is not ranked or ineligible');
        throw new APIError(
            'ACCOUNT_DATA_NOT_FOUND',
            404,
            'RESOURCE_NOT_FOUND',
            path
        );
    }
    
    // All shards failed - provide detailed error info
    const errorDetails = `
[API] ✗ FAILED TO FETCH DATA
[API] PUUID: ${puuid.substring(0, 8)}...
[API] Path: ${path}
[API] All shards (AP, KR, NA, EU) returned errors
[API] This typically indicates:
[API]   1. Invalid or expired authentication tokens (401/403)
[API]   2. Account data not found on this endpoint (404)
[API]   3. Riot API is temporarily unavailable (5xx)
`;
    console.log(errorDetails);
    throw new APIError(
        'Failed to fetch account data from all available shards',
        500,
        'UNKNOWN_ERROR',
        path
    );
};

export const fetchStorefront = async (region: string, puuid: string) => {
    try {
        const data = await fetchWithShardFallback(puuid, `/store/v2/storefront/${puuid}`);
        return { data, isAvailable: true };
    } catch (error: any) {
        console.log('[Store] Caught error in fetchStorefront:', error.message, error.statusCode, error.errorCode);
        
        if (error instanceof APIError) {
            // Handle 404 - account not eligible for store
            if (error.statusCode === 404 || error.errorCode === 'RESOURCE_NOT_FOUND') {
                console.log('[Store] Account not eligible for store access (404)');
                return {
                    data: null,
                    isAvailable: false,
                    reason: 'UNRANKED_OR_NEW_ACCOUNT',
                    message: 'Your account will unlock the store after completing ranked placement or reaching account eligibility.'
                };
            } 
            // Handle auth errors
            else if (error.statusCode === 401 || error.statusCode === 403) {
                throw {
                    message: 'AUTH_ERROR',
                    isAuthError: true,
                };
            }
            // Handle other errors - re-throw
            else {
                console.log('[Store] Throwing APIError:', error.message);
                throw error;
            }
        }
        
        // Handle non-APIError exceptions
        console.log('[Store] Throwing non-APIError:', error.message);
        throw error;
    }
};

export const fetchInventory = async (region: string, puuid: string) => {
    try {
        return await fetchWithShardFallback(puuid, `/store/v1/entitlements/${puuid}/skin_level`);
    } catch (error: any) {
        console.log('[Inventory] Error:', error.message, error.statusCode, error.errorCode);
        
        if (error instanceof APIError) {
            // 404 means no inventory (new account), return empty
            if (error.statusCode === 404 || error.errorCode === 'RESOURCE_NOT_FOUND') {
                console.log('[Inventory] Account data not found - account may not have any skins');
                return { Entitlements: [] }; // Return proper structure
            } 
            // Auth errors should be thrown
            else if (error.statusCode === 401 || error.statusCode === 403) {
                throw {
                    message: 'AUTH_ERROR',
                    friendlyMessage: 'Your session has expired. Please sign in again.',
                    isAuthError: true,
                };
            }
        }
        
        // Any other error - return empty inventory to be safe
        console.log('[Inventory] Returning empty inventory due to error');
        return { Entitlements: [] };
    }
};

export const fetchPlayerMMR = async (region: string, puuid: string) => {
    try {
        return await fetchWithShardFallback(puuid, `/mmr/v1/player/${puuid}`);
    } catch (error: any) {
        if (error instanceof APIError) {
            if (error.errorCode === 'RESOURCE_NOT_FOUND') {
                console.log('[MMR] Account not ranked - likely needs placement matches');
                return null; // Account not ranked
            } else if (error.statusCode === 401 || error.statusCode === 403) {
                throw {
                    message: 'AUTH_ERROR',
                    friendlyMessage: 'Your session has expired. Please sign in again.',
                    isAuthError: true,
                };
            }
        }
        return null; // Fallback to null for any other error
    }
};

// NEW: Fetch competitive history for peak rank info
export const fetchCompetitiveHistory = async (region: string, puuid: string) => {
    try {
        console.log('[CompetitiveHistory] Fetching competitive history for peak rank');
        const history = await fetchWithShardFallback(
            puuid,
            `/competitiveupdates/v1/player/${puuid}`
        );
        console.log('[CompetitiveHistory] Successfully fetched history');
        return history;
    } catch (error: any) {
        // No history available - account is unranked or new
        console.log('[CompetitiveHistory] No history found:', error.message);
        return null;
    }
};

// NEW: Fetch match history
export const fetchMatchHistory = async (region: string, puuid: string) => {
    try {
        console.log('[MatchHistory] Fetching match history for', puuid.substring(0, 8));
        return await fetchWithShardFallback(
            puuid,
            `/match-history/v1/history/${puuid}?begin=0&end=20`
        );
    } catch (error: any) {
        if (error instanceof APIError) {
            if (error.statusCode === 401 || error.statusCode === 403) {
                throw {
                    message: 'AUTH_ERROR',
                    isAuthError: true,
                };
            }
        }
        // Return empty history on any error
        console.log('[MatchHistory] Failed to fetch:', error.message);
        return { History: [] };
    }
};

// NEW: Helper to format match timestamps
export const formatMatchDate = (timestamp: number): string => {
    const matchDate = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - matchDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
};

// NEW: Map queue IDs to readable queue names
export const getQueueName = (queueID: string): string => {
    const queueMap: Record<string, string> = {
        'competitive': 'Competitive',
        'unrated': 'Unrated',
        'deathmatch': 'Deathmatch',
        'spikerush': 'Spike Rush',
        'escalation': 'Escalation',
        'ggteam': 'Team Deathmatch',
        'replication': 'Replication',
    };
    return queueMap[queueID.toLowerCase()] || queueID;
};

// NEW: Get tier name from tier number
export const getTierName = (tierNumber: number): string => {
    const tiers: Record<number, string> = {
        0: 'Unranked',
        1: 'Iron 1', 2: 'Iron 2', 3: 'Iron 3',
        4: 'Bronze 1', 5: 'Bronze 2', 6: 'Bronze 3',
        7: 'Silver 1', 8: 'Silver 2', 9: 'Silver 3',
        10: 'Gold 1', 11: 'Gold 2', 12: 'Gold 3',
        13: 'Platinum 1', 14: 'Platinum 2', 15: 'Platinum 3',
        16: 'Diamond 1', 17: 'Diamond 2', 18: 'Diamond 3',
        19: 'Ascendant 1', 20: 'Ascendant 2', 21: 'Ascendant 3',
        22: 'Immortal 1', 23: 'Immortal 2', 24: 'Immortal 3',
        25: 'Radiant'
    };
    return tiers[tierNumber] || 'Unknown';
};

// NEW: Get peak rank from competitive history
export const getPeakRankFromHistory = (history: any): { tier: number; name: string; episode?: string } | null => {
    if (!history || !history.CompetitiveUpdates || history.CompetitiveUpdates.length === 0) {
        return null;
    }

    let peakTier = 0;
    let peakEpisode = 'Unknown';

    history.CompetitiveUpdates.forEach((update: any) => {
        const tier = update.TierAfterUpdate || 0;
        if (tier > peakTier) {
            peakTier = tier;
            // Try to extract episode info from the update
            peakEpisode = update.Patch || 'Unknown';
        }
    });

    if (peakTier === 0) return null; // Never ranked

    return {
        tier: peakTier,
        name: getTierName(peakTier),
        episode: peakEpisode,
    };
};
