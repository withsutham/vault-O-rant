import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../../../../constants/Colors';

interface ScoreboardTableProps {
    userTeam: any[];
    enemyTeam: any[];
}

export const ScoreboardTable: React.FC<ScoreboardTableProps> = ({ userTeam, enemyTeam }) => {
    // Debug: log player structure
    if (userTeam.length > 0) {
        console.log('ScoreboardTable - Player keys available:', Object.keys(userTeam[0]));
    }

    // Try to find the name field - it might be under different names
    const getPlayerName = (player: any): string => {
        return player.name || player.gameName || player.game_name || 'Player';
    };

    return (
        <View style={styles.scoreboardSection}>
            <Text style={styles.sectionTitle}>Full Scoreboard</Text>
            
            {/* User Team */}
            {userTeam.length > 0 && (
                <View style={styles.teamSection}>
                    <Text style={styles.teamName}>Your Team</Text>
                    {userTeam.map((player: any, index: number) => (
                        <View key={index} style={[styles.playerRow, index === userTeam.length - 1 && styles.lastPlayerRow]}>
                            <Text style={styles.playerName}>{getPlayerName(player)}</Text>
                            <Text style={styles.playerStats}>
                                {player.stats?.kills || 0}/{player.stats?.deaths || 0}/{player.stats?.assists || 0}
                            </Text>
                        </View>
                    ))}
                </View>
            )}

            {/* Enemy Team */}
            {enemyTeam.length > 0 && (
                <View style={styles.teamSection}>
                    <Text style={styles.teamName}>Enemy Team</Text>
                    {enemyTeam.map((player: any, index: number) => (
                        <View key={index} style={[styles.playerRow, index === enemyTeam.length - 1 && styles.lastPlayerRow]}>
                            <Text style={styles.playerName}>{getPlayerName(player)}</Text>
                            <Text style={styles.playerStats}>
                                {player.stats?.kills || 0}/{player.stats?.deaths || 0}/{player.stats?.assists || 0}
                            </Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    scoreboardSection: {
        padding: 16,
    },
    sectionTitle: {
        color: Colors.dark.text,
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    teamSection: {
        backgroundColor: Colors.dark.card,
        borderRadius: 8,
        marginBottom: 16,
        overflow: 'hidden',
    },
    teamName: {
        color: Colors.dark.text,
        fontSize: 14,
        fontWeight: 'bold',
        backgroundColor: Colors.dark.background,
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.tabIconDefault,
    },
    playerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.background,
    },
    lastPlayerRow: {
        borderBottomWidth: 0,
    },
    playerName: {
        color: Colors.dark.text,
        fontSize: 14,
        flex: 1,
    },
    playerStats: {
        color: Colors.dark.tabIconDefault,
        fontSize: 12,
        textAlign: 'right',
    },
});
