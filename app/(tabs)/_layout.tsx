// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router'
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons'
import Colors from '../../constants/Colors'

const TabsLayout = () => {
    return (
        <Tabs screenOptions={{ 
            tabBarActiveTintColor: Colors.dark.tint,
            tabBarInactiveTintColor: Colors.dark.tabIconDefault,
            tabBarStyle: {
                backgroundColor: Colors.dark.background,
                borderTopColor: Colors.dark.card,
            },
            headerStyle: {
                backgroundColor: Colors.dark.background,
            },
            headerTitleStyle: {
                color: Colors.dark.text,
                fontWeight: 'bold',
                textTransform: 'uppercase',
            }
        }}>
            <Tabs.Screen
                name="profile"
                options={{
                    headerTitle: "Player Profile",
                    title: "Profile",
                    tabBarIcon: ({ color }) => <MaterialIcons size={28} name="person" color={color} />,
                }}
            />
            <Tabs.Screen
                name="matches/index"
                options={{
                    headerShown: false,
                    headerTitle: "Match History",
                    title: "Matches",
                    tabBarIcon: ({ color }) => <MaterialCommunityIcons size={28} name="history" color={color} />,
                }}
            />
            <Tabs.Screen
                name="store/index"
                options={{
                    headerTitle: "Valorant Store",
                    title: "Store",
                    tabBarIcon: ({ color }) => <MaterialIcons size={28} name="shopping-cart" color={color} />,
                }} />
            <Tabs.Screen
                name="inventory/index"
                options={{
                    headerTitle: "Inventory",
                    title: "Inventory",
                    tabBarIcon: ({ color }) => <MaterialCommunityIcons size={28} name="briefcase-variant" color={color} />,
                }} />
        </Tabs>
    )
}

export default TabsLayout
