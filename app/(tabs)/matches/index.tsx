import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Pressable, Image } from "react-native"
import Colors from "../../../constants/Colors"
import { getPlayerData, fetchMatchHistory, fetchMatchDetails, formatMatchDate, getQueueName } from "../../../api/valorantService"
import { getAgents, getMaps } from "../../../api/mappingService"

const MatchItem = ({ 
    agent, 
    agentIcon,
    result, 
    score, 
    map, 
    date,
    queueName 
}: { 
    agent: string; 
    agentIcon?: string;
    result: string; 
    score: string; 
    map: string; 
    date: string;
    queueName: string;
}) => (
    <View style={[styles.matchItem, result === 'Victory' ? styles.victoryBorder : (result === 'Defeat' ? styles.defeatBorder : styles.drawBorder)]}>
        <View style={styles.matchMainInfo}>
            {agentIcon ? (
                <Image source={{ uri: agentIcon }} style={styles.agentIcon} />
            ) : (
                <View style={styles.agentPlaceholder} />
            )}
            <View>
                <Text style={styles.agentName}>{agent}</Text>
                <Text style={styles.mapName}>{map} • {queueName}</Text>
            </View>
        </View>
        <View style={styles.matchStats}>
            <Text style={[styles.resultText, result === 'Victory' ? styles.victoryText : (result === 'Defeat' ? styles.defeatText : styles.drawText)]}>
                {result}
            </Text>
            <Text style={styles.scoreText}>{score}</Text>
            <Text style={styles.dateText}>{date}</Text>
        </View>
    </View>
);

const MatchesPage = () => {
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [guest, setGuest] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadMatchHistory = async () => {
        try {
            setError(null);
            setLoading(true);
            const { info, region } = await getPlayerData();
            
            if (!info) {
                setGuest(true);
                return;
            }

            setGuest(false);
            const activeRegion = region?.pas_region || 'ap';
            const historyData = await fetchMatchHistory(activeRegion, info.sub);

            if (historyData && historyData.History && historyData.History.length > 0) {
                const agentsData = await getAgents();
                const mapsData = await getMaps();
                
                const agentMap = new Map(agentsData.map((a: any) => [a.uuid.toLowerCase(), a]));
                const mapMap = new Map(mapsData.map((m: any) => [m.mapUrl, m.displayName]));

                // Take up to 10 matches to avoid long loading times and rate limits
                const recentMatches = historyData.History.slice(0, 10);
                
                const transformedMatches = await Promise.all(recentMatches.map(async (match: any) => {
                    const details = await fetchMatchDetails(activeRegion, info.sub, match.MatchID);
                    
                    if (!details || !details.matchInfo) {
                        return {
                            id: match.MatchID,
                            agent: 'Unknown',
                            result: 'Unknown',
                            score: '-',
                            map: 'Unknown',
                            date: formatMatchDate(match.GameStartTime),
                            queueName: getQueueName(match.QueueID),
                        };
                    }

                    const playerInfo = details.players?.find((p: any) => p.subject === info.sub);
                    let agentName = 'Unknown';
                    let agentIcon = undefined;
                    let result = 'Unknown';
                    let score = '-';
                    
                    if (playerInfo) {
                        const agentData = agentMap.get(playerInfo.characterId.toLowerCase());
                        if (agentData) {
                            agentName = agentData.displayName;
                            agentIcon = agentData.displayIconSmall;
                        }

                        const teamId = playerInfo.teamId;
                        const myTeam = details.teams?.find((t: any) => t.teamId === teamId);
                        const enemyTeam = details.teams?.find((t: any) => t.teamId !== teamId && t.teamId !== 'Neutral');
                        
                        if (myTeam && enemyTeam) {
                            score = `${myTeam.roundsWon}-${enemyTeam.roundsWon}`;
                            if (myTeam.won) {
                                result = 'Victory';
                            } else if (enemyTeam.won) {
                                result = 'Defeat';
                            } else {
                                result = 'Draw';
                            }
                        } else if (playerInfo.stats) {
                            // Deathmatch fallback
                            score = `${playerInfo.stats.kills} Kills`;
                            result = 'Completed';
                        }
                    }

                    const mapId = details.matchInfo.mapId;
                    const mapName = mapMap.get(mapId) || mapId.split('/').pop() || 'Unknown';

                    return {
                        id: match.MatchID,
                        agent: agentName,
                        agentIcon: agentIcon,
                        result,
                        score,
                        map: mapName,
                        date: formatMatchDate(match.GameStartTime),
                        queueName: getQueueName(details.matchInfo.queueID || match.QueueID),
                    };
                }));

                setMatches(transformedMatches);
            } else {
                setMatches([]);
            }
        } catch (err: any) {
            console.error('Match History Load Error:', err);
            
            if (err.message === 'AUTH_ERROR' || err.isAuthError) {
                setError('Your session has expired. Please sign in again.');
            } else {
                setError(err.friendlyMessage || err.message || 'Failed to load match history.');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadMatchHistory();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadMatchHistory();
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.dark.tint} />
                <Text style={styles.loadingText}>Loading your match history...</Text>
            </View>
        );
    }

    if (guest) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>Sign In Required</Text>
                <Text style={styles.emptyMessage}>Please sign in to view your match history.</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.errorTitle}>Error</Text>
                <Text style={styles.errorMessage}>{error}</Text>
                <Pressable style={styles.retryButton} onPress={onRefresh}>
                    <Text style={styles.retryText}>Retry</Text>
                </Pressable>
            </View>
        );
    }

    if (matches.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>No Matches</Text>
                <Text style={styles.emptyMessage}>No matches in the last 30 days</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={matches}
                renderItem={({ item }) => <MatchItem {...item} />}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.tint} />}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    listContainer: {
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
    emptyContainer: {
        flex: 1,
        backgroundColor: Colors.dark.background,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        color: Colors.dark.text,
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    emptyMessage: {
        color: Colors.dark.tabIconDefault,
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 20,
    },
    errorTitle: {
        color: '#FF4655',
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    errorMessage: {
        color: Colors.dark.text,
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 20,
        opacity: 0.7,
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
    matchItem: {
        backgroundColor: Colors.dark.card,
        padding: 16,
        marginBottom: 12,
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderLeftWidth: 4,
    },
    victoryBorder: {
        borderLeftColor: '#46FF94',
    },
    defeatBorder: {
        borderLeftColor: '#FF4655',
    },
    drawBorder: {
        borderLeftColor: '#E2E2E2',
    },
    matchMainInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    agentIcon: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        marginRight: 12,
    },
    agentPlaceholder: {
        width: 45,
        height: 45,
        backgroundColor: '#383E45',
        borderRadius: 22.5,
        marginRight: 12,
    },
    agentName: {
        color: Colors.dark.text,
        fontSize: 16,
        fontWeight: 'bold',
    },
    mapName: {
        color: Colors.dark.tabIconDefault,
        fontSize: 12,
        marginTop: 2,
    },
    matchStats: {
        alignItems: 'flex-end',
    },
    resultText: {
        fontSize: 14,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    victoryText: {
        color: '#46FF94',
    },
    defeatText: {
        color: '#FF4655',
    },
    drawText: {
        color: '#E2E2E2',
    },
    scoreText: {
        color: Colors.dark.text,
        fontSize: 14,
        marginVertical: 2,
    },
    dateText: {
        color: Colors.dark.tabIconDefault,
        fontSize: 10,
    }
})

export default MatchesPage
