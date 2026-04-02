import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../../../../constants/Colors';
import { calculateHeadshotPercent, getACS, getEconRating } from '../../../../api/valorantService';

interface PlayerStatsCardProps {
    playerStats: any;
}

export const PlayerStatsCard: React.FC<PlayerStatsCardProps> = ({ playerStats }) => {
    if (!playerStats) return null;

    return (
        <View style={styles.playerStatsSection}>
            <Text style={styles.sectionTitle}>Your Performance</Text>
            <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>K/D/A</Text>
                    <Text style={styles.statValue}>
                        {playerStats.kills || 0}/{playerStats.deaths || 0}/{playerStats.assists || 0}
                    </Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>ACS</Text>
                    <Text style={styles.statValue}>{getACS(playerStats)}</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Headshot %</Text>
                    <Text style={styles.statValue}>{calculateHeadshotPercent(playerStats)}%</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Econ Rating</Text>
                    <Text style={styles.statValue}>{getEconRating(playerStats)}</Text>
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
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    statBox: {
        width: '48%',
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
