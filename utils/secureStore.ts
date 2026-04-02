import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'riot_access_token';
const ENTITLEMENTS_TOKEN_KEY = 'riot_entitlements_token';
const USER_ID_KEY = 'riot_user_id';

export const saveTokens = async (accessToken: string, entitlementsToken: string, userId: string) => {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(ENTITLEMENTS_TOKEN_KEY, entitlementsToken);
    await SecureStore.setItemAsync(USER_ID_KEY, userId);
};

export const getTokens = async () => {
    const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    const entitlementsToken = await SecureStore.getItemAsync(ENTITLEMENTS_TOKEN_KEY);
    const userId = await SecureStore.getItemAsync(USER_ID_KEY);
    return { accessToken, entitlementsToken, userId };
};

export const deleteTokens = async () => {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(ENTITLEMENTS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_ID_KEY);
};
