import { Stack } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import Colors from '../constants/Colors'

const RootLayout = () => {
    return (
        <SafeAreaProvider>
            <Stack screenOptions={{
                headerStyle: { backgroundColor: Colors.dark.background },
                headerTintColor: Colors.dark.text,
            }}>
                <Stack.Screen
                    name="index"
                    options={{
                        headerShown: false
                    }}
                />
                <Stack.Screen
                    name="(tabs)"
                    options={{
                        headerShown: false
                    }}
                />
                <Stack.Screen
                    name="login"
                    options={{
                        headerTitle: "Riot Sign In",
                        presentation: 'modal',
                        headerShown: true
                    }}
                />
            </Stack>
        </SafeAreaProvider>
    )
}

export default RootLayout