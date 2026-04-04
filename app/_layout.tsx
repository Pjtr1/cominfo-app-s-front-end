import { Stack } from "expo-router";
import { UserProvider } from "../contexts/UserContext";

export default function RootLayout() {
  return (
    <UserProvider>
      <Stack
        screenOptions={{
          headerShown: false, // hide all headers by default
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerTitle: "Log in",
            headerShown: false, // explicit per screen, optional here
          }}
        />

        <Stack.Screen
          name="signup"
          options={{
            headerTitle: "Sign Up",
            headerShown: false, // hide header
          }}
        />

        <Stack.Screen name="homeplaceholder" />
      </Stack>
    </UserProvider>
  );
}