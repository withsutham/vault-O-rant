import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Colors from '../constants/Colors';

/**
 * This component handles deep links from the Riot authentication redirect
 * URL scheme: vaultrant://redirect?access_token=...&id_token=...
 */
const RedirectHandler = () => {
    const params = useLocalSearchParams();

    useEffect(() => {
        if (params.access_token) {
            // Send the token back to the login screen via window postMessage
            // This is handled by the login.tsx WebView integration
            console.log('[Redirect] Deep link received with access token');
            // The main app navigation will handle routing based on auth state
        }
    }, [params]);

    return (
        <View style={{ flex: 1, backgroundColor: Colors.dark.background, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Colors.dark.tint} />
        </View>
    );
};

export default RedirectHandler;
