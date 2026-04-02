const BASE_URL = 'https://valorant-api.com/v1';

let cachedSkins: any[] | null = null;
let cachedTiers: any[] | null = null;
let cachedVersion: string | null = null;

export const getClientVersion = async () => {
    if (cachedVersion) return cachedVersion;
    try {
        const response = await fetch(`${BASE_URL}/version`);
        const json = await response.json();
        cachedVersion = json.data.riotClientVersion;
        console.log('Mapping: Current Riot Client Version:', cachedVersion);
        return cachedVersion;
    } catch (e) {
        return 'release-08.05-shipping-12-2415132'; // Fallback
    }
};

export const getAllSkins = async () => {
    if (cachedSkins) return cachedSkins;
    try {
        const response = await fetch(`${BASE_URL}/weapons/skins`);
        const json = await response.json();
        cachedSkins = json.data;
        return cachedSkins;
    } catch (e) {
        return [];
    }
};

export const getCompetitiveTiers = async () => {
    if (cachedTiers) return cachedTiers;
    try {
        const response = await fetch(`${BASE_URL}/competitivetiers`);
        const json = await response.json();
        cachedTiers = json.data[json.data.length - 1].tiers;
        return cachedTiers;
    } catch (e) {
        return [];
    }
};
