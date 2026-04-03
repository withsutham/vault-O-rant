import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, ImageBackground } from 'react-native';
import { router } from 'expo-router';
import { getTokens } from '../utils/secureStore';
import Colors from '../constants/Colors';

const WelcomeScreen = () => {
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const { accessToken } = await getTokens();
            if (accessToken) {
                router.replace('/(tabs)/profile');
            }
            setIsChecking(false);
        };
        checkAuth();
    }, []);

    if (isChecking) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.dark.tint} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.logo}>VAULT-O-RANT</Text>
                <Text style={styles.tagline}>Your ultimate Valorant companion.</Text>

                <View style={styles.buttonContainer}>
                    <Pressable 
                        style={[styles.button, styles.primaryButton]}
                        onPress={() => router.push('/login')}
                    >
                        <Text style={styles.primaryButtonText}>Sign In with Riot</Text>
                    </Pressable>

                    <Pressable 
                        style={[styles.button, styles.secondaryButton]}
                        onPress={() => router.replace('/(tabs)/profile')}
                    >
                        <Text style={styles.secondaryButtonText}>Continue as Guest</Text>
                    </Pressable>
                </View>

                <Text style={styles.disclaimer}>
                    This is a third-party app. Not affiliated with Riot Games.
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
        justifyContent: 'center',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: Colors.dark.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 40,
        alignItems: 'center',
    },
    logo: {
        fontSize: 36,
        fontWeight: '900',
        color: Colors.dark.tint,
        letterSpacing: 2,
        marginBottom: 10,
    },
    tagline: {
        fontSize: 16,
        color: Colors.dark.text,
        marginBottom: 60,
        textAlign: 'center',
        opacity: 0.8,
    },
    buttonContainer: {
        width: '100%',
        gap: 15,
    },
    button: {
        paddingVertical: 18,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    primaryButton: {
        backgroundColor: Colors.dark.tint,
        borderColor: Colors.dark.tint,
    },
    primaryButtonText: {
        color: Colors.dark.text,
        fontSize: 16,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderColor: Colors.dark.text,
    },
    secondaryButtonText: {
        color: Colors.dark.text,
        fontSize: 16,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    disclaimer: {
        marginTop: 40,
        color: Colors.dark.tabIconDefault,
        fontSize: 12,
        textAlign: 'center',
    }
});

export default WelcomeScreen;
