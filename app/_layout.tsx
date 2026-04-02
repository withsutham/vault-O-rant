// app/_layout.tsx
import { Stack } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'

const RootLayout = () => {
    return (
        <SafeAreaProvider>
            <Stack>
                <Stack.Screen
                    name="(tabs)"
                    options={{
                        headerShown: false
                    }}
                />
            </Stack>
        </SafeAreaProvider>
    )
}

export default RootLayout