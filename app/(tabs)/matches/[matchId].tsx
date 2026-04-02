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
import { MapDetailsSection } from './components/MapDetailsSection';

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
                    const mapMap = new Map(mapsData.map((m: any) => [m.mapUrl, m]));
                    setMaps(mapMap);
                }

                // Fetch match details
                const activeRegion = region?.pas_region || 'ap';
                const details = await fetchMatchDetailsWithCache(activeRegion, info.sub, matchId as string);

                if (!details) {
                    setError('Failed to load match details');
                    return;
                }

                console.log('Match Details:', JSON.stringify(details, null, 2));
                console.log('Players:', details.players);
                console.log('MatchInfo:', details.matchInfo);

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
    console.log('Player Info:', playerInfo);
    
    const { userTeam, enemyTeam, playerTeamId } = getScoreboard(matchDetails, playerUUID);
    console.log('User Team:', userTeam);
    console.log('Enemy Team:', enemyTeam);
    
    const mapData = maps.get(matchDetails.matchInfo?.mapId);
    console.log('Map Data:', mapData);
    console.log('Map ID:', matchDetails.matchInfo?.mapId);
    
    const mapName = mapData?.displayName || 'Unknown Map';
    console.log('Map Name:', mapName);

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <MatchHeaderSection 
                mapName={mapName}
                queueID={matchDetails.matchInfo?.queueID}
                gameStartTime={matchDetails.matchInfo?.gameStartTime}
            />

            {playerInfo && <PlayerStatsCard playerStats={playerInfo.stats} />}

            {userTeam.length > 0 && <ScoreboardTable userTeam={userTeam} enemyTeam={enemyTeam} />}

            {mapData && (
                <MapDetailsSection 
                    mapId={matchDetails.matchInfo?.mapId}
                    mapName={mapName}
                />
            )}
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
