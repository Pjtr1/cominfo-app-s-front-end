import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { API_BASE_URL } from "../../../../config/api";

type OrderStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

type PaymentStatus = "paid" | "unpaid";

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
];

export default function SellerOrderStatusPage() {
  const { orderId, order } = useLocalSearchParams();

  const parsedOrder: Order = order ? JSON.parse(order as string) : null;

  const [status, setStatus] = useState<OrderStatus>("pending");
  const [paymentStatus, setPaymentStatus] =
    useState<PaymentStatus>("unpaid");

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const isCancelled = status === "cancelled";
  const isCompleted = status === "completed";

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/orders/${orderId}/status`
        );
        const data = await res.json();
        setStatus(data.status);
        setPaymentStatus(data.payment_status); 
      } catch (err) {
        console.error("Status error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [orderId]);

  const getNextStatus = () => {
    const index = STATUS_STEPS.indexOf(status);
    if (index === -1 || index === STATUS_STEPS.length - 1)
      return null;
    return STATUS_STEPS[index + 1];
  };

  const updateStatus = async () => {
    const nextStatus = getNextStatus();
    if (!nextStatus) return;

    try {
      setUpdating(true);

      const res = await fetch(
        `${API_BASE_URL}/orders/${orderId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        }
      );

      if (!res.ok) throw new Error("Update failed");

      setStatus(nextStatus);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to update status.");
    } finally {
      setUpdating(false);
    }
  };

  const cancelOrder = async () => {
    try {
      setCancelling(true);

      const res = await fetch(
        `${API_BASE_URL}/orders/${orderId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "cancelled" }),
        }
      );

      if (!res.ok) throw new Error("Cancel failed");

      setStatus("cancelled");
      Alert.alert("Cancelled", "Order has been cancelled.");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to cancel order.");
    } finally {
      setCancelling(false);
    }
  };

  const getStepIndex = () => STATUS_STEPS.indexOf(status);

  const renderStep = (step: OrderStatus, index: number) => {
    const currentIndex = getStepIndex();

    const isDone =
      status === "completed" ? true : index < currentIndex;

    const isCurrent =
      status !== "completed" && index === currentIndex;

    return (
      <View key={step} style={styles.stepContainer}>
        <View style={styles.left}>
          <View
            style={[
              styles.circle,
              isDone && styles.completedCircle,
              isCurrent && styles.currentCircle,
              isCancelled && styles.disabledCircle,
            ]}
          >
            {isDone && !isCancelled && (
              <Text style={styles.check}>✓</Text>
            )}
          </View>

          {index !== STATUS_STEPS.length - 1 && (
            <View
              style={[
                styles.line,
                (isDone || index < currentIndex) &&
                  styles.completedLine,
                isCancelled && styles.disabledLine,
              ]}
            />
          )}
        </View>

        <View style={styles.right}>
          <Text
            style={[
              styles.stepTitle,
              isCancelled && styles.disabledText,
            ]}
          >
            {step.toUpperCase()}
          </Text>

          {isCurrent && !isCancelled && (
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
    <FlatList
      data={parsedOrder?.order_items || []}
      keyExtractor={(item) => item.menu_item_id.toString()}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}

      ListHeaderComponent={
        <>
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.orderId}>
                  Order #{orderId}
                </Text>

                <Text
                  style={[
                    styles.statusText,
                    isCancelled && styles.cancelledText,
                  ]}
                >
                  Status: {status}
                </Text>
              </View>

              {/* PAYMENT STATUS */}
              <Text
                style={[
                  styles.paymentStatus,
                  paymentStatus === "paid"
                    ? styles.paid
                    : styles.unpaid,
                ]}
              >
                {paymentStatus.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.timeline}>
            {STATUS_STEPS.map(renderStep)}
          </View>

          <Text style={styles.sectionTitle}>Items</Text>
        </>
      }

      renderItem={({ item }) => (
        <View style={styles.itemRow}>
          <Text>
            {item.name || "Item"} x{item.quantity}
          </Text>
          <Text>฿{item.price.toFixed(2)}</Text>
        </View>
      )}

      ListFooterComponent={
        <>
          <Text style={styles.total}>
            Total: ฿{parsedOrder?.total_price.toFixed(2)}
          </Text>

          {!isCompleted && !isCancelled && getNextStatus() && (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={updateStatus}
              disabled={updating}
            >
              <Text style={styles.primaryText}>
                {updating
                  ? "Updating..."
                  : `Mark as ${getNextStatus()?.toUpperCase()}`}
              </Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 12 }} />

          {!isCompleted && !isCancelled && (
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={cancelOrder}
              disabled={cancelling}
            >
              <Text style={styles.cancelText}>
                {cancelling ? "Cancelling..." : "Cancel Order"}
              </Text>
            </TouchableOpacity>
          )}
        </>
      }
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    padding: 20,
    backgroundColor: "#FFF3E8",
    borderRadius: 12,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  orderId: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FF6B00",
  },

  statusText: { marginTop: 4 },

  cancelledText: {
    color: "red",
    fontWeight: "bold",
  },

  paymentStatus: { fontWeight: "bold" },
  paid: { color: "green" },
  unpaid: { color: "red" },

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

  disabledCircle: {
    borderColor: "#ccc",
    backgroundColor: "#eee",
  },

  check: { color: "#fff", fontSize: 12 },

  line: { width: 2, height: 40, backgroundColor: "#ccc" },
  completedLine: { backgroundColor: "#FF6B00" },
  disabledLine: { backgroundColor: "#ddd" },

  stepTitle: { fontWeight: "600" },
  disabledText: { color: "#aaa" },
  activeText: { color: "#FF6B00", fontSize: 12 },

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

  total: { marginTop: 10, fontWeight: "bold" },

  primaryBtn: {
    marginTop: 10,
    backgroundColor: "#FF6B00",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  primaryText: { color: "#fff", fontWeight: "bold" },

  cancelBtn: {
    backgroundColor: "red",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  cancelText: { color: "#fff", fontWeight: "bold" },
});