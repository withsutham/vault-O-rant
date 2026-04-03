const BASE_URL = 'https://valorant-api.com/v1';

let cachedSkins: any[] | null = null;
let cachedTiers: any[] | null = null;
let cachedVersion: string | null = null;
let cachedAgents: any[] | null = null;
let cachedMaps: any[] | null = null;
let cachedPlayerCards: any[] | null = null;

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

export const getAgents = async () => {
    if (cachedAgents) return cachedAgents;
    try {
        const response = await fetch(`${BASE_URL}/agents?isPlayableCharacter=true`);
        const json = await response.json();
        cachedAgents = json.data;
        return cachedAgents;
    } catch (e) {
        return [];
    }
};

export const getMaps = async () => {
    if (cachedMaps) return cachedMaps;
    try {
        const response = await fetch(`${BASE_URL}/maps`);
        const json = await response.json();
        cachedMaps = json.data;
        return cachedMaps;
    } catch (e) {
        return [];
    }
};

export const getPlayerCards = async () => {
    if (cachedPlayerCards) return cachedPlayerCards;
    try {
        const response = await fetch(`${BASE_URL}/playercards`);
        const json = await response.json();
        cachedPlayerCards = json.data;
        return cachedPlayerCards;
    } catch (e) {
        return [];
    }
};
