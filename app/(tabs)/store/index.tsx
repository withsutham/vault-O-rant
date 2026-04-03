import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator, RefreshControl, Pressable } from "react-native"
import { useRouter } from 'expo-router';
import Colors from "../../../constants/Colors"
import { getPlayerData, fetchStorefront, fetchWallet } from "../../../api/valorantService"
import { getAllSkins } from "../../../api/mappingService"
import { normalizeAppError } from '../../../utils/appErrors';
import { trackEvent } from '../../../utils/analytics';

const VP_CURRENCY_ID = '85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741';
const RADIANITE_CURRENCY_ID = 'e59aa87c-4cbf-517a-5983-6e81511be9b7';

const StorePage = () => {
    const router = useRouter();
    const [offers, setOffers] = useState<any[]>([]);
    const [nightMarket, setNightMarket] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [guest, setGuest] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAuthError, setIsAuthError] = useState(false);
    const [storeUnavailable, setStoreUnavailable] = useState<{ reason: string; message: string } | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [wallet, setWallet] = useState<{ vp: number; radianite: number } | null>(null);

    const loadStoreData = async (forceRefresh: boolean = false) => {
        try {
            setError(null);
            setIsAuthError(false);
            setStoreUnavailable(null);
            setLoading(true);
            const { info, region } = await getPlayerData();
            
            if (!info) {
                setGuest(true);
                return;
            }

            setGuest(false);
            const activeRegion = region?.pas_region || 'ap';
            const [storefrontResponse, walletData] = await Promise.all([
                fetchStorefront(activeRegion, info.sub, forceRefresh),
                fetchWallet(activeRegion, info.sub),
            ]);

            setWallet({
                vp: Number(walletData?.Balances?.[VP_CURRENCY_ID] || 0),
                radianite: Number(walletData?.Balances?.[RADIANITE_CURRENCY_ID] || 0),
            });

            // Check if store is available
            if (!storefrontResponse.isAvailable) {
                setStoreUnavailable({
                    reason: storefrontResponse.reason || 'UNKNOWN',
                    message: storefrontResponse.message || 'Store data is not available for your account.'
                });
                trackEvent('store_load_success', { isAvailable: false, reason: storefrontResponse.reason || 'UNKNOWN' });
                setLastUpdated(new Date());
                return;
            }

            const storefront = storefrontResponse.data;
            const allSkins = await getAllSkins();

            if (storefront && storefront.SkinsPanelLayout && allSkins && allSkins.length > 0) {
                const dailyOfferUuids = storefront.SkinsPanelLayout.SingleItemOffers;
                const singleItemStoreOffers = storefront.SkinsPanelLayout.SingleItemStoreOffers || [];
                const costByOfferId = new Map(
                    singleItemStoreOffers.map((offer: any) => [
                        String(offer?.OfferID || '').toLowerCase(),
                        Number(offer?.Cost?.[VP_CURRENCY_ID] || 0),
                    ])
                );
                
                const mappedOffers = dailyOfferUuids.map((uuid: string) => {
                    let skinMatch = null;
                    const price = costByOfferId.get(String(uuid).toLowerCase()) || 0;
                    for (const skin of allSkins) {
                        const levelMatch = skin.levels.find((l: any) => l.uuid.toLowerCase() === uuid.toLowerCase());
                        if (levelMatch) {
                            skinMatch = {
                                name: skin.displayName,
                                image: levelMatch.displayIcon || skin.displayIcon,
                                uuid: uuid,
                                price,
                            };
                            break;
                        }
                    }
                    return skinMatch || { name: 'Unknown Skin', image: null, uuid, price };
                });

                setOffers(mappedOffers);
                setLastUpdated(new Date());
                trackEvent('store_load_success', { isAvailable: true, dailyOffers: mappedOffers.length });
                
                if (storefront.BonusStore) {
                    const mappedBonus = storefront.BonusStore.BonusStoreOffers.map((offer: any) => {
                        const uuid = offer.Offer.OfferID;
                        let skinMatch = null;
                        for (const skin of allSkins) {
                            const levelMatch = skin.levels.find((l: any) => l.uuid.toLowerCase() === uuid.toLowerCase());
                            if (levelMatch) {
                                skinMatch = {
                                    name: skin.displayName,
                                    image: levelMatch.displayIcon || skin.displayIcon,
                                    discount: offer.DiscountPercent,
                                    price: offer.DiscountCosts?.[VP_CURRENCY_ID] || offer.DiscountCosts?.[Object.keys(offer.DiscountCosts || {})[0]] || 0,
                                };
                                break;
                            }
                        }
                        return skinMatch;
                    }).filter((s: any) => s !== null);
                    setNightMarket(mappedBonus);
                    trackEvent('store_load_success', {
                        isAvailable: true,
                        dailyOffers: mappedOffers.length,
                        nightMarket: mappedBonus.length,
                    });
                }
            } else {
                setError('No storefront data found.');
            }
        } catch (err: any) {
            const normalizedError = normalizeAppError(err, 'Failed to connect to Riot servers.');
            setIsAuthError(normalizedError.isAuthError);
            trackEvent('store_load_failed', { source: normalizedError.source, message: normalizedError.message });

            // Handle APIError exceptions
            if (err.name === 'APIError') {
                if (err.statusCode === 404) {
                    setStoreUnavailable({
                        reason: 'UNRANKED_OR_NEW_ACCOUNT',
                        message: 'Your account will unlock the store after completing ranked placement or reaching account eligibility.'
                    });
                    return;
                } else if (err.statusCode === 401 || err.statusCode === 403) {
                    setError(normalizedError.message);
                    return;
                } else {
                    setError(`Store error: ${err.message}`);
                    return;
                }
            }
            
            // Handle specific error types
            if (err.message === 'STORE_DATA_NOT_FOUND' || err.isAccountIneligible) {
                setError('Your account is not yet eligible to view the store. New accounts or accounts in certain regions may have restrictions.');
            } else if (normalizedError.isAuthError) {
                setError(normalizedError.message);
            } else if (err.message === 'ACCOUNT_DATA_NOT_FOUND') {
                setError('Store data not available for your account. Your account may need to complete placement matches.');
            } else {
                setError(normalizedError.message);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadStoreData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadStoreData(true);
    };

    if (loading && !refreshing) {
        const skeletonCards = Array.from({ length: 4 });
        return (
            <ScrollView style={styles.container}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Daily Offers</Text>
                </View>
                <View style={styles.grid}>
                    {skeletonCards.map((_, index) => (
                        <View key={`store-skeleton-${index}`} style={styles.storeItem}>
                            <View style={[styles.skinImageContainer, styles.skeletonBlock]} />
                            <View style={styles.skinInfo}>
                                <View style={styles.skeletonLine} />
                            </View>
                        </View>
                    ))}
                </View>
                <View style={styles.loadingInline}>
                    <ActivityIndicator size="small" color={Colors.dark.tint} />
                    <Text style={styles.loadingText}>Fetching your daily deals...</Text>
                </View>
            </ScrollView>
        );
    }

    if (guest) {
        return (
            <View style={styles.guestContainer}>
                <Text style={styles.guestText}>Please sign in with Riot to see your live store.</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.guestContainer}>
                <Text style={styles.errorTitle}>ACCESS DENIED</Text>
                <Text style={styles.errorText}>{error}</Text>
                {isAuthError ? (
                    <Pressable style={styles.retryButton} onPress={() => router.push('/login')}>
                        <Text style={styles.retryText}>Sign In Again</Text>
                    </Pressable>
                ) : null}
                <Pressable style={styles.retryButton} onPress={onRefresh}>
                    <Text style={styles.retryText}>Retry Connection</Text>
                </Pressable>
            </View>
        );
    }

    if (storeUnavailable) {
        return (
            <View style={styles.guestContainer}>
                <Text style={styles.unavailableTitle}>STORE LOCKED</Text>
                <Text style={styles.unavailableMessage}>{storeUnavailable.message}</Text>
                <Pressable style={styles.retryButton} onPress={onRefresh}>
                    <Text style={styles.retryText}>Check Eligibility</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <ScrollView 
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.tint} />}
        >
            {wallet ? (
                <View style={styles.walletRow}>
                    <View style={styles.walletPill}>
                        <Text style={styles.walletLabel}>VP</Text>
                        <Text style={styles.walletValue}>{wallet.vp}</Text>
                    </View>
                    <View style={styles.walletPill}>
                        <Text style={styles.walletLabel}>R</Text>
                        <Text style={styles.walletValue}>{wallet.radianite}</Text>
                    </View>
                </View>
            ) : null}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Daily Offers</Text>
            </View>
            <Text style={styles.updatedAt}>Last updated {lastUpdated ? lastUpdated.toLocaleTimeString() : 'just now'}</Text>

            <View style={styles.grid}>
                {offers.map((item, index) => (
                    <View key={index} style={styles.storeItem}>
                        <View style={styles.skinImageContainer}>
                            {item.image ? (
                                <Image source={{ uri: item.image }} style={styles.skinImage} resizeMode="contain" />
                            ) : (
                                <View style={styles.skinPlaceholder} />
                            )}
                        </View>
                        <View style={styles.skinInfo}>
                            <Text style={styles.skinName} numberOfLines={1}>{item.name}</Text>
                            <Text style={styles.priceText}>{item.price ? `${item.price} VP` : 'N/A'}</Text>
                        </View>
                    </View>
                ))}
            </View>

            {nightMarket && nightMarket.length > 0 && (
                <>
                    <View style={[styles.sectionHeader, { marginTop: 30 }]}>
                        <Text style={styles.sectionTitle}>Night Market</Text>
                    </View>
                    <View style={styles.nightMarketGrid}>
                        {nightMarket.map((item: any, index: number) => (
                            <View key={index} style={styles.nightMarketItem}>
                                <Image source={{ uri: item.image }} style={styles.nmImage} resizeMode="contain" />
                                <View style={styles.discountBadge}>
                                    <Text style={styles.discountText}>-{item.discount}%</Text>
                                </View>
                                <Text style={styles.nmName} numberOfLines={1}>{item.name}</Text>
                                <Text style={styles.nmPrice}>{item.price ? `${item.price} VP` : 'N/A'}</Text>
                            </View>
                        ))}
                    </View>
                </>
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
        fontSize: 16,
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
        opacity: 0.5,
        marginBottom: 30,
    },
    retryButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: Colors.dark.tint,
        borderRadius: 4,
    },
    retryText: {
        color: Colors.dark.text,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    walletRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 12,
    },
    walletPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1C2935',
        borderWidth: 1,
        borderColor: '#2D3945',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    walletLabel: {
        color: Colors.dark.accent,
        fontSize: 11,
        marginRight: 8,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    walletValue: {
        color: Colors.dark.text,
        fontSize: 12,
        fontWeight: '800',
    },
    sectionTitle: {
        color: Colors.dark.text,
        fontSize: 18,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    updatedAt: {
        color: Colors.dark.tabIconDefault,
        fontSize: 11,
        marginBottom: 10,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    storeItem: {
        backgroundColor: Colors.dark.card,
        width: '48%',
        marginBottom: 15,
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#2D3945',
        height: 160,
    },
    skinImageContainer: {
        height: 100,
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
        width: '80%',
        height: 10,
        borderRadius: 4,
        backgroundColor: '#22303D',
    },
    skinInfo: {
        padding: 12,
        justifyContent: 'center',
        flex: 1,
    },
    skinName: {
        color: Colors.dark.text,
        fontSize: 13,
        fontWeight: 'bold',
    },
    priceText: {
        color: Colors.dark.accent,
        fontSize: 12,
        marginTop: 4,
        fontWeight: '700',
    },
    nightMarketGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    nightMarketItem: {
        backgroundColor: '#1C2935',
        width: '31%',
        height: 120,
        borderRadius: 8,
        padding: 8,
        borderWidth: 1,
        borderColor: '#BD9C5A',
        alignItems: 'center',
        justifyContent: 'center',
    },
    nmImage: {
        width: '100%',
        height: 60,
    },
    nmName: {
        color: Colors.dark.text,
        fontSize: 10,
        marginTop: 8,
    },
    nmPrice: {
        color: Colors.dark.accent,
        fontSize: 10,
        marginTop: 2,
        fontWeight: '700',
    },
    discountBadge: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: '#46FF94',
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
    },
    discountText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#0F1923',
    },
    unavailableTitle: {
        color: Colors.dark.tabIconDefault,
        fontSize: 24,
        fontWeight: '900',
        marginBottom: 10,
    },
    unavailableMessage: {
        color: Colors.dark.text,
        textAlign: 'center',
        fontSize: 14,
        opacity: 0.7,
        marginBottom: 30,
        lineHeight: 20,
    }
})

export default StorePage
