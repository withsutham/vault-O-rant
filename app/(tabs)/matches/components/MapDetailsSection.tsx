import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../../../../constants/Colors';

interface MapDetailsSectionProps {
    mapId: string;
    mapName: string;
}

export const MapDetailsSection: React.FC<MapDetailsSectionProps> = ({ mapName }) => {
    return (
        <View style={styles.mapSection}>
            <Text style={styles.sectionTitle}>Map</Text>
            <Text style={styles.mapName}>{mapName}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    mapSection: {
        padding: 16,
        paddingBottom: 32,
    },
    sectionTitle: {
        color: Colors.dark.text,
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    mapName: {
        color: Colors.dark.text,
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
