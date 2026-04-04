import { Stack } from "expo-router";
import React from "react";

export default function OrdersStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#fff" },
        headerTintColor: "#000",
        contentStyle: { backgroundColor: "#f8f8f8" },
      }}
    >
      {/* Orders list page */}
      <Stack.Screen
        name="index"
        options={{ title: "My Orders" }}
      />

      {/* Status page */}
      <Stack.Screen
        name="status"
        options={{ title: "Order Status" }}
      />
    </Stack>
  );
}