// Orders.tsx
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useUser } from "../../../../contexts/UserContext"; // adjust path if needed

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

export default function Orders() {
  const { user } = useUser();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchOrders = async () => {
      try {
        const response = await fetch(`https://erratically-thermogenetic-landon.ngrok-free.dev/users/${user.id}/orders`);
        const data = await response.json();
        setOrders(data);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const renderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: "/customer/orders/status", // static route
          params: { 
            orderId: item.id.toString(), 
            order: JSON.stringify(item) 
          },
        })
      }
    >
      <Text style={styles.orderTitle}>Order #{item.id}</Text>
      <Text style={styles.restaurantName}>{item.restaurant_name}</Text>
      <View style={styles.itemsContainer}>
        {item.order_items.map((oi) => (
          <Text key={oi.menu_item_id} style={styles.itemText}>
            {oi.name || "Item"} x{oi.quantity}
          </Text>
        ))}
      </View>
      <Text style={styles.totalPrice}>Total: ${item.total_price.toFixed(2)}</Text>
      <Text style={styles.status}>Status: {item.status}</Text>
      <Text style={styles.date}>{new Date(item.created_at).toLocaleString()}</Text>
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
        <Text style={{ textAlign: "center", marginTop: 50 }}>No orders found.</Text>
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
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
});