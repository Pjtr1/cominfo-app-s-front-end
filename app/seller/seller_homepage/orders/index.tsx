import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { API_BASE_URL } from "../../../../config/api";
import { useUser } from "../../../../contexts/UserContext";

interface OrderItem {
  menu_item_id: number;
  quantity: number;
  price: number;
  name?: string;
}

interface Order {
  id: number;
  customer_id: number;
  restaurant_id: number;
  restaurant_name: string;
  total_price: number;
  status: string;
  created_at: string;
  order_items: OrderItem[];
}

interface Restaurant {
  id: number;
  name: string;
  image_url: string;
  canteen_id: number;
  owner_id: number;
  latitude: number;
  longitude: number;
  is_open: boolean;
  utilization: number;
  payment_qr_url: string;
}

export default function RestaurantOrders() {
  const { user } = useUser();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    if (!user) return;

    setLoading(true);

    try {
      // Get restaurant(s) owned by user
      const resRestaurant = await fetch(
        `${API_BASE_URL}/users/${user.id}/restaurants`
      );
      const restaurants: Restaurant[] = await resRestaurant.json();

      if (!restaurants || restaurants.length === 0) {
        setOrders([]);
        return;
      }

      // Take first restaurant
      const restaurantId = restaurants[0].id;

      // Fetch orders for that restaurant
      const resOrders = await fetch(
        `${API_BASE_URL}/restaurants/${restaurantId}/orders`
      );
      const data = await resOrders.json();

      setOrders(data);
    } catch (error) {
      console.error("Error fetching restaurant orders:", error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh every time screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [user])
  );

  const renderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: "/seller/seller_homepage/orders/status", 
          params: {
            orderId: item.id.toString(),
            order: JSON.stringify(item),
          },
        })
      }
    >
      <Text style={styles.orderTitle}>Order #{item.id}</Text>

      <Text style={styles.restaurantName}>
        Customer ID: {item.customer_id}
      </Text>

      <View style={styles.itemsContainer}>
        {item.order_items.map((oi) => (
          <Text key={oi.menu_item_id} style={styles.itemText}>
            {oi.name || "Item"} x{oi.quantity}
          </Text>
        ))}
      </View>

      <Text style={styles.totalPrice}>
        Total: ฿{item.total_price.toFixed(2)}
      </Text>
      <Text style={styles.status}>Status: {item.status}</Text>
      <Text style={styles.date}>
        {new Date(item.created_at).toLocaleString()}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderItem}
      contentContainerStyle={{ padding: 16 }}
      ListEmptyComponent={
        <Text style={{ textAlign: "center", marginTop: 50 }}>
          No orders found.
        </Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  orderTitle: { fontSize: 18, fontWeight: "bold" },
  restaurantName: { fontSize: 16, color: "#555", marginBottom: 8 },
  itemsContainer: { marginLeft: 8, marginBottom: 8 },
  itemText: { fontSize: 14, color: "#333" },
  totalPrice: { fontSize: 16, fontWeight: "500" },
  status: { fontSize: 14, color: "#f57c00" },
  date: { fontSize: 12, color: "#888", marginTop: 4 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});