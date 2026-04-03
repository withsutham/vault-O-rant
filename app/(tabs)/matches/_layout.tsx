import { Stack } from "expo-router";
import Colors from "../../../constants/Colors";

const StackLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerLargeTitle: false,
        headerStyle: {
          backgroundColor: Colors.dark.background,
        },
        headerTintColor: Colors.dark.text,
        headerTitleStyle: {
          color: Colors.dark.text,
          fontSize: 20,
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerTitle: "MATCHES",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="[matchId]"
        options={{
          headerTitle: "MATCH DETAILS",
          headerShown: true,
        }}
      />
    </Stack>
  );
};

export default StackLayout;
