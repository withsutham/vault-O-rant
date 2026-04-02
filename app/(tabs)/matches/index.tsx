import { View, Text, StyleSheet, FlatList } from "react-native"
import Colors from "../../../constants/Colors"

const MATCH_DATA = [
    { id: '1', agent: 'Jett', result: 'Victory', score: '13-5', map: 'Ascent', date: '2 hours ago' },
    { id: '2', agent: 'Omen', result: 'Defeat', score: '8-13', map: 'Bind', date: '5 hours ago' },
    { id: '3', agent: 'Sova', result: 'Victory', score: '13-11', map: 'Haven', date: 'Yesterday' },
    { id: '4', agent: 'Sage', result: 'Victory', score: '13-2', map: 'Split', date: 'Yesterday' },
    { id: '5', agent: 'Reyna', result: 'Defeat', score: '11-13', map: 'Icebox', date: '2 days ago' },
];

const MatchItem = ({ agent, result, score, map, date }) => (
    <View style={[styles.matchItem, result === 'Victory' ? styles.victoryBorder : styles.defeatBorder]}>
        <View style={styles.matchMainInfo}>
            <View style={styles.agentPlaceholder} />
            <View>
                <Text style={styles.agentName}>{agent}</Text>
                <Text style={styles.mapName}>{map}</Text>
            </View>
        </View>
        <View style={styles.matchStats}>
            <Text style={[styles.resultText, result === 'Victory' ? styles.victoryText : styles.defeatText]}>
                {result}
            </Text>
            <Text style={styles.scoreText}>{score}</Text>
            <Text style={styles.dateText}>{date}</Text>
        </View>
    </View>
);

const MatchesPage = () => {
    return (
        <View style={styles.container}>
            <FlatList
                data={MATCH_DATA}
                renderItem={({ item }) => <MatchItem {...item} />}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContainer}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    listContainer: {
        padding: 16,
    },
    matchItem: {
        backgroundColor: Colors.dark.card,
        padding: 16,
        marginBottom: 12,
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderLeftWidth: 4,
    },
    victoryBorder: {
        borderLeftColor: '#46FF94',
    },
    defeatBorder: {
        borderLeftColor: '#FF4655',
    },
    matchMainInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    agentPlaceholder: {
        width: 45,
        height: 45,
        backgroundColor: '#383E45',
        borderRadius: 22.5,
        marginRight: 12,
    },
    agentName: {
        color: Colors.dark.text,
        fontSize: 16,
        fontWeight: 'bold',
    },
    mapName: {
        color: Colors.dark.tabIconDefault,
        fontSize: 12,
    },
    matchStats: {
        alignItems: 'flex-end',
    },
    resultText: {
        fontSize: 14,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    victoryText: {
        color: '#46FF94',
    },
    defeatText: {
        color: '#FF4655',
    },
    scoreText: {
        color: Colors.dark.text,
        fontSize: 14,
        marginVertical: 2,
    },
    dateText: {
        color: Colors.dark.tabIconDefault,
        fontSize: 10,
    }
})

export default MatchesPage