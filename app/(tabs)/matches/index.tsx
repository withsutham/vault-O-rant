import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Pressable } from "react-native"
import Colors from "../../../constants/Colors"
import { getPlayerData, fetchMatchHistory, formatMatchDate, getQueueName } from "../../../api/valorantService"

// Mock data for visual details (agent, map, score) - real timestamps from API
const MOCK_AGENT_MAP = ['Jett', 'Omen', 'Sova', 'Sage', 'Reyna', 'Killjoy', 'Breach', 'Raze', 'Phoenix', 'Viper'];
const MOCK_MAP_LIST = ['Ascent', 'Bind', 'Haven', 'Split', 'Icebox', 'Lotus', 'Pearl'];

const MatchItem = ({ 
    agent, 
    result, 
    score, 
    map, 
    date,
    queueName 
}: { 
    agent: string; 
    result: string; 
    score: string; 
    map: string; 
    date: string;
    queueName: string;
}) => (
    <View style={[styles.matchItem, result === 'Victory' ? styles.victoryBorder : styles.defeatBorder]}>
        <View style={styles.matchMainInfo}>
            <View style={styles.agentPlaceholder} />
            <View>
                <Text style={styles.agentName}>{agent}</Text>
                <Text style={styles.mapName}>{map} • {queueName}</Text>
            </View>
        </View>
        <View style={styles.matchStats}>
            <Text style={[styles.resultText, result === 'Victory' ? styles.victoryText : styles.defeatText]}>
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
                // Transform API match history to display format
                const transformedMatches = historyData.History.map((match: any, index: number) => {
                    // Use mock data for visual details, real data for timestamps and queue
                    const agent = MOCK_AGENT_MAP[index % MOCK_AGENT_MAP.length];
                    const map = MOCK_MAP_LIST[index % MOCK_MAP_LIST.length];
                    
                    // Mock score - in a real implementation, you'd fetch detailed match data
                    const randomScore = Math.floor(Math.random() * 5) + 10;
                    const opponentScore = Math.floor(Math.random() * 5) + 8;
                    const score = `${randomScore}-${opponentScore}`;
                    const result = randomScore >= opponentScore ? 'Victory' : 'Defeat';
                    
                    return {
                        id: match.MatchID,
                        agent,
                        result,
                        score,
                        map,
                        date: formatMatchDate(match.GameStartTime),
                        queueName: getQueueName(match.QueueID),
                    };
                });

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
    matchMainInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
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
