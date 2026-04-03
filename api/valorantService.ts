import { VALORANT_ENDPOINTS } from '../constants/RSO';
import { getTokens, deleteTokens } from '../utils/secureStore';
import { getClientVersion } from './mappingService';

const CLIENT_PLATFORM = 'ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIldpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogIlVua25vd24iDQp9';
const USER_AGENT = 'ShooterGame/13 Windows/10.0.19042.1.256.64bit';

// ============================================================================
// CACHING SYSTEM FOR MATCH DETAILS
// ============================================================================
interface CachedMatchData {
    timestamp: number;
    data: any;
}

interface CachedApiData<T> {
    timestamp: number;
    data: T;
}

type Region = {
    pas_region: string;
    pas_affinity: string;
};

type Entitlement = {
    TypeID: string;
    ItemID: string;
    InstanceID?: string;
};

type InventoryResponse = {
    Entitlements: Entitlement[];
};

type StorefrontAvailabilityResponse = {
    data: any;
    isAvailable: boolean;
    reason?: string;
    message?: string;
};

type MatchHistoryResponse = {
    History: any[];
};

const matchDetailsCache = new Map<string, CachedMatchData>();
const MATCH_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const storefrontCache = new Map<string, CachedApiData<StorefrontAvailabilityResponse>>();
const inventoryCache = new Map<string, CachedApiData<InventoryResponse>>();
const matchHistoryCache = new Map<string, CachedApiData<MatchHistoryResponse>>();
const API_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

const getCacheKey = (puuid: string, matchId: string): string => `${puuid}:${matchId}`;

const getCachedMatchDetails = (cacheKey: string): any | null => {
    const cached = matchDetailsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < MATCH_CACHE_DURATION) {
        return cached.data;
    }
    if (cached) {
        matchDetailsCache.delete(cacheKey);
    }
    return null;
};

const setCachedMatchDetails = (cacheKey: string, data: any): void => {
    matchDetailsCache.set(cacheKey, { timestamp: Date.now(), data });
};

const clearMatchCache = (): void => {
    matchDetailsCache.clear();
};

const getApiCacheKey = (region: string, puuid: string) => `${region}:${puuid}`;

const getCachedApiData = <T>(cache: Map<string, CachedApiData<T>>, key: string): T | null => {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < API_CACHE_DURATION) {
        return cached.data;
    }
    if (cached) {
        cache.delete(key);
    }
    return null;
};

const setCachedApiData = <T>(cache: Map<string, CachedApiData<T>>, key: string, data: T): void => {
    cache.set(key, { timestamp: Date.now(), data });
};

export const clearApiDataCache = (): void => {
    storefrontCache.clear();
    inventoryCache.clear();
    matchHistoryCache.clear();
};

const getRiotHeaders = async () => {
    const version = await getClientVersion();
    const { accessToken, entitlementsToken } = await getTokens();

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
        return { info, region: { pas_region: 'ap', pas_affinity: 'AP' } as Region };
    } catch (e) {
        return { info: null, region: { pas_region: 'ap', pas_affinity: 'AP' } as Region };
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

const fetchWithShardFallback = async (puuid: string, path: string, method: string = 'GET') => {
    // Validate PUUID format
    const puuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!puuidRegex.test(puuid)) {
        throw new APIError(`Invalid PUUID format: ${puuid}`, 400);
    }
    
    const headers = await getRiotHeaders();
    
    // Validate critical headers
    if (!headers.Authorization) {
        throw new APIError('Missing Authorization header', 401);
    }
    if (!headers['X-Riot-ClientPlatform']) {
        throw new APIError('Missing X-Riot-ClientPlatform header', 400);
    }
    
    // Try AP first (detected shard for Thailand), then fallback to others
    const shards = ['ap', 'kr', 'na', 'eu'];
    let lastErrorCode = '';
    let hasAuthError = false;
    
    for (const shard of shards) {
        const url = `https://pd.${shard}.a.pvp.net${path}`;
        
        try {
            const fetchOptions: any = { headers, method };
            if (method === 'POST') {
                fetchOptions.body = JSON.stringify({});
            }
            const res = await fetchWithTimeout(url, fetchOptions, 5000);
            
            if (res.ok) {
                const data = await res.json();
                return data;
            }
            
            // Log response body for failed requests
            let errorBody = '';
            let parsedError = null;
            try {
                errorBody = await res.text();
                
                // Try to parse as JSON to get error code
                if (errorBody) {
                    try {
                        parsedError = JSON.parse(errorBody);
                        lastErrorCode = parsedError.errorCode || '';
                    } catch {
                        // Not JSON, ignore
                    }
                }
            } catch (e) {}
            
            // Track auth errors
            if (res.status === 401 || res.status === 403) {
                hasAuthError = true;
            }
        } catch (e: any) {}
    }
    
    // All shards failed - determine the type of error
    if (hasAuthError) {
        throw new APIError(
            'Authentication failed - your tokens may have expired. Please log in again.',
            401,
            'AUTH_FAILED',
            path
        );
    }
    
    if (lastErrorCode === 'RESOURCE_NOT_FOUND') {
        throw new APIError(
            'ACCOUNT_DATA_NOT_FOUND',
            404,
            'RESOURCE_NOT_FOUND',
            path
        );
    }
    
    throw new APIError(
        'Failed to fetch account data from all available shards',
        500,
        'UNKNOWN_ERROR',
        path
    );
};

export const fetchStorefront = async (region: string, puuid: string, forceRefresh: boolean = false) => {
    const cacheKey = getApiCacheKey(region, puuid);
    if (!forceRefresh) {
        const cached = getCachedApiData(storefrontCache, cacheKey);
        if (cached) return cached;
    }

    try {
        const data = await fetchWithShardFallback(puuid, `/store/v3/storefront/${puuid}`, 'POST');
        const payload: StorefrontAvailabilityResponse = { data, isAvailable: true };
        setCachedApiData(storefrontCache, cacheKey, payload);
        return payload;
    } catch (error: any) {

        if (error instanceof APIError) {
            // Handle 404 - account not eligible for store
            if (error.statusCode === 404 || error.errorCode === 'RESOURCE_NOT_FOUND') {
                const payload: StorefrontAvailabilityResponse = {
                    data: null,
                    isAvailable: false,
                    reason: 'UNRANKED_OR_NEW_ACCOUNT',
                    message: 'Your account will unlock the store after completing ranked placement or reaching account eligibility.'
                };
                setCachedApiData(storefrontCache, cacheKey, payload);
                return payload;
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
                throw error;
            }
        }
        
        // Handle non-APIError exceptions
        throw error;
    }
};

export const fetchInventory = async (region: string, puuid: string, forceRefresh: boolean = false) => {
    const SKINS_ITEM_TYPE_ID = 'e7c63390-eda7-46e0-bb7a-a6abdacd2433';
    const cacheKey = getApiCacheKey(region, puuid);

    if (!forceRefresh) {
        const cached = getCachedApiData(inventoryCache, cacheKey);
        if (cached) return cached;
    }

    const normalizeInventoryResponse = (data: any) => {
        if (Array.isArray(data?.Entitlements)) {
            return { Entitlements: data.Entitlements };
        }

        if (Array.isArray(data?.EntitlementsByTypes)) {
            const skinEntitlementsByType = data.EntitlementsByTypes.find((entry: any) =>
                String(entry?.ItemTypeID || '').toLowerCase() === SKINS_ITEM_TYPE_ID
            );
            return { Entitlements: skinEntitlementsByType?.Entitlements || [] };
        }

        return null;
    };

    try {
        // Preferred endpoint from current docs: /store/v1/entitlements/{puuid}/{ItemTypeID}
        try {
            const ownedItemsResponse = await fetchWithShardFallback(
                puuid,
                `/store/v1/entitlements/${puuid}/${SKINS_ITEM_TYPE_ID}`
            );
            const normalizedOwnedItems = normalizeInventoryResponse(ownedItemsResponse);
            if (normalizedOwnedItems) {
                setCachedApiData(inventoryCache, cacheKey, normalizedOwnedItems);
                return normalizedOwnedItems;
            }
        } catch (ownedItemsError: any) {
            if (
                ownedItemsError?.statusCode === 401 ||
                ownedItemsError?.statusCode === 403 ||
                ownedItemsError?.errorCode === 'AUTH_FAILED'
            ) {
                throw ownedItemsError;
            }
        }

        const legacyResponse = await fetchWithShardFallback(puuid, `/store/v1/entitlements/${puuid}/skin_level`);
        const normalizedLegacyResponse = normalizeInventoryResponse(legacyResponse);
        const payload = normalizedLegacyResponse || { Entitlements: [] };
        setCachedApiData(inventoryCache, cacheKey, payload);
        return payload;
    } catch (error: any) {

        if (error instanceof APIError) {
            // 404 means no inventory (new account), return empty
            if (error.statusCode === 404 || error.errorCode === 'RESOURCE_NOT_FOUND') {
                const payload = { Entitlements: [] };
                setCachedApiData(inventoryCache, cacheKey, payload);
                return payload; // Return proper structure
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
        const payload = { Entitlements: [] };
        setCachedApiData(inventoryCache, cacheKey, payload);
        return payload;
    }
};

export const fetchWallet = async (region: string, puuid: string) => {
    try {
        return await fetchWithShardFallback(puuid, `/store/v1/wallet/${puuid}`);
    } catch (error: any) {
        if (error instanceof APIError) {
            if (error.statusCode === 401 || error.statusCode === 403) {
                throw {
                    message: 'AUTH_ERROR',
                    friendlyMessage: 'Your session has expired. Please sign in again.',
                    isAuthError: true,
                };
            }
        }
        return { Balances: {} };
    }
};

export const fetchPlayerMMR = async (region: string, puuid: string) => {
    try {
        // Preferred endpoint from current docs: /mmr/v1/players/{puuid}
        try {
            return await fetchWithShardFallback(puuid, `/mmr/v1/players/${puuid}`);
        } catch (primaryError: any) {
            // Keep backward compatibility in case singular path still works for some shards
            if (
                primaryError instanceof APIError &&
                primaryError.statusCode !== 404 &&
                primaryError.statusCode !== 400
            ) {
                throw primaryError;
            }
            return await fetchWithShardFallback(puuid, `/mmr/v1/player/${puuid}`);
        }
    } catch (error: any) {
        if (error instanceof APIError) {
            if (error.errorCode === 'RESOURCE_NOT_FOUND') {
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
        const history = await fetchWithShardFallback(
            puuid,
            `/competitiveupdates/v1/player/${puuid}`
        );
        return history;
    } catch (error: any) {
        // No history available - account is unranked or new
        return null;
    }
};

// NEW: Fetch match history
export const fetchMatchHistory = async (region: string, puuid: string, forceRefresh: boolean = false) => {
    const cacheKey = getApiCacheKey(region, puuid);
    if (!forceRefresh) {
        const cached = getCachedApiData(matchHistoryCache, cacheKey);
        if (cached) return cached;
    }

    try {
        const payload = await fetchWithShardFallback(
            puuid,
            `/match-history/v1/history/${puuid}?begin=0&end=20`
        );
        setCachedApiData(matchHistoryCache, cacheKey, payload);
        return payload;
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
        const payload = { History: [] };
        setCachedApiData(matchHistoryCache, cacheKey, payload);
        return payload;
    }
};

export const fetchPlayerLoadout = async (region: string, puuid: string) => {
    try {
        return await fetchWithShardFallback(
            puuid,
            `/personalization/v2/players/${puuid}/playerloadout`
        );
    } catch (error: any) {
        if (error instanceof APIError) {
            if (error.statusCode === 401 || error.statusCode === 403) {
                throw {
                    message: 'AUTH_ERROR',
                    friendlyMessage: 'Your session has expired. Please sign in again.',
                    isAuthError: true,
                };
            }
        }

        return null;
    }
};

// NEW: Helper to format match timestamps
export const formatMatchDate = (timestamp: number): string => {
    const rawTimestamp = Number(timestamp);
    if (!Number.isFinite(rawTimestamp) || rawTimestamp <= 0) {
        return 'Unknown date';
    }

    let normalizedTimestamp = rawTimestamp;
    if (rawTimestamp > 1e17) {
        // nanoseconds -> milliseconds
        normalizedTimestamp = Math.floor(rawTimestamp / 1e6);
    } else if (rawTimestamp > 1e14) {
        // microseconds -> milliseconds
        normalizedTimestamp = Math.floor(rawTimestamp / 1e3);
    } else if (rawTimestamp < 1e11) {
        // seconds -> milliseconds
        normalizedTimestamp = rawTimestamp * 1e3;
    }

    const matchDate = new Date(normalizedTimestamp);
    if (Number.isNaN(matchDate.getTime())) {
        return 'Unknown date';
    }

    const now = new Date();
    const diffMs = now.getTime() - matchDate.getTime();
    if (!Number.isFinite(diffMs) || diffMs < 0) {
        return 'Unknown date';
    }
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

// NEW: Fetch specific match details
export const fetchMatchDetails = async (region: string, puuid: string, matchId: string) => {
    try {
        return await fetchWithShardFallback(
            puuid,
            `/match-details/v1/matches/${matchId}`
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
        return null;
    }
};

// NEW: Fetch match details with caching (for match history)
export const fetchMatchDetailsWithCache = async (region: string, puuid: string, matchId: string) => {
    const cacheKey = getCacheKey(puuid, matchId);
    
    // Check cache first
    const cached = getCachedMatchDetails(cacheKey);
    if (cached !== null) {
        return cached;
    }
    
    // Fetch fresh data
    const data = await fetchMatchDetails(region, puuid, matchId);
    
    // Cache the result (even if null, to avoid re-fetching failed requests)
    if (data) {
        setCachedMatchDetails(cacheKey, data);
    }
     
     return data;
 };
 
 // NEW: Clear match details cache (for manual refresh)
 export const clearMatchDetailsCache = (): void => {
     clearMatchCache();
 };

// ============================================================================
// MATCH DETAIL STATISTICS HELPERS (for detail screen)
// ============================================================================

// Calculate headshot percentage
export const calculateHeadshotPercent = (stats: any): number => {
    const headshots = stats.headshots || 0;
    const totalShots = (stats.headshots || 0) + (stats.bodyshots || 0) + (stats.legshots || 0);
    return totalShots > 0 ? Math.round((headshots / totalShots) * 100) : 0;
};

// Calculate ACS (Average Combat Score)
export const getACS = (stats: any): number => {
    const score = stats.score || 0;
    const roundsPlayed = stats.rounds_played || 1;
    return Math.round(score / roundsPlayed);
};

// Get econ rating as formatted string
export const getEconRating = (stats: any): string => {
    const econ = stats.economy_rating || stats.econ_rating || 0;
    return econ.toFixed(2);
};

// Extract scoreboard organized by team
export const getScoreboard = (matchDetails: any, playerUUID: string) => {
    const playerTeamId = matchDetails.players
        ?.find((p: any) => p.subject === playerUUID)?.teamId;
    
    const userTeam = matchDetails.players?.filter((p: any) => p.teamId === playerTeamId) || [];
    const enemyTeam = matchDetails.players?.filter((p: any) => p.teamId !== playerTeamId && p.teamId !== 'Neutral') || [];
    
    return { userTeam, enemyTeam, playerTeamId };
};

// Get map image URL from map ID
export const getMapImageUrl = (mapId: string): string => {
    const mapName = mapId.split('/').pop();
    return `https://media.valorantapi.com/maps/${mapName}/displayIcon.png`;
};
