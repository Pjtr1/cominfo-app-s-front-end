import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";

type OrderStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

interface OrderItem {
  menu_item_id: number;
  quantity: number;
  price: number;
  name?: string;
}

interface Order {
  id: number;
  restaurant_id: number;
  restaurant_name: string;
  total_price: number;
  order_items: OrderItem[];
}

const STATUS_STEPS: OrderStatus[] = [
  "pending",
  "preparing",
  "ready",
  "completed",
  "cancelled",
];

export default function OrderStatusPage() {
  const { orderId, order } = useLocalSearchParams();

  const parsedOrder: Order = order ? JSON.parse(order as string) : null;

  const [status, setStatus] = useState<OrderStatus>("pending");
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [qrLoading, setQrLoading] = useState(true);

  // 🔹 Fetch order status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(
          `https://cominfo-api-server.onrender.com/orders/${orderId}/status`
        );
        const data = await res.json();
        setStatus(data.status);
      } catch (err) {
        console.error("Status error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [orderId]);

  // 🔹 Fetch QR
  useEffect(() => {
    if (!parsedOrder?.restaurant_id) return;

    const fetchQR = async () => {
      try {
        const res = await fetch(
          `https://erratically-thermogenetic-landon.ngrok-free.dev/${parsedOrder.restaurant_id}/payment_qr`
        );
        const data = await res.json();
        setQrUrl(data.payment_qr_url);
      } catch (err) {
        console.error("QR error:", err);
      } finally {
        setQrLoading(false);
      }
    };

    fetchQR();
  }, [parsedOrder]);

  // 🔹 Download QR
  const downloadQR = async () => {
    if (!qrUrl) return;

    try {
      const permission = await MediaLibrary.requestPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permission needed", "Allow access to save image.");
        return;
      }

      const fileUri = FileSystem.cacheDirectory + `qr_${orderId}.jpg`;

      const downloaded = await FileSystem.downloadAsync(qrUrl, fileUri);

      await MediaLibrary.saveToLibraryAsync(downloaded.uri);

      Alert.alert("Success", "QR code saved to gallery!");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to download QR.");
    }
  };

  const getStepIndex = () => STATUS_STEPS.indexOf(status);

  const renderStep = (step: OrderStatus, index: number) => {
    const currentIndex = getStepIndex();

    const isCompleted = index < currentIndex;
    const isCurrent = index === currentIndex;

    return (
      <View key={step} style={styles.stepContainer}>
        <View style={styles.left}>
          <View
            style={[
              styles.circle,
              isCompleted && styles.completedCircle,
              isCurrent && styles.currentCircle,
            ]}
          >
            {isCompleted && <Text style={styles.check}>✓</Text>}
          </View>

          {index !== STATUS_STEPS.length - 1 && (
            <View
              style={[
                styles.line,
                index < currentIndex && styles.completedLine,
              ]}
            />
          )}
        </View>

        <View style={styles.right}>
          <Text style={styles.stepTitle}>{step.toUpperCase()}</Text>
          {isCurrent && (
            <Text style={styles.activeText}>In progress</Text>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6B00" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.orderId}>Order #{orderId}</Text>
        <Text>Status: {status}</Text>
      </View>

      {/* TIMELINE */}
      <View style={styles.timeline}>
        {STATUS_STEPS.map(renderStep)}
      </View>

      {/* QR SECTION */}
      <View style={styles.qrSection}>
        <Text style={styles.sectionTitle}>Payment QR</Text>

        {qrLoading ? (
          <ActivityIndicator />
        ) : qrUrl ? (
          <>
            <Image source={{ uri: qrUrl }} style={styles.qrImage} />

            {/* 🔥 DOWNLOAD BUTTON */}
            <TouchableOpacity
              style={styles.downloadBtn}
              onPress={downloadQR}
            >
              <Text style={styles.downloadText}>Download QR</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={{ color: "#888" }}>QR not available</Text>
        )}
      </View>

      {/* ITEMS */}
      <View style={styles.itemsSection}>
        <Text style={styles.sectionTitle}>Items</Text>

        <FlatList
          data={parsedOrder?.order_items}
          keyExtractor={(item) => item.menu_item_id.toString()}
          renderItem={({ item }) => (
            <View style={styles.itemRow}>
              <Text>
                {item.name || "Item"} x{item.quantity}
              </Text>
              <Text>${item.price.toFixed(2)}</Text>
            </View>
          )}
        />

        <Text style={styles.total}>
          Total: ${parsedOrder?.total_price.toFixed(2)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    padding: 20,
    backgroundColor: "#FFF3E8",
    borderRadius: 12,
  },

  orderId: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FF6B00",
  },

  timeline: { marginVertical: 20 },

  stepContainer: { flexDirection: "row" },

  left: { alignItems: "center", width: 40 },

  right: { flex: 1, paddingBottom: 20 },

  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
  },

  completedCircle: {
    backgroundColor: "#FF6B00",
    borderColor: "#FF6B00",
  },

  currentCircle: {
    borderColor: "#FF6B00",
  },

  check: { color: "#fff", fontSize: 12 },

  line: {
    width: 2,
    height: 40,
    backgroundColor: "#ccc",
  },

  completedLine: {
    backgroundColor: "#FF6B00",
  },

  stepTitle: { fontWeight: "600" },

  activeText: { color: "#FF6B00", fontSize: 12 },

  qrSection: {
    alignItems: "center",
    marginTop: 10,
  },

  qrImage: {
    width: 180,
    height: 180,
    marginVertical: 10,
    borderRadius: 12,
  },

  downloadBtn: {
    backgroundColor: "#FF6B00",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },

  downloadText: {
    color: "#fff",
    fontWeight: "bold",
  },

  itemsSection: { marginTop: 20 },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },

  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },

  total: {
    marginTop: 10,
    fontWeight: "bold",
  },
});