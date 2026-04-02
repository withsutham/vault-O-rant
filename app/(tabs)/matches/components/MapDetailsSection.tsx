import React, { useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Colors from '../../../../constants/Colors';

interface MapDetailsSectionProps {
    mapId: string;
    mapName: string;
    mapImage?: string;
}

export const MapDetailsSection: React.FC<MapDetailsSectionProps> = ({ mapId, mapName, mapImage }) => {
    const [imageError, setImageError] = useState(false);

    console.log('MapDetailsSection - mapImage prop:', mapImage);

    return (
        <View style={styles.mapSection}>
            <Text style={styles.sectionTitle}>Map</Text>
            {mapImage && !imageError && (
                <Image 
                    source={{ uri: mapImage }}
                    style={styles.mapImage}
                    onError={() => {
                        console.log('Failed to load map image from:', mapImage);
                        setImageError(true);
                    }}
                />
            )}
            {!mapImage || imageError && (
                <View style={styles.mapImagePlaceholder}>
                    <Text style={styles.placeholderText}>Map image unavailable</Text>
                </View>
            )}
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
    mapImagePlaceholder: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 12,
        backgroundColor: Colors.dark.card,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: Colors.dark.tabIconDefault,
        fontSize: 14,
    },
    mapName: {
        color: Colors.dark.text,
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
