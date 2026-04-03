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
          fontSize: 16,
          fontWeight: "600",
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerTitle: "Match History",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[matchId]"
        options={{
          headerTitle: "",
          headerShown: false,
        }}
      />
    </Stack>
  );
};

export default StackLayout;
