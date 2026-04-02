import { View, Text, StyleSheet, FlatList, Image, ScrollView } from "react-native"
import Colors from "../../../constants/Colors"

const DAILY_OFFERS = [
    { id: '1', name: 'Prime Vandal', price: '1,775 VP', image: null },
    { id: '2', name: 'Elderflame Dagger', price: '4,950 VP', image: null },
    { id: '3', name: 'Reaver Sheriff', price: '1,775 VP', image: null },
    { id: '4', name: 'Glitchpop Frenzy', price: '2,175 VP', image: null },
];

const StoreItem = ({ name, price }) => (
    <View style={styles.storeItem}>
        <View style={styles.skinPlaceholder} />
        <View style={styles.skinInfo}>
            <Text style={styles.skinName}>{name}</Text>
            <View style={styles.priceContainer}>
                <View style={styles.vpIcon} />
                <Text style={styles.priceText}>{price}</Text>
            </View>
        </View>
    </View>
);

const StorePage = () => {
    return (
        <ScrollView style={styles.container}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Daily Offers</Text>
                <Text style={styles.timer}>Ends in 12:45:00</Text>
            </View>

            <View style={styles.grid}>
                {DAILY_OFFERS.map(item => (
                    <StoreItem key={item.id} {...item} />
                ))}
            </View>

            <View style={[styles.sectionHeader, { marginTop: 30 }]}>
                <Text style={styles.sectionTitle}>Night Market</Text>
            </View>
            <View style={styles.nightMarketCard}>
                <Text style={styles.nightMarketText}>Available Now!</Text>
                <Text style={styles.nightMarketSubtext}>Click to reveal your personal discounts</Text>
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
        padding: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        color: Colors.dark.text,
        fontSize: 18,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    timer: {
        color: Colors.dark.accent,
        fontSize: 12,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    storeItem: {
        backgroundColor: Colors.dark.card,
        width: '48%',
        marginBottom: 15,
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#2D3945',
    },
    skinPlaceholder: {
        height: 100,
        backgroundColor: '#1C2935',
    },
    skinInfo: {
        padding: 12,
    },
    skinName: {
        color: Colors.dark.text,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    vpIcon: {
        width: 12,
        height: 12,
        backgroundColor: Colors.dark.tint,
        marginRight: 6,
        borderRadius: 2,
    },
    priceText: {
        color: Colors.dark.tabIconDefault,
        fontSize: 12,
    },
    nightMarketCard: {
        backgroundColor: '#2D3945',
        height: 150,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#BD9C5A', // Gold-ish color for night market
        borderStyle: 'dashed',
    },
    nightMarketText: {
        color: '#BD9C5A',
        fontSize: 24,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    nightMarketSubtext: {
        color: Colors.dark.tabIconDefault,
        fontSize: 12,
        marginTop: 8,
    }
})

export default StorePage