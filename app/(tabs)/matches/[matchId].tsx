import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Colors from '../../../constants/Colors';
import { fetchMatchDetailsWithCache, getScoreboard } from '../../../api/valorantService';
import { getAgents, getMaps } from '../../../api/mappingService';
import { getPlayerData } from '../../../api/valorantService';
import { MatchHeaderSection } from './components/MatchHeaderSection';
import { PlayerStatsCard } from './components/PlayerStatsCard';
import { ScoreboardTable } from './components/ScoreboardTable';

const MatchDetailScreen = () => {
    const router = useRouter();
    const { matchId } = useLocalSearchParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [matchDetails, setMatchDetails] = useState<any>(null);
    const [playerUUID, setPlayerUUID] = useState<string | null>(null);
    const [agents, setAgents] = useState<Map<string, any>>(new Map());
    const [maps, setMaps] = useState<Map<string, any>>(new Map());

    useEffect(() => {
        const loadMatchDetails = async () => {
            try {
                setLoading(true);
                setError(null);

                const { info, region } = await getPlayerData();
                if (!info) {
                    setError('Unable to load match details');
                    return;
                }

                setPlayerUUID(info.sub);

                // Fetch game data
                const agentsData = await getAgents();
                const mapsData = await getMaps();

                if (agentsData) {
                    const agentMap = new Map(agentsData.map((a: any) => [a.uuid.toLowerCase(), a]));
                    setAgents(agentMap);
                }

                if (mapsData) {
                    const mapMap = new Map<string, any>();
                    mapsData.forEach((m: any) => {
                        if (m?.uuid) mapMap.set(String(m.uuid).toLowerCase(), m);
                        if (m?.mapUrl) mapMap.set(String(m.mapUrl).toLowerCase(), m);
                    });
                    setMaps(mapMap);
                }

                // Fetch match details
                const activeRegion = region?.pas_region || 'ap';
                const details = await fetchMatchDetailsWithCache(activeRegion, info.sub, matchId as string);

                if (!details) {
                    setError('Failed to load match details');
                    return;
                }

                setMatchDetails(details);
            } catch (err: any) {
                console.error('Error loading match details:', err);
                setError(err.message || 'Failed to load match details');
            } finally {
                setLoading(false);
            }
        };

        loadMatchDetails();
    }, [matchId]);

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={Colors.dark.tint} />
                <Text style={styles.loadingText}>Loading match details...</Text>
            </View>
        );
    }

    if (error || !matchDetails || !playerUUID) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>{error || 'Unable to load match details'}</Text>
                <Pressable style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </Pressable>
            </View>
        );
    }

    const playerInfo = matchDetails.players?.find((p: any) => p.subject === playerUUID);
    
    const { userTeam, enemyTeam, playerTeamId } = getScoreboard(matchDetails, playerUUID);
    
    const mapId = matchDetails.matchInfo?.mapId;
    const normalizedMapId = mapId ? String(mapId).toLowerCase() : '';
    
    // Try to find the map - mapId should match mapUrl
    let mapData = maps.get(normalizedMapId);
    if (!mapData && normalizedMapId) {
        // Try to find by map path suffix or partial path match
        const mapTail = normalizedMapId.split('/').pop() || '';
        for (const [key, value] of maps.entries()) {
            const normalizedKey = key.toLowerCase();
            if (
                normalizedKey === normalizedMapId ||
                normalizedKey.includes(mapTail) ||
                normalizedMapId.includes(normalizedKey.split('/').pop() || '')
            ) {
                mapData = value;
                break;
            }
        }
    }
    
    const mapName = mapData?.displayName || normalizedMapId.split('/').pop() || 'Unknown Map';

    return (
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
            contentInsetAdjustmentBehavior="never"
            automaticallyAdjustContentInsets={false}
            automaticallyAdjustsScrollIndicatorInsets={false}
        >
            <MatchHeaderSection 
                mapName={mapName}
                queueID={matchDetails.matchInfo?.queueID}
                gameStartTime={matchDetails.matchInfo?.gameStartTime}
            />

            {playerInfo && <PlayerStatsCard playerStats={playerInfo.stats} />}

            {userTeam.length > 0 && <ScoreboardTable userTeam={userTeam} enemyTeam={enemyTeam} agents={agents} />}

        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    centerContainer: {
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
    errorText: {
        color: '#FF4655',
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
    },
    backButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: Colors.dark.tint,
        borderRadius: 4,
    },
    backButtonText: {
        color: Colors.dark.text,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
});

export default MatchDetailScreen;
