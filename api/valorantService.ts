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

export const fetchUserInfo = async (): Promise<UserInfo | null> => {
    try {
        const { accessToken } = await getTokens();
        if (!accessToken) return null;

        const response = await fetch(VALORANT_ENDPOINTS.USER_INFO, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user info');
        }

        const data: UserInfo = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching user info:', error);
        return null;
    }
};

/**
 * Note: For real player stats (Rank, Level, Match History), 
 * we will need to know the player's region (na, eu, ap, kr, latam, br).
 * This can often be derived from the user info or local account info.
 */
