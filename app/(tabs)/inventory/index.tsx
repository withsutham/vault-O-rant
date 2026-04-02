import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator, RefreshControl, Pressable } from "react-native"
import Colors from "../../../constants/Colors"
import { getPlayerData, fetchInventory } from "../../../api/valorantService"
import { getAllSkins } from "../../../api/mappingService"

const InventoryPage = () => {
    const [skins, setSkins] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [guest, setGuest] = useState(false);

    const loadInventoryData = async () => {
        try {
            console.log('--- Inventory: Loading Data ---');
            setLoading(true);
            const { info, region } = await getPlayerData();
            
            console.log('Inventory Auth Status:', { hasInfo: !!info, hasRegion: !!region });

            if (!info) {
                setGuest(true);
                return;
            }

            setGuest(false);
            const activeRegion = region?.pas_region || 'ap';
            const inventory = await fetchInventory(activeRegion, info.sub);
            const allSkins = await getAllSkins();

            if (inventory && inventory.Entitlements && allSkins && allSkins.length > 0) {
                const ownedUuids = inventory.Entitlements.map((e: any) => e.ItemID.toLowerCase());
                
                const mappedSkins = allSkins.filter((skin: any) => {
                    return skin.levels.some((level: any) => ownedUuids.includes(level.uuid.toLowerCase()));
                }).map((skin: any) => ({
                    name: skin.displayName,
                    image: skin.displayIcon,
                }));

                mappedSkins.sort((a: any, b: any) => a.name.localeCompare(b.name));
                setSkins(mappedSkins);
            } else if (inventory && inventory.Entitlements && inventory.Entitlements.length === 0) {
                // Empty inventory is valid - just no skins
                setSkins([]);
            }
        } catch (err) {
            console.error('Inventory Load Error:', err);
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
        loadInventoryData();
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.dark.tint} />
                <Text style={styles.loadingText}>Loading your collection...</Text>
            </View>
        );
    }

    if (guest) {
        return (
            <View style={styles.guestContainer}>
                <Text style={styles.guestText}>Please sign in to view your inventory.</Text>
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
            <View style={styles.header}>
                <Text style={styles.title}>Your Collection</Text>
                <Text style={styles.subtitle}>{skins.length} Skins Owned</Text>
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
                                <Image source={{ uri: skin.image }} style={styles.skinImage} resizeMode="contain" />
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
        marginTop: 15,
        opacity: 0.7,
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