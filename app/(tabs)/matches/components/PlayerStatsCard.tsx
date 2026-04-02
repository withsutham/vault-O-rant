import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../../../../constants/Colors';

interface PlayerStatsCardProps {
    playerStats: any;
}

export const PlayerStatsCard: React.FC<PlayerStatsCardProps> = ({ playerStats }) => {
    if (!playerStats) return null;

    // Safe fallbacks for stats that might not exist
    const kills = playerStats.kills ?? 0;
    const deaths = playerStats.deaths ?? 0;
    const assists = playerStats.assists ?? 0;

    return (
        <View style={styles.playerStatsSection}>
            <Text style={styles.sectionTitle}>Your Performance</Text>
            <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>K/D/A</Text>
                    <Text style={styles.statValue}>
                        {kills}/{deaths}/{assists}
                    </Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    playerStatsSection: {
        padding: 16,
    },
    sectionTitle: {
        color: Colors.dark.text,
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    statsGrid: {
        flexDirection: 'column',
        justifyContent: 'space-between',
    },
    statBox: {
        backgroundColor: Colors.dark.card,
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
        alignItems: 'center',
    },
    statLabel: {
        color: Colors.dark.tabIconDefault,
        fontSize: 12,
        marginBottom: 4,
    },
    statValue: {
        color: Colors.dark.text,
        fontSize: 18,
        fontWeight: 'bold',
    },
});
