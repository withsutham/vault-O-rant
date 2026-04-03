import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator, RefreshControl, Pressable } from "react-native"
import { useRouter } from 'expo-router';
import Colors from "../../../constants/Colors"
import { getPlayerData, fetchInventory } from "../../../api/valorantService"
import { getAllSkins } from "../../../api/mappingService"
import { normalizeAppError } from '../../../utils/appErrors';
import { trackEvent } from '../../../utils/analytics';

const InventoryPage = () => {
    const router = useRouter();
    const [skins, setSkins] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [guest, setGuest] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAuthError, setIsAuthError] = useState(false);
    const [debugInfo, setDebugInfo] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const loadInventoryData = async (forceRefresh: boolean = false) => {
        try {
            console.log('--- Inventory: Loading Data ---');
            setError(null);
            setIsAuthError(false);
            setDebugInfo(null);
            setLoading(true);
            const { info, region } = await getPlayerData();
            
            console.log('Inventory Auth Status:', { hasInfo: !!info, hasRegion: !!region });

            if (!info) {
                setGuest(true);
                setSkins([]);
                if (__DEV__) {
                    setDebugInfo('debug: guest mode (missing player info/token)');
                }
                return;
            }

            setGuest(false);
            const activeRegion = region?.pas_region || 'ap';
            const inventory = await fetchInventory(activeRegion, info.sub, forceRefresh);
            const allSkins = await getAllSkins();

            if (inventory && inventory.Entitlements && allSkins && allSkins.length > 0) {
                const ownedUuids = new Set(
                    inventory.Entitlements
                        .map((e: any) => e?.ItemID?.toLowerCase())
                        .filter(Boolean)
                );

                const mappedSkins = allSkins
                    .map((skin: any) => {
                        const levels = Array.isArray(skin?.levels) ? skin.levels : [];
                        const ownedLevel = levels.find((level: any) => {
                            const levelUuid = level?.uuid?.toLowerCase();
                            return levelUuid ? ownedUuids.has(levelUuid) : false;
                        });

                        if (!ownedLevel) return null;

                        return {
                            uuid: skin.uuid,
                            name: skin.displayName,
                            image: ownedLevel.displayIcon || skin.displayIcon || null,
                        };
                    })
                    .filter((skin: any) => skin !== null);

                mappedSkins.sort((a: any, b: any) => a.name.localeCompare(b.name));
                setSkins(mappedSkins);
                setLastUpdated(new Date());
                trackEvent('inventory_load_success', { entitlements: inventory.Entitlements.length, mappedSkins: mappedSkins.length });
                if (__DEV__) {
                    setDebugInfo(`debug: inventory ok (entitlements=${inventory.Entitlements.length}, mappedSkins=${mappedSkins.length})`);
                }
            } else if (inventory && inventory.Entitlements && inventory.Entitlements.length === 0) {
                // Empty inventory is valid - just no skins
                setSkins([]);
                setLastUpdated(new Date());
                trackEvent('inventory_load_success', { entitlements: 0, mappedSkins: 0 });
                if (__DEV__) {
                    setDebugInfo('debug: inventory empty (0 entitlements)');
                }
            }
        } catch (err: any) {
            console.error('Inventory Load Error:', err);
            const normalizedError = normalizeAppError(err, 'Failed to load inventory. Please try again.');
            setIsAuthError(normalizedError.isAuthError);
            setError(normalizedError.message);
            trackEvent('inventory_load_failed', { source: normalizedError.source, message: normalizedError.message });

            if (__DEV__) {
                const source = normalizedError.source;
                const message = String(err?.message || 'unknown').slice(0, 140);
                setDebugInfo(`debug: source=${source} message=${message}`);
            }
            setSkins([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadInventoryData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadInventoryData(true);
    };

    if (loading && !refreshing) {
        const skeletonCards = Array.from({ length: 6 });
        return (
            <ScrollView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Your Collection</Text>
                    <Text style={styles.subtitle}>Syncing inventory...</Text>
                </View>
                <View style={styles.skinGrid}>
                    {skeletonCards.map((_, index) => (
                        <View key={`inv-skeleton-${index}`} style={styles.skinCard}>
                            <View style={[styles.skinImageContainer, styles.skeletonBlock]} />
                            <View style={styles.skinFooter}>
                                <View style={styles.skeletonLine} />
                            </View>
                        </View>
                    ))}
                </View>
                <View style={styles.loadingInline}>
                    <ActivityIndicator size="small" color={Colors.dark.tint} />
                    <Text style={styles.loadingText}>Loading your collection...</Text>
                </View>
            </ScrollView>
        );
    }

    if (guest) {
        return (
            <View style={styles.guestContainer}>
                {__DEV__ && debugInfo ? (
                    <View style={styles.debugBanner}>
                        <Text style={styles.debugText}>{debugInfo}</Text>
                    </View>
                ) : null}
                <Text style={styles.guestText}>Please sign in to view your inventory.</Text>
                <Pressable style={styles.retryButton} onPress={onRefresh}>
                    <Text style={styles.retryText}>Retry Loading</Text>
                </Pressable>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.guestContainer}>
                {__DEV__ && debugInfo ? (
                    <View style={styles.debugBanner}>
                        <Text style={styles.debugText}>{debugInfo}</Text>
                    </View>
                ) : null}
                <Text style={styles.errorTitle}>INVENTORY ERROR</Text>
                <Text style={styles.errorText}>{error}</Text>
                {isAuthError ? (
                    <Pressable style={styles.retryButton} onPress={() => router.push('/login')}>
                        <Text style={styles.retryText}>Sign In Again</Text>
                    </Pressable>
                ) : null}
                <Pressable style={styles.retryButton} onPress={onRefresh}>
                    <Text style={styles.retryText}>Retry Loading</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <ScrollView 
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.tint} />}
        >
            {__DEV__ && debugInfo ? (
                <View style={styles.debugBanner}>
                    <Text style={styles.debugText}>{debugInfo}</Text>
                </View>
            ) : null}
            <View style={styles.header}>
                <Text style={styles.title}>Your Collection</Text>
                <Text style={styles.subtitle}>{skins.length} Skins Owned</Text>
                <Text style={styles.updatedAt}>Last updated {lastUpdated ? lastUpdated.toLocaleTimeString() : 'just now'}</Text>
            </View>

            {skins.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyStateTitle}>No Skins Yet</Text>
                    <Text style={styles.emptyStateMessage}>You haven't acquired any weapon skins yet. Check the store daily to find new offers!</Text>
                </View>
            ) : (
                <View style={styles.skinGrid}>
                    {skins.map((skin, index) => (
                        <View key={index} style={styles.skinCard}>
                            <View style={styles.skinImageContainer}>
                                {skin.image ? (
                                    <Image source={{ uri: skin.image }} style={styles.skinImage} resizeMode="contain" />
                                ) : (
                                    <View style={styles.skinPlaceholder} />
                                )}
                            </View>
                            <View style={styles.skinFooter}>
                                <Text style={styles.skinName} numberOfLines={1}>{skin.name}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            )}
            <View style={{ height: 40 }} />
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: Colors.dark.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: Colors.dark.text,
        marginTop: 4,
        opacity: 0.7,
    },
    loadingInline: {
        marginTop: 8,
        marginBottom: 16,
        alignItems: 'center',
    },
    guestContainer: {
        flex: 1,
        backgroundColor: Colors.dark.background,
        justifyContent: 'center',
        padding: 40,
        alignItems: 'center',
    },
    guestText: {
        color: Colors.dark.text,
        textAlign: 'center',
        fontSize: 18,
        opacity: 0.6,
        marginBottom: 20,
    },
    errorTitle: {
        color: Colors.dark.tint,
        fontSize: 24,
        fontWeight: '900',
        marginBottom: 10,
    },
    errorText: {
        color: Colors.dark.text,
        textAlign: 'center',
        opacity: 0.6,
        marginBottom: 20,
    },
    debugBanner: {
        backgroundColor: '#22303D',
        borderColor: '#3D5163',
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 8,
        marginBottom: 12,
    },
    debugText: {
        color: '#9FC4E0',
        fontSize: 11,
    },
    retryButton: {
        padding: 12,
        backgroundColor: Colors.dark.tint,
        borderRadius: 4,
    },
    retryText: {
        color: Colors.dark.text,
        fontWeight: 'bold',
    },
    header: {
        marginBottom: 20,
    },
    title: {
        color: Colors.dark.text,
        fontSize: 24,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    subtitle: {
        color: Colors.dark.accent,
        fontSize: 14,
        marginTop: 4,
    },
    updatedAt: {
        color: Colors.dark.tabIconDefault,
        fontSize: 11,
        marginTop: 6,
    },
    skinGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    skinCard: {
        backgroundColor: Colors.dark.card,
        width: '48%',
        marginBottom: 15,
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#2D3945',
    },
    skinImageContainer: {
        height: 80,
        backgroundColor: '#1C2935',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
    },
    skinImage: {
        width: '100%',
        height: '100%',
    },
    skinPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#1C2935',
    },
    skeletonBlock: {
        backgroundColor: '#22303D',
    },
    skeletonLine: {
        width: '85%',
        height: 10,
        borderRadius: 4,
        backgroundColor: '#22303D',
    },
    skinFooter: {
        padding: 10,
    },
    skinName: {
        color: Colors.dark.text,
        fontSize: 12,
        fontWeight: '500',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    emptyStateTitle: {
        color: Colors.dark.text,
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    emptyStateMessage: {
        color: Colors.dark.tabIconDefault,
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    }
})

export default InventoryPage
