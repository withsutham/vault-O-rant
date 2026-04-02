import { VALORANT_ENDPOINTS } from '../constants/RSO';
import { getTokens } from '../utils/secureStore';

export interface UserInfo {
    sub: string;
    acct: {
        game_name: string;
        tag_line: string;
        created_at: number;
    };
}

export interface UserRegion {
    pas_region: string; // The Shard (e.g., 'ap', 'na', 'eu', 'kr')
    pas_affinity: string; // The Region (e.g., 'AP', 'NA', 'EU', 'KR')
}

export const fetchUserInfo = async (): Promise<UserInfo | null> => {
    try {
        const { accessToken } = await getTokens();
        if (!accessToken) return null;

        const response = await fetch(VALORANT_ENDPOINTS.USER_INFO, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) throw new Error('Failed to fetch user info');

        return await response.json();
    } catch (error) {
        console.error('Error fetching user info:', error);
        return null;
    }
};

export const fetchUserRegion = async (): Promise<UserRegion | null> => {
    try {
        const { accessToken } = await getTokens();
        if (!accessToken) return null;

        const response = await fetch(VALORANT_ENDPOINTS.REGION, {
            method: 'PUT', // The GEO endpoint usually requires PUT with the token in body or headers
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id_token: accessToken }) // Some versions of this endpoint need the token in body
        });

        if (!response.ok) {
             // Fallback: If the PUT with body fails, try simple GET or different structure
             const retryResponse = await fetch(VALORANT_ENDPOINTS.REGION, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
             });
             if (!retryResponse.ok) throw new Error('Failed to fetch region');
             return await retryResponse.json();
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching user region:', error);
        return null;
    }
};

/**
 * Combined helper to get everything we need for API calls
 */
export const getPlayerData = async () => {
    const info = await fetchUserInfo();
    const region = await fetchUserRegion();
    return { info, region };
};
