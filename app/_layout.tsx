import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" 
        options={{ headerTitle: "Log in" }}
      />
      <Stack.Screen name="signup" 
        options={{ headerTitle: "Sign Up" }}
      />
      <Stack.Screen name="homeplaceholder" />
    </Stack>
  );
    
}
