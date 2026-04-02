import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../../../../constants/Colors';
import { formatMatchDate, getQueueName } from '../../../../api/valorantService';

interface MatchHeaderSectionProps {
    mapName: string;
    queueID: number | string;
    gameStartTime: number;
}

export const MatchHeaderSection: React.FC<MatchHeaderSectionProps> = ({ 
    mapName, 
    queueID, 
    gameStartTime 
}) => {
    return (
        <View style={styles.headerSection}>
            <Text style={styles.headerTitle}>{mapName}</Text>
            <Text style={styles.headerSubtitle}>
                {getQueueName(String(queueID))} • {formatMatchDate(gameStartTime)}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    headerSection: {
        backgroundColor: Colors.dark.card,
        padding: 20,
        borderBottomWidth: 2,
        borderBottomColor: Colors.dark.tint,
    },
    headerTitle: {
        color: Colors.dark.text,
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    headerSubtitle: {
        color: Colors.dark.tabIconDefault,
        fontSize: 14,
    },
});
