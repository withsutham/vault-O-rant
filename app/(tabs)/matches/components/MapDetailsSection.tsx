import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Colors from '../../../../constants/Colors';
import { getMapImageUrl } from '../../../../api/valorantService';

interface MapDetailsSectionProps {
    mapId: string;
    mapName: string;
}

export const MapDetailsSection: React.FC<MapDetailsSectionProps> = ({ mapId, mapName }) => {
    return (
        <View style={styles.mapSection}>
            <Text style={styles.sectionTitle}>Map</Text>
            <Image 
                source={{ uri: getMapImageUrl(mapId) }}
                style={styles.mapImage}
            />
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
    mapImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 12,
    },
    mapName: {
        color: Colors.dark.text,
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
