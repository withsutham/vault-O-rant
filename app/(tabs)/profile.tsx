import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable, ActivityIndicator, ScrollView, RefreshControl } from "react-native"
import Colors from "../../constants/Colors"
import { deleteTokens } from "../../utils/secureStore"
import { router } from "expo-router"
import { getPlayerData, UserInfo, UserRegion } from "../../api/valorantService"

const ProfilePage = () => {
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [userRegion, setUserRegion] = useState<UserRegion | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = async () => {
        setLoading(true);
        const { info, region } = await getPlayerData();
        setUserInfo(info);
        setUserRegion(region);
        setLoading(false);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        const { info, region } = await getPlayerData();
        setUserInfo(info);
        setUserRegion(region);
        setRefreshing(false);
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
                    <Text style={styles.avatarText}>
                        {userInfo ? userInfo.acct.game_name.charAt(0).toUpperCase() : '?'}
                    </Text>
                </View>
                <View style={styles.info}>
                    <Text style={styles.playerName}>
                        {userInfo ? `${userInfo.acct.game_name}#${userInfo.acct.tag_line}` : 'GUEST'}
                    </Text>
                    <Text style={styles.playerLevel}>
                        {userInfo ? 'Authenticated User' : 'Limited Access'}
                    </Text>
                </View>
            </View>
            
            <View style={styles.rankCard}>
                <Text style={styles.sectionTitle}>Current Rank</Text>
                <View style={styles.rankInfo}>
                    <View style={styles.rankIconPlaceholder} />
                    <Text style={styles.rankText}>Diamond 2 (Mock)</Text>
                </View>
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>1.25</Text>
                    <Text style={styles.statLabel}>K/D Ratio</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>54%</Text>
                    <Text style={styles.statLabel}>Win Rate</Text>
                </View>
            </View>

            <View style={styles.detailsCard}>
                <Text style={styles.sectionTitle}>Account Details</Text>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Region (Affinity)</Text>
                    <Text style={styles.detailValue}>
                        {userRegion ? userRegion.pas_affinity : 'N/A'}
                    </Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Shard</Text>
                    <Text style={styles.detailValue}>
                        {userRegion ? userRegion.pas_region : 'N/A'}
                    </Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Riot PUUID</Text>
                    <Text style={styles.detailValue} numberOfLines={1}>
                        {userInfo ? userInfo.sub : 'N/A'}
                    </Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Account Created</Text>
                    <Text style={styles.detailValue}>
                        {userInfo ? new Date(userInfo.acct.created_at).toLocaleDateString() : 'N/A'}
                    </Text>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
    },
    avatarPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.dark.tint,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.dark.text,
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
        fontSize: 14,
        marginTop: 4,
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
        fontSize: 12,
        textTransform: 'uppercase',
        marginBottom: 15,
        letterSpacing: 1,
        fontWeight: 'bold',
    },
    rankInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rankIconPlaceholder: {
        width: 50,
        height: 50,
        backgroundColor: '#383E45',
        borderRadius: 25,
        marginRight: 15,
    },
    rankText: {
        color: Colors.dark.text,
        fontSize: 20,
        fontWeight: 'bold',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    statBox: {
        backgroundColor: Colors.dark.card,
        flex: 1,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    statValue: {
        color: Colors.dark.tint,
        fontSize: 24,
        fontWeight: 'bold',
    },
    statLabel: {
        color: Colors.dark.text,
        fontSize: 12,
        marginTop: 5,
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
        fontSize: 14,
        flex: 1,
    },
    detailValue: {
        color: Colors.dark.text,
        fontSize: 14,
        fontWeight: '600',
        flex: 2,
        textAlign: 'right',
    },
    logoutButton: {
        padding: 18,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.dark.tint,
        borderRadius: 4,
        marginBottom: 20,
    },
    logoutText: {
        color: Colors.dark.tint,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    }
})

export default ProfilePage