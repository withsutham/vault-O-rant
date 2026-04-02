import { View, Text, StyleSheet, Image } from "react-native"
import Colors from "../../constants/Colors"

const ProfilePage = () => {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>J</Text>
                </View>
                <View style={styles.info}>
                    <Text style={styles.playerName}>JETT#MAIN</Text>
                    <Text style={styles.playerLevel}>Level 125</Text>
                </View>
            </View>
            
            <View style={styles.rankCard}>
                <Text style={styles.sectionTitle}>Current Rank</Text>
                <View style={styles.rankInfo}>
                    <View style={styles.rankIconPlaceholder} />
                    <Text style={styles.rankText}>Diamond 2</Text>
                </View>
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>1.25</Text>
                    <Text style={styles.statLabel}>K/D Ratio</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>54%</Text>
                    <Text style={styles.statLabel}>Win Rate</Text>
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
    },
    avatarPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.dark.tint,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.dark.text,
    },
    avatarText: {
        color: Colors.dark.text,
        fontSize: 32,
        fontWeight: 'bold',
    },
    info: {
        marginLeft: 20,
    },
    playerName: {
        color: Colors.dark.text,
        fontSize: 24,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    playerLevel: {
        color: Colors.dark.accent,
        fontSize: 16,
    },
    rankCard: {
        backgroundColor: Colors.dark.card,
        padding: 20,
        borderRadius: 10,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: Colors.dark.tint,
    },
    sectionTitle: {
        color: Colors.dark.tabIconDefault,
        fontSize: 14,
        textTransform: 'uppercase',
        marginBottom: 10,
        letterSpacing: 1,
    },
    rankInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rankIconPlaceholder: {
        width: 50,
        height: 50,
        backgroundColor: '#383E45',
        borderRadius: 25,
        marginRight: 15,
    },
    rankText: {
        color: Colors.dark.text,
        fontSize: 20,
        fontWeight: 'bold',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statBox: {
        backgroundColor: Colors.dark.card,
        flex: 1,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    statValue: {
        color: Colors.dark.tint,
        fontSize: 24,
        fontWeight: 'bold',
    },
    statLabel: {
        color: Colors.dark.text,
        fontSize: 12,
        marginTop: 5,
    }
})

export default ProfilePage