import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Colors from '../../../constants/Colors';
import { fetchMatchDetailsWithCache, getScoreboard } from '../../../api/valorantService';
import { getAgents, getMaps } from '../../../api/mappingService';
import { getPlayerData } from '../../../api/valorantService';
import { MatchHeaderSection } from './components/MatchHeaderSection';
import { PlayerStatsCard } from './components/PlayerStatsCard';
import { ScoreboardTable } from './components/ScoreboardTable';
import { MapDetailsSection } from './components/MapDetailsSection';
import { debugLog, infoLog, flushLogsToFile, getLogFilePath } from '../../../utils/logger';

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
                
                // Log first player to see structure
                if (details.players && details.players.length > 0) {
                    console.log('First player structure:', JSON.stringify(details.players[0], null, 2));
                    console.log('First player stats:', JSON.stringify(details.players[0].stats, null, 2));
                }

                debugLog('Match Details loaded', details);
                debugLog('Players array', details.players);
                debugLog('MatchInfo', details.matchInfo);
                if (details.players && details.players.length > 0) {
                    debugLog('First player structure', details.players[0]);
                    debugLog('First player stats', details.players[0].stats);
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
        const handleExportLogs = async () => {
            const filePath = await flushLogsToFile();
            Alert.alert('Logs Exported', `Debug logs saved to:\n${filePath}\n\nPlease check your Documents folder.`);
        };

        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>{error || 'Unable to load match details'}</Text>
                <Pressable style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </Pressable>
                <Pressable style={styles.exportButton} onPress={handleExportLogs}>
                    <Text style={styles.exportButtonText}>Export Logs</Text>
                </Pressable>
            </View>
        );
    }

    const playerInfo = matchDetails.players?.find((p: any) => p.subject === playerUUID);
    debugLog('==== MATCH DETAIL DEBUG START ====');
    debugLog('Player Info found', !!playerInfo);
    debugLog('Player Info keys', playerInfo ? Object.keys(playerInfo) : 'N/A');
    if (playerInfo?.stats) {
        debugLog('Player Stats keys', Object.keys(playerInfo.stats));
        debugLog('Player Stats values', playerInfo.stats);
    }
    
    const { userTeam, enemyTeam, playerTeamId } = getScoreboard(matchDetails, playerUUID);
    debugLog('User Team length', userTeam.length);
    debugLog('Enemy Team length', enemyTeam.length);
    if (userTeam.length > 0) {
        debugLog('First user team player keys', Object.keys(userTeam[0]));
        debugLog('First user team player full data', userTeam[0]);
    }
    
    const mapId = matchDetails.matchInfo?.mapId;
    debugLog('Map ID from matchInfo', mapId);
    debugLog('Available maps in map', Array.from(maps.keys()));
    
    // Try to find the map - mapId should match mapUrl
    let mapData = maps.get(mapId);
    if (!mapData && mapId) {
        // Try to find by checking if any key contains this mapId
        for (const [key, value] of maps.entries()) {
            if (key === mapId || key.includes(mapId.split('/').pop() || '')) {
                mapData = value;
                break;
            }
        }
    }
    debugLog('Map Data found', !!mapData);
    if (mapData) {
        debugLog('Map Data', mapData);
    }
    
    const mapName = mapData?.displayName || 'Unknown Map';
    debugLog('Final Map Name', mapName);
    debugLog('==== MATCH DETAIL DEBUG END ====');

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

            <View style={styles.exportLogsContainer}>
                <Pressable 
                    style={styles.exportLogsButton}
                    onPress={async () => {
                        const filePath = await flushLogsToFile();
                        Alert.alert('Logs Exported', `Debug logs saved to:\n${filePath}`);
                    }}
                >
                    <Text style={styles.exportLogsButtonText}>Export Debug Logs</Text>
                </Pressable>
            </View>
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
    exportButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: Colors.dark.card,
        borderRadius: 4,
        marginTop: 12,
        borderWidth: 1,
        borderColor: Colors.dark.tint,
    },
    exportButtonText: {
        color: Colors.dark.tint,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    exportLogsContainer: {
        padding: 16,
        paddingBottom: 32,
    },
    exportLogsButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: Colors.dark.card,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: Colors.dark.tint,
        alignItems: 'center',
    },
    exportLogsButtonText: {
        color: Colors.dark.tint,
        fontWeight: 'bold',
        fontSize: 12,
    },
});

export default MatchDetailScreen;
