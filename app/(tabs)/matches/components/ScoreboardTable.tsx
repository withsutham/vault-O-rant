import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Colors from '../../../../constants/Colors';

interface ScoreboardTableProps {
    userTeam: any[];
    enemyTeam: any[];
    agents: Map<string, any>;
}

export const ScoreboardTable: React.FC<ScoreboardTableProps> = ({ userTeam, enemyTeam, agents }) => {
    // Debug: log player structure
    if (userTeam.length > 0) {
        console.log('ScoreboardTable - Player keys available:', Object.keys(userTeam[0]));
    }

    // Try to find the name field - it might be under different names
    const getPlayerName = (player: any): string => {
        return player.gameName || player.name || player.game_name || 'Player';
    };

    const getAgentIcon = (player: any): string | undefined => {
        const characterId = player?.characterId;
        if (!characterId) return undefined;
        const agent = agents.get(String(characterId).toLowerCase());
        return agent?.displayIconSmall || agent?.displayIcon;
    };

    const comparePlayers = (a: any, b: any): number => {
        const aKills = a?.stats?.kills ?? 0;
        const bKills = b?.stats?.kills ?? 0;
        if (bKills !== aKills) return bKills - aKills;

        const aAssists = a?.stats?.assists ?? 0;
        const bAssists = b?.stats?.assists ?? 0;
        if (bAssists !== aAssists) return bAssists - aAssists;

        const aDeaths = a?.stats?.deaths ?? 0;
        const bDeaths = b?.stats?.deaths ?? 0;
        return aDeaths - bDeaths;
    };

    const sortedUserTeam = [...userTeam].sort(comparePlayers);
    const sortedEnemyTeam = [...enemyTeam].sort(comparePlayers);

    return (
        <View style={styles.scoreboardSection}>
            <Text style={styles.sectionTitle}>Full Scoreboard</Text>
            
            {/* User Team */}
            {userTeam.length > 0 && (
                <View style={styles.teamSection}>
                    <Text style={styles.teamName}>Your Team</Text>
                    {sortedUserTeam.map((player: any, index: number) => {
                        const agentIcon = getAgentIcon(player);
                        return (
                            <View key={index} style={[styles.playerRow, index === sortedUserTeam.length - 1 && styles.lastPlayerRow]}>
                                <View style={styles.playerInfo}>
                                    {agentIcon ? (
                                        <Image source={{ uri: agentIcon }} style={styles.agentIcon} />
                                    ) : (
                                        <View style={styles.agentIconPlaceholder} />
                                    )}
                                    <Text style={styles.playerName}>{getPlayerName(player)}</Text>
                                </View>
                                <Text style={styles.playerStats}>
                                    {player.stats?.kills || 0}/{player.stats?.deaths || 0}/{player.stats?.assists || 0}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            )}

            {/* Enemy Team */}
            {enemyTeam.length > 0 && (
                <View style={styles.teamSection}>
                    <Text style={styles.teamName}>Enemy Team</Text>
                    {sortedEnemyTeam.map((player: any, index: number) => {
                        const agentIcon = getAgentIcon(player);
                        return (
                            <View key={index} style={[styles.playerRow, index === sortedEnemyTeam.length - 1 && styles.lastPlayerRow]}>
                                <View style={styles.playerInfo}>
                                    {agentIcon ? (
                                        <Image source={{ uri: agentIcon }} style={styles.agentIcon} />
                                    ) : (
                                        <View style={styles.agentIconPlaceholder} />
                                    )}
                                    <Text style={styles.playerName}>{getPlayerName(player)}</Text>
                                </View>
                                <Text style={styles.playerStats}>
                                    {player.stats?.kills || 0}/{player.stats?.deaths || 0}/{player.stats?.assists || 0}
                                </Text>
                            </View>
                        );
                    })}
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
    playerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    agentIcon: {
        width: 24,
        height: 24,
        borderRadius: 4,
        marginRight: 8,
    },
    agentIconPlaceholder: {
        width: 24,
        height: 24,
        borderRadius: 4,
        marginRight: 8,
        backgroundColor: Colors.dark.background,
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
