import { Tabs } from 'expo-router';

// This layout defines the bottom tab navigator for the app. Each child
// screen file in this folder (home, settings.tsx, userprofile.tsx)
// will be rendered in one of the tabs.

export default function TabLayout() {
  return (
    <Tabs
     screenOptions={{
        headerShown: false, // hide stack headers inside tabs
      }}>
      <Tabs.Screen
        name="home" 
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
        }}
      />
      <Tabs.Screen
        name="userprofile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}
