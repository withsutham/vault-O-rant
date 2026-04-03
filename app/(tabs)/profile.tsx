import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable, ActivityIndicator, ScrollView, RefreshControl, Alert } from "react-native"
import Colors from "../../constants/Colors"
import { deleteTokens } from "../../utils/secureStore"
import { router } from "expo-router"
import { getPlayerData, fetchPlayerMMR, fetchCompetitiveHistory, getPeakRankFromHistory, fetchPlayerLoadout } from "../../api/valorantService"
import { getCompetitiveTiers, getPlayerCards } from "../../api/mappingService"

const ProfilePage = () => {
    const [userInfo, setUserInfo] = useState<any>(null);
    const [userRegion, setUserRegion] = useState<any>(null);
    const [rankData, setRankData] = useState<any>(null);
    const [playerBanner, setPlayerBanner] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = async () => {
        try {
            console.log('Loading Profile Data...');
            const { info, region } = await getPlayerData();
            setUserInfo(info);
            setUserRegion(region);

            if (info && region) {
                console.log('Fetching MMR for:', info.sub, 'in', region.pas_region);
                const playerMmr = await fetchPlayerMMR(region.pas_region, info.sub);
                const tiers = await getCompetitiveTiers();

                try {
                    const loadout = await fetchPlayerLoadout(region.pas_region, info.sub);
                    const playerCardId = loadout?.Identity?.PlayerCardID;
                    if (playerCardId) {
                        const cards = await getPlayerCards();
                        const card = (cards || []).find((c: any) => c.uuid?.toLowerCase() === String(playerCardId).toLowerCase());
                        if (card) {
                            setPlayerBanner(card.wideArt || card.largeArt || card.displayIcon || null);
                        }
                    }
                } catch {
                    setPlayerBanner(null);
                }

                if (playerMmr && playerMmr.LatestCompetitiveUpdate && tiers && tiers.length > 0) {
                    const currentTier = playerMmr.LatestCompetitiveUpdate.TierAfterUpdate || 0;
                    const rr = playerMmr.LatestCompetitiveUpdate.RankedRatingAfterUpdate || 0;
                    const fallbackTier = playerMmr.CurrentCompetitiveTier || 0;
                    const fallbackRr = playerMmr.RankedRating || 0;
                    const resolvedTier = currentTier > 0 ? currentTier : fallbackTier;
                    const resolvedRr = currentTier > 0 ? rr : fallbackRr;
                    const tierInfo = tiers.find((t: any) => t.tier === resolvedTier);
                    
                    if (resolvedTier > 0 && tierInfo) {
                        setRankData({
                            name: tierInfo.tierName,
                            icon: tierInfo.largeIcon,
                            rr: resolvedRr,
                            isUnranked: false,
                        });
                    } else if (resolvedTier > 0) {
                        setRankData({
                            name: `Tier ${resolvedTier}`,
                            icon: null,
                            rr: resolvedRr,
                            isUnranked: false,
                        });
                    }
                } else {
                    // Account is unranked - try to get peak rank
                    console.log('Account is unranked - fetching competitive history for peak rank');
                    const history = await fetchCompetitiveHistory(region.pas_region, info.sub);
                    const peak = getPeakRankFromHistory(history);
                    
                    setRankData({ 
                        name: 'Unranked', 
                        icon: null, 
                        rr: 0,
                        isUnranked: true,
                        peakRank: peak?.tier || null,
                        peakName: peak?.name || null,
                        peakEpisode: peak?.episode || null,
                        message: 'Complete placement matches to get ranked'
                    });
                }
            } else if (!info) {
                console.log('No user info found - user may be a guest');
                setPlayerBanner(null);
            }
        } catch (error: any) {
            console.error('Profile loadData error:', error);
            
            // Handle auth errors
            if (error.message === 'AUTH_ERROR' || error.isAuthError) {
                Alert.alert('Session Expired', 'Your session has expired. Please sign in again.');
            } else {
                Alert.alert('Data Error', 'Failed to load player statistics.');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleLogout = async () => {
        await deleteTokens();
        router.replace('/');
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.dark.tint} />
                <Text style={styles.loadingText}>Fetching real-time data...</Text>
            </View>
        );
    }

    return (
        <ScrollView 
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.tint} />
            }
        >
            <View style={styles.header}>
                <View style={styles.avatarPlaceholder}>
                    {playerBanner ? (
                        <Image source={{ uri: playerBanner }} style={styles.bannerImage} resizeMode="cover" />
                    ) : (
                        <Text style={styles.avatarText}>
                            {userInfo ? userInfo.acct.game_name.charAt(0).toUpperCase() : '?'}
                        </Text>
                    )}
                </View>
                <View style={styles.info}>
                    <Text style={styles.playerName}>
                        {userInfo ? `${userInfo.acct.game_name}#${userInfo.acct.tag_line}` : 'GUEST'}
                    </Text>
                    <Text style={styles.playerLevel}>
                        {userInfo ? 'AUTHENTICATED' : 'LIMITED ACCESS'}
                    </Text>
                </View>
            </View>
            
            <View style={styles.rankCard}>
                <Text style={styles.sectionTitle}>Current Rank</Text>
                <View style={styles.rankInfo}>
                    {rankData?.icon && <Image source={{ uri: rankData.icon }} style={styles.rankIcon} />}
                    <View>
                        <Text style={styles.rankText}>{rankData?.name || 'Unranked'}</Text>
                        <Text style={styles.rrText}>
                            {rankData?.isUnranked ? rankData?.message || 'Not yet ranked' : `${rankData?.rr || 0} RR`}
                        </Text>
                    </View>
                </View>
                
                {rankData?.isUnranked && rankData?.peakName && (
                    <View style={styles.peakRankSection}>
                        <Text style={styles.peakRankLabel}>Peak Rank (Current Act)</Text>
                        <Text style={styles.peakRankValue}>
                            {rankData.peakName}
                        </Text>
                        {rankData?.peakEpisode && (
                            <Text style={styles.peakRankSubtext}>
                                Episode {rankData.peakEpisode.episode}: Act {rankData.peakEpisode.act}
                            </Text>
                        )}
                    </View>
                )}
            </View>

            <View style={styles.detailsCard}>
                <Text style={styles.sectionTitle}>Debug Info</Text>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Entitlements Token</Text>
                    <Text style={[styles.detailValue, { color: userInfo ? '#46FF94' : '#FF4655' }]}>
                        {userInfo ? 'PRESENT' : 'MISSING'}
                    </Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Detected Shard</Text>
                    <Text style={styles.detailValue}>{userRegion?.pas_region || 'N/A'}</Text>
                </View>
            </View>

            <View style={styles.detailsCard}>
                <Text style={styles.sectionTitle}>Account Details</Text>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Region</Text>
                    <Text style={styles.detailValue}>{userRegion?.pas_affinity || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Shard</Text>
                    <Text style={styles.detailValue}>{userRegion?.pas_region || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>PUUID</Text>
                    <Text style={styles.detailValue} numberOfLines={1}>{userInfo?.sub || 'N/A'}</Text>
                </View>
            </View>

            <Pressable style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutText}>{userInfo ? 'Log Out' : 'Sign In with Riot'}</Text>
            </Pressable>
            
            <View style={{ height: 40 }} />
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: Colors.dark.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: Colors.dark.text,
        marginTop: 10,
        opacity: 0.7,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
    },
    avatarPlaceholder: {
        width: 120,
        height: 68,
        borderRadius: 10,
        backgroundColor: Colors.dark.card,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2D3945',
        overflow: 'hidden',
    },
    bannerImage: {
        width: '100%',
        height: '100%',
    },
    avatarText: {
        color: Colors.dark.text,
        fontSize: 32,
        fontWeight: 'bold',
    },
    info: {
        marginLeft: 20,
        flex: 1,
    },
    playerName: {
        color: Colors.dark.text,
        fontSize: 22,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    playerLevel: {
        color: Colors.dark.accent,
        fontSize: 12,
        marginTop: 4,
        fontWeight: 'bold',
    },
    rankCard: {
        backgroundColor: Colors.dark.card,
        padding: 20,
        borderRadius: 10,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: Colors.dark.tint,
    },
    sectionTitle: {
        color: Colors.dark.tabIconDefault,
        fontSize: 11,
        textTransform: 'uppercase',
        marginBottom: 15,
        letterSpacing: 1.5,
        fontWeight: 'bold',
    },
    rankInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rankIcon: {
        width: 60,
        height: 60,
        marginRight: 15,
    },
    rankText: {
        color: Colors.dark.text,
        fontSize: 20,
        fontWeight: 'bold',
    },
    rrText: {
        color: Colors.dark.tabIconDefault,
        fontSize: 14,
    },
    detailsCard: {
        backgroundColor: Colors.dark.card,
        padding: 20,
        borderRadius: 10,
        marginBottom: 30,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        alignItems: 'center',
    },
    detailLabel: {
        color: Colors.dark.tabIconDefault,
        fontSize: 13,
    },
    detailValue: {
        color: Colors.dark.text,
        fontSize: 13,
        fontWeight: '600',
        flex: 1,
        textAlign: 'right',
        marginLeft: 20,
    },
    logoutButton: {
        padding: 18,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.dark.tint,
        borderRadius: 4,
    },
    logoutText: {
        color: Colors.dark.tint,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    peakRankSection: {
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#2D3945',
    },
    peakRankLabel: {
        color: Colors.dark.tabIconDefault,
        fontSize: 11,
        textTransform: 'uppercase',
        marginBottom: 8,
        letterSpacing: 1,
        fontWeight: 'bold',
    },
    peakRankValue: {
        color: '#FFB600',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    peakRankSubtext: {
        color: Colors.dark.tabIconDefault,
        fontSize: 12,
    }
})

export default ProfilePage
