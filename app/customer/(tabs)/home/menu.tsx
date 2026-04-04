import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUser } from "../../../../contexts/UserContext"; // make sure the path is correct

type MenuItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  is_available: boolean;
  image_url: string | null;
};

type MenuCategory = {
  id: number;
  name: string;
  menu_items: MenuItem[];
};

type ListItem =
  | { type: "header" }
  | { type: "tabs" }
  | { type: "category"; category: MenuCategory }
  | { type: "item"; item: MenuItem };

type CartItem = {
  menu_item_id: number;
  name: string;
  price: number;
  quantity: number;
};

export default function MenuPage() {
  const { restaurantId, restaurantName, restaurantImage } =
    useLocalSearchParams();
  const { user } = useUser();

  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeOrderCount, setActiveOrderCount] = useState<number>(0);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartVisible, setCartVisible] = useState(false);

  const listRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();
  const categoryIndexMap = useRef<{ [key: number]: number }>({});

  useEffect(() => {
    if (restaurantId) fetchMenu();
  }, [restaurantId]);

  const fetchMenu = async () => {
    try {
      const res = await fetch(
        `https://erratically-thermogenetic-landon.ngrok-free.dev/restaurants/${restaurantId}/menu`
      );
      const data = await res.json();
      setMenu(data);

      const countRes = await fetch(
        `https://erratically-thermogenetic-landon.ngrok-free.dev/restaurants/${restaurantId}/orders/active-count`
      );
      const countData = await countRes.json();
      setActiveOrderCount(countData.active_order_count);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Cart handlers
  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.menu_item_id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.menu_item_id === item.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { menu_item_id: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const removeFromCart = (item: MenuItem) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.menu_item_id === item.id
            ? { ...i, quantity: i.quantity - 1 }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const getQuantity = (id: number) => {
    const item = cart.find((i) => i.menu_item_id === id);
    return item ? item.quantity : 0;
  };

  // 🔹 Place order
  const placeOrder = async () => {
    if (!user) return alert("You must be logged in to place an order.");
    if (cart.length === 0) return alert("Your cart is empty!");

    const body = {
      customer_id: user.id,
      restaurant_id: Number(restaurantId),
      items: cart.map((i) => ({
        menu_item_id: i.menu_item_id,
        quantity: i.quantity
      }))
    };

    try {
      const res = await fetch("https://erratically-thermogenetic-landon.ngrok-free.dev/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        alert("Order placed successfully!");
        setCart([]);
        setCartVisible(false);
      } else {
        const data = await res.json();
        alert("Failed to place order: " + JSON.stringify(data));
      }
    } catch (err) {
      console.log(err);
      alert("Error placing order.");
    }
  };

  // 🔹 Flatten data
  const listData: ListItem[] = [];
  listData.push({ type: "header" });
  listData.push({ type: "tabs" });

  menu.forEach((cat) => {
    categoryIndexMap.current[cat.id] = listData.length;
    listData.push({ type: "category", category: cat });
    cat.menu_items.forEach((item) => {
      listData.push({ type: "item", item });
    });
  });

  // 🔹 Render
  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.type === "header") {
      return (
        <View style={styles.headerWrapper}>
          <View style={styles.headerCard}>
            {restaurantImage && (
              <Image
                source={{ uri: restaurantImage as string }}
                style={styles.headerImage}
              />
            )}
            <Text style={styles.restaurantName}>{restaurantName}</Text>
            <Text style={styles.queueText}>
              {activeOrderCount > 1
                ? `${activeOrderCount} orders in queue`
                : activeOrderCount === 1
                ? "1 order in queue"
                : "No active orders"}
            </Text>
          </View>
        </View>
      );
    }

    if (item.type === "tabs") {
      return (
        <View style={[styles.tabsContainer, { paddingTop: insets.top }]}>
          <FlatList
            data={menu}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(i) => i.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.tab}
                onPress={() => {
                  const index = categoryIndexMap.current[item.id];
                  if (index !== undefined) {
                    listRef.current?.scrollToIndex({
                      index,
                      animated: true,
                      viewPosition: 0
                    });
                  }
                }}
              >
                <Text style={styles.tabText}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      );
    }

    if (item.type === "category") {
      return <Text style={styles.categoryTitle}>{item.category.name}</Text>;
    }

    if (item.type === "item") {
      const i = item.item;
      const quantity = getQuantity(i.id);
      return (
        <View style={styles.menuItem}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.itemName}>
              {i.name} {!i.is_available && "(Unavailable)"}
            </Text>
            <Text style={styles.itemDescription} numberOfLines={2}>
              {i.description}
            </Text>
            <Text style={styles.itemPrice}>฿{i.price.toFixed(2)}</Text>
          </View>
          {i.image_url && (
            <Image source={{ uri: i.image_url }} style={styles.itemImage} />
          )}
          <View style={{ marginLeft: 10, alignItems: "center" }}>
            {quantity === 0 ? (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => addToCart(i)}
              >
                <Text style={{ color: "#fff" }}>+ Add</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => removeFromCart(i)}
                >
                  <Text>-</Text>
                </TouchableOpacity>
                <Text style={{ marginHorizontal: 8 }}>{quantity}</Text>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => addToCart(i)}
                >
                  <Text>+</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      );
    }

    return null;
  };

  const getItemLayout = (_: any, index: number) => {
    const item = listData[index];
    let length = 0;
    if (item.type === "header") length = 200;
    else if (item.type === "tabs") length = 60;
    else if (item.type === "category") length = 40;
    else length = 100;

    let offset = 0;
    for (let i = 0; i < index; i++) {
      const it = listData[i];
      if (it.type === "header") offset += 200;
      else if (it.type === "tabs") offset += 60;
      else if (it.type === "category") offset += 40;
      else offset += 100;
    }

    return { length, offset, index };
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <>
      <FlatList
        ref={listRef}
        data={listData}
        renderItem={renderItem}
        keyExtractor={(_, i) => i.toString()}
        stickyHeaderIndices={[1]}
        contentContainerStyle={styles.list}
        getItemLayout={getItemLayout}
        initialNumToRender={10}
        showsVerticalScrollIndicator={false}
      />

      {cart.length > 0 && (
        <TouchableOpacity
          style={styles.viewCartButton}
          onPress={() => setCartVisible(true)}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>
            View Cart ({cart.reduce((a, b) => a + b.quantity, 0)})
          </Text>
        </TouchableOpacity>
      )}

      {/* Cart Modal */}
      <Modal visible={cartVisible} animationType="slide">
        <View style={{ flex: 1, padding: 16 }}>
          <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 16 }}>
            Your Cart
          </Text>
          <ScrollView style={{ flex: 1 }}>
            {cart.map((i) => (
              <View
                key={i.menu_item_id}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 12
                }}
              >
                <Text>
                  {i.name} x{i.quantity}
                </Text>
                <Text>฿{(i.price * i.quantity).toFixed(2)}</Text>
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={{
              backgroundColor: "#f57c00",
              padding: 14,
              borderRadius: 10,
              marginBottom: 10
            }}
            onPress={placeOrder}
          >
            <Text style={{ color: "#fff", textAlign: "center", fontWeight: "bold" }}>
              Place Order
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ padding: 14, borderRadius: 10, backgroundColor: "#eee" }}
            onPress={() => setCartVisible(false)}
          >
            <Text style={{ textAlign: "center" }}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 16, paddingBottom: 16 },
  headerWrapper: { marginHorizontal: -16, marginBottom: 10 },
  headerCard: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingBottom: 16,
    elevation: 3
  },
  headerImage: { width: "100%", height: 180 },
  restaurantName: { fontSize: 22, fontWeight: "bold", paddingHorizontal: 16, marginTop: 12 },
  queueText: { fontSize: 14, color: "#f57c00", paddingHorizontal: 16, marginTop: 4 },
  tabsContainer: { backgroundColor: "#fff", paddingVertical: 15, marginHorizontal: -16, paddingHorizontal: 10, borderBottomWidth: 1, borderColor: "#eee", elevation: 4 },
  tab: { paddingHorizontal: 14, paddingVertical: 6, marginHorizontal: 6, backgroundColor: "#f2f2f2", borderRadius: 20 },
  tabText: { fontSize: 14, fontWeight: "500" },
  categoryTitle: { fontSize: 18, fontWeight: "bold", marginVertical: 10 },
  menuItem: { flexDirection: "row", alignItems: "center", marginBottom: 10, padding: 10, backgroundColor: "#fff", borderRadius: 10, elevation: 1 },
  itemName: { fontSize: 15, fontWeight: "600" },
  itemDescription: { marginTop: 2, fontSize: 13, color: "#666" },
  itemPrice: { marginTop: 4, fontWeight: "600", color: "#f57c00" },
  itemImage: { width: 70, height: 70, borderRadius: 8 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  addButton: { backgroundColor: "#f57c00", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  quantityContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#f2f2f2", borderRadius: 8, paddingHorizontal: 6 },
  qtyBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  viewCartButton: { position: "absolute", bottom: 16, left: 16, right: 16, backgroundColor: "#f57c00", padding: 14, borderRadius: 10, alignItems: "center", justifyContent: "center" }
});