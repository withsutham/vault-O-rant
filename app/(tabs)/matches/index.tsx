import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Pressable, Image } from "react-native"
import { useRouter } from "expo-router"
import Colors from "../../../constants/Colors"
import { getPlayerData, fetchMatchHistory, fetchMatchDetailsWithCache, clearMatchDetailsCache, clearApiDataCache, formatMatchDate, getQueueName } from "../../../api/valorantService"
import { getAgents, getMaps } from "../../../api/mappingService"
import { normalizeAppError } from '../../../utils/appErrors';
import { trackEvent } from '../../../utils/analytics';

const MatchItem = ({ 
    id,
    agent, 
    agentIcon,
    result, 
    score, 
    map, 
    date,
    queueName,
    onPress
}: { 
    id: string;
    agent: string; 
    agentIcon?: string;
    result: string; 
    score: string; 
    map: string; 
    date: string;
    queueName: string;
    onPress: (matchId: string) => void;
}) => (
    <Pressable onPress={() => onPress(id)}>
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
    </Pressable>
);

// Helper function to calculate match statistics
const calculateStats = (matches: any[]): { wins: number; losses: number; winRate: string; mostPlayedAgent: string } => {
    const wins = matches.filter(m => m.result === 'Victory').length;
    const losses = matches.filter(m => m.result === 'Defeat').length;
    const total = wins + losses;
    const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : '0.0';
    
    // Find most played agent
    const agentCounts = new Map<string, number>();
    matches.forEach(m => {
        if (m.agent && m.agent !== 'Unknown') {
            agentCounts.set(m.agent, (agentCounts.get(m.agent) || 0) + 1);
        }
    });
    
    let mostPlayedAgent = 'None';
    let maxCount = 0;
    agentCounts.forEach((count, agent) => {
        if (count > maxCount) {
            maxCount = count;
            mostPlayedAgent = agent;
        }
    });
    
    return { wins, losses, winRate: `${winRate}%`, mostPlayedAgent };
};

// Stats Header Component
const StatsHeader = ({ stats }: { stats: { wins: number; losses: number; winRate: string; mostPlayedAgent: string } | null }) => {
    if (!stats) return null;
    
    return (
        <View style={styles.statsHeader}>
            <View style={styles.statItem}>
                <Text style={styles.statLabel}>Record</Text>
                <Text style={styles.statValue}>{stats.wins}-{stats.losses}</Text>
            </View>
            <View style={styles.statItem}>
                <Text style={styles.statLabel}>Win Rate</Text>
                <Text style={styles.statValue}>{stats.winRate}</Text>
            </View>
            <View style={styles.statItem}>
                <Text style={styles.statLabel}>Main Agent</Text>
                <Text style={styles.statValue} numberOfLines={1}>{stats.mostPlayedAgent}</Text>
            </View>
        </View>
    );
};

const MatchesPage = () => {
    const [matches, setMatches] = useState<any[]>([]);
    const [allHistoryMatches, setAllHistoryMatches] = useState<any[]>([]); // Store all fetched matches
    const [displayedCount, setDisplayedCount] = useState(5); // Initially show 5 matches
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [guest, setGuest] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAuthError, setIsAuthError] = useState(false);
    const [stats, setStats] = useState<{ wins: number; losses: number; winRate: string; mostPlayedAgent: string } | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const router = useRouter();

    const handleMatchPress = (matchId: string) => {
        trackEvent('match_opened', { matchId: matchId.slice(0, 8) });
        router.push(`/matches/${matchId}`);
    };

    const loadMatchHistory = async (forceRefresh: boolean = false) => {
        try {
            setError(null);
            setIsAuthError(false);
            setLoading(true);
            setDisplayedCount(5); // Reset to show first 5
            
            // Clear cache on manual refresh to get fresh data
            if (forceRefresh) {
                clearMatchDetailsCache();
                clearApiDataCache();
            }
            
            const { info, region } = await getPlayerData();
            
            if (!info) {
                setGuest(true);
                return;
            }

            setGuest(false);
            const activeRegion = region?.pas_region || 'ap';
            const historyData = await fetchMatchHistory(activeRegion, info.sub, forceRefresh);

            if (historyData && historyData.History && historyData.History.length > 0) {
                const agentsData = await getAgents();
                const mapsData = await getMaps();
                
                if (!agentsData || !mapsData) {
                    throw new Error('Failed to load game data');
                }
                
                const agentMap = new Map(agentsData.map((a: any) => [a.uuid.toLowerCase(), a]));
                const mapMap = new Map(mapsData.map((m: any) => [m.mapUrl, m.displayName]));

                // Process first 5 matches initially, rest on demand
                const recentMatches = historyData.History.slice(0, 20); // Get up to 20 for lazy loading
                
                const transformedMatches = await Promise.all(recentMatches.map(async (match: any) => {
                    // Use cached version for faster repeat loads
                    const details = await fetchMatchDetailsWithCache(activeRegion, info.sub, match.MatchID);
                    
                    if (!details || !details.matchInfo) {
                        return {
                            id: match.MatchID,
                            agent: 'Unknown',
                            agentIcon: undefined,
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

                setAllHistoryMatches(transformedMatches);
                setMatches(transformedMatches.slice(0, 5)); // Show first 5
                
                // Calculate stats
                const stats = calculateStats(transformedMatches);
                setStats(stats);
                setLastUpdated(new Date());
                trackEvent('matches_load_success', { total: transformedMatches.length });
            } else {
                setAllHistoryMatches([]);
                setMatches([]);
                setStats(null);
                setLastUpdated(new Date());
                trackEvent('matches_load_success', { total: 0 });
            }
        } catch (err: any) {
            const normalizedError = normalizeAppError(err, 'Failed to load match history.');
            setIsAuthError(normalizedError.isAuthError);
            setError(normalizedError.message);
            trackEvent('matches_load_failed', { source: normalizedError.source, message: normalizedError.message });
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        loadMatchHistory();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadMatchHistory(true);
    };

    if (loading && !refreshing) {
        const skeletonRows = Array.from({ length: 5 });
        return (
            <View style={styles.container}>
                <View style={styles.listContainer}>
                    <View style={styles.statsHeader}>
                        <View style={styles.statItem}><View style={styles.skeletonLineWide} /></View>
                        <View style={styles.statItem}><View style={styles.skeletonLineWide} /></View>
                        <View style={styles.statItem}><View style={styles.skeletonLineWide} /></View>
                    </View>
                    {skeletonRows.map((_, index) => (
                        <View key={`match-skeleton-${index}`} style={styles.matchItem}>
                            <View style={[styles.agentPlaceholder, styles.skeletonBlock]} />
                            <View style={{ flex: 1 }}>
                                <View style={styles.skeletonLine} />
                                <View style={[styles.skeletonLine, { width: '55%', marginTop: 8 }]} />
                            </View>
                        </View>
                    ))}
                    <View style={styles.loadingInline}>
                        <ActivityIndicator size="small" color={Colors.dark.tint} />
                        <Text style={styles.loadingText}>Loading your match history...</Text>
                    </View>
                </View>
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
                {isAuthError ? (
                    <Pressable style={styles.retryButton} onPress={() => router.push('/login')}>
                        <Text style={styles.retryText}>Sign In Again</Text>
                    </Pressable>
                ) : null}
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
                renderItem={({ item }) => <MatchItem {...item} onPress={handleMatchPress} />}
                keyExtractor={item => item.id}
                contentInsetAdjustmentBehavior="never"
                automaticallyAdjustContentInsets={false}
                automaticallyAdjustsScrollIndicatorInsets={false}
                contentContainerStyle={styles.listContainer}
                ListHeaderComponent={<StatsHeader stats={stats} />}
                ListFooterComponent={
                    <View>
                        {allHistoryMatches.length > displayedCount ? (
                            <Pressable 
                                style={styles.loadMoreButton}
                                onPress={() => {
                                    const newCount = Math.min(displayedCount + 5, allHistoryMatches.length);
                                    setDisplayedCount(newCount);
                                    setMatches(allHistoryMatches.slice(0, newCount));
                                }}
                            >
                                <Text style={styles.loadMoreText}>
                                    Load More ({displayedCount}/{allHistoryMatches.length})
                                </Text>
                            </Pressable>
                        ) : null}
                        <Text style={styles.updatedAt}>Last updated {lastUpdated ? lastUpdated.toLocaleTimeString() : 'just now'}</Text>
                    </View>
                }
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
        marginTop: 4,
        opacity: 0.7,
    },
    loadingInline: {
        marginTop: 8,
        alignItems: 'center',
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
     },
     statsHeader: {
         backgroundColor: Colors.dark.card,
         padding: 16,
         marginBottom: 16,
         borderRadius: 8,
         flexDirection: 'row',
         justifyContent: 'space-around',
         borderTopWidth: 2,
         borderTopColor: Colors.dark.tint,
     },
     statItem: {
         alignItems: 'center',
     },
     statLabel: {
         color: Colors.dark.tabIconDefault,
         fontSize: 12,
         marginBottom: 6,
     },
     statValue: {
         color: Colors.dark.text,
         fontSize: 16,
         fontWeight: 'bold',
     },
     loadMoreButton: {
         paddingVertical: 14,
         paddingHorizontal: 16,
         backgroundColor: Colors.dark.card,
         borderRadius: 8,
         marginTop: 12,
         alignItems: 'center',
         borderWidth: 1,
         borderColor: Colors.dark.tint,
     },
     loadMoreText: {
          color: Colors.dark.tint,
          fontSize: 14,
          fontWeight: '600',
      },
      updatedAt: {
          color: Colors.dark.tabIconDefault,
          fontSize: 11,
          marginTop: 12,
          textAlign: 'center',
      },
      skeletonBlock: {
          backgroundColor: '#22303D',
      },
      skeletonLine: {
          width: '70%',
          height: 10,
          borderRadius: 4,
          backgroundColor: '#22303D',
      },
      skeletonLineWide: {
          width: 70,
          height: 10,
          borderRadius: 4,
          backgroundColor: '#22303D',
      },
  })

export default MatchesPage
