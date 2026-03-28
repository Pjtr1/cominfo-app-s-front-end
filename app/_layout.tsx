import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>

      <Stack.Screen name="index" 
        options={{ 
          headerTitle: "Log in" ,
          headerShown: false // hide header on login screen
        }}
      />

      <Stack.Screen name="signup" 
        options={{ 
          headerTitle: "Sign Up" ,
          headerShown: false // hide header on login screen
          
        }}
      />

      <Stack.Screen name="homeplaceholder" />

      <Stack.Screen name="(tabs)" 
        options={{ 
          headerTitle: "(tabs)" ,
          headerShown: false // hide header on login screen
          
        }}
      />
      
    </Stack>
  );
    
}
