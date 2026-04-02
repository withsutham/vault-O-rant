import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { router } from 'expo-router';
import { RSO_CONFIG, VALORANT_ENDPOINTS } from '../constants/RSO';
import { saveTokens } from '../utils/secureStore';
import Colors from '../constants/Colors';

const LoginPage = () => {
    const [loading, setLoading] = useState(true);

    const handleNavigationStateChange = async (newNavState: any) => {
        const { url } = newNavState;
        if (!url) return;

        // Check if we reached the redirect URI with the tokens
        if (url.startsWith(RSO_CONFIG.REDIRECT_URI) && url.includes('access_token')) {
            try {
                // Parse access_token from fragment
                const fragment = url.split('#')[1];
                const params = new URLSearchParams(fragment);
                const accessToken = params.get('access_token');

                if (accessToken) {
                    await finalizeLogin(accessToken);
                }
            } catch (error) {
                console.error('Login parsing error:', error);
                Alert.alert('Login Error', 'Failed to parse authentication data.');
            }
        }
    };

    const finalizeLogin = async (accessToken: string) => {
        try {
            setLoading(true);

            // 1. Get Entitlements Token
            const entitlementsResponse = await fetch(VALORANT_ENDPOINTS.ENTITLEMENTS, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
            });
            const entitlementsData = await entitlementsResponse.json();
            const entitlementsToken = entitlementsData.entitlements_token;

            // 2. Get User Info (SUB/ID)
            const userResponse = await fetch(VALORANT_ENDPOINTS.USER_INFO, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });
            const userData = await userResponse.json();
            const userId = userData.sub;

            // 3. Save to Secure Store
            await saveTokens(accessToken, entitlementsToken, userId);

            // 4. Redirect to Tabs
            router.replace('/(tabs)/profile');
        } catch (error) {
            console.error('Finalize login error:', error);
            Alert.alert('Login Error', 'Failed to complete authentication with Riot.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <WebView
                source={{ uri: RSO_CONFIG.AUTH_URL }}
                onNavigationStateChange={handleNavigationStateChange}
                onLoadEnd={() => setLoading(false)}
                style={styles.webview}
                incognito={true} // Force fresh login
            />
            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={Colors.dark.tint} />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    webview: {
        flex: 1,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(15, 25, 35, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default LoginPage;
