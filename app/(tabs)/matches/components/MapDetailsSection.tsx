import React, { useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Colors from '../../../../constants/Colors';
import { getMapImageUrl } from '../../../../api/valorantService';

interface MapDetailsSectionProps {
    mapId: string;
    mapName: string;
}

export const MapDetailsSection: React.FC<MapDetailsSectionProps> = ({ mapId, mapName }) => {
    const [imageError, setImageError] = useState(false);
    const mapImageUrl = getMapImageUrl(mapId);

    console.log('Map ID:', mapId);
    console.log('Map Image URL:', mapImageUrl);

    return (
        <View style={styles.mapSection}>
            <Text style={styles.sectionTitle}>Map</Text>
            {!imageError && (
                <Image 
                    source={{ uri: mapImageUrl }}
                    style={styles.mapImage}
                    onError={() => {
                        console.log('Failed to load map image from:', mapImageUrl);
                        setImageError(true);
                    }}
                />
            )}
            {imageError && (
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
