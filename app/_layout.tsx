import { Stack, useRouter, useSegments } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useEffect, useState } from 'react'
import { getTokens } from '../utils/secureStore'
import Colors from '../constants/Colors'
import { ActivityIndicator, View } from 'react-native'

const RootLayout = () => {
    const [isChecking, setIsChecking] = useState(true)
    const segments = useSegments()
    const router = useRouter()

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { accessToken } = await getTokens()
                const inAuthGroup = segments[0] === 'login'

                if (!accessToken && !inAuthGroup) {
                    // Redirect to login if not authenticated and not on login page
                    router.replace('/login')
                } else if (accessToken && inAuthGroup) {
                    // Redirect to tabs if authenticated and on login page
                    router.replace('/(tabs)')
                }
            } catch (e) {
                console.error('Auth check error:', e)
            } finally {
                setIsChecking(false)
            }
        }

        checkAuth()
    }, [segments])

    if (isChecking) {
        return (
            <View style={{ flex: 1, backgroundColor: Colors.dark.background, justifyContent: 'center' }}>
                <ActivityIndicator size="large" color={Colors.dark.tint} />
            </View>
        )
    }

    return (
        <SafeAreaProvider>
            <Stack screenOptions={{
                headerStyle: { backgroundColor: Colors.dark.background },
                headerTintColor: Colors.dark.text,
            }}>
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