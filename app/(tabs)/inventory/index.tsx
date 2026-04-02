import { View, Text, StyleSheet, FlatList, ScrollView } from "react-native"
import Colors from "../../../constants/Colors"

const INVENTORY_CATEGORIES = [
    { id: '1', title: 'Weapon Skins', count: 42, icon: 'shield' },
    { id: '2', title: 'Gun Buddies', count: 18, icon: 'anchor' },
    { id: '3', title: 'Player Cards', count: 25, icon: 'card' },
    { id: '4', title: 'Sprays', count: 64, icon: 'format-paint' },
    { id: '5', title: 'Player Titles', count: 12, icon: 'format-title' },
];

const CategoryItem = ({ title, count }) => (
    <View style={styles.categoryItem}>
        <View style={styles.categoryContent}>
            <View style={styles.iconBox} />
            <Text style={styles.categoryTitle}>{title}</Text>
        </View>
        <Text style={styles.categoryCount}>{count}</Text>
    </View>
);

const InventoryPage = () => {
    return (
        <ScrollView style={styles.container}>
            <View style={styles.walletCard}>
                <View style={styles.walletItem}>
                    <View style={[styles.currencyIcon, { backgroundColor: Colors.dark.tint }]} />
                    <Text style={styles.walletValue}>2,450 VP</Text>
                </View>
                <View style={styles.walletItem}>
                    <View style={[styles.currencyIcon, { backgroundColor: '#46FF94' }]} />
                    <Text style={styles.walletValue}>185 Radianite</Text>
                </View>
                <View style={styles.walletItem}>
                    <View style={[styles.currencyIcon, { backgroundColor: '#ECE8E1' }]} />
                    <Text style={styles.walletValue}>1,200 KC</Text>
                </View>
            </View>

            <View style={styles.listContainer}>
                {INVENTORY_CATEGORIES.map(category => (
                    <CategoryItem key={category.id} {...category} />
                ))}
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
    walletCard: {
        backgroundColor: Colors.dark.card,
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#2D3945',
    },
    walletItem: {
        alignItems: 'center',
    },
    currencyIcon: {
        width: 15,
        height: 15,
        borderRadius: 2,
        marginBottom: 6,
    },
    walletValue: {
        color: Colors.dark.text,
        fontSize: 12,
        fontWeight: 'bold',
    },
    listContainer: {
        gap: 12,
    },
    categoryItem: {
        backgroundColor: Colors.dark.card,
        padding: 16,
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderLeftWidth: 3,
        borderLeftColor: Colors.dark.accent,
    },
    categoryContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 32,
        height: 32,
        backgroundColor: '#1C2935',
        borderRadius: 6,
        marginRight: 12,
    },
    categoryTitle: {
        color: Colors.dark.text,
        fontSize: 16,
        fontWeight: '600',
    },
    categoryCount: {
        color: Colors.dark.tabIconDefault,
        fontSize: 14,
    }
})

export default InventoryPage