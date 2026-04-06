import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_BASE_URL } from "../../../config/api";

interface MenuItem {
  id: number;
  name: string;
  price: number;
  description?: string;
  is_available: boolean;
  image_url?: string;
}

interface Category {
  id: number;
  name: string;
  menu_items: MenuItem[];
}

interface Restaurant {
  id: number;
  name: string;
  image_url?: string;
}

const screenWidth = Dimensions.get("window").width;

export default function SellerRestaurantMenuPage() {
  const params = useLocalSearchParams();
  const restaurant: Restaurant = params.restaurant
    ? JSON.parse(params.restaurant as string)
    : { id: 0, name: "Unknown" };
  const restaurantId = restaurant.id;

  const [menuData, setMenuData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingCategoryId, setAddingCategoryId] = useState<number | "category" | null>(null);
  const [formData, setFormData] = useState({ name: "", price: "", description: "" });
  const [image, setImage] = useState<any>(null);

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/restaurants/${restaurantId}/menu`);
      const data: Category[] = await res.json();
      setMenuData(data);
    } catch (err) {
      console.error(err);
      alert("Failed to load menu data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled) setImage(result.assets[0]);
  };

  const handleAddCategory = async () => {
    if (!formData.name.trim()) return alert("Category name is required");
    try {
      const res = await fetch(`${API_BASE_URL}/restaurants/${restaurantId}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formData.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data));
      setFormData({ name: "", price: "", description: "" });
      setAddingCategoryId(null);
      fetchMenu();
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    }
  };

  const handleAddMenuItem = async (categoryId: number) => {
    if (!formData.name.trim() || !formData.price) return alert("Name and price required");
    try {
      const form = new FormData();
      form.append("name", formData.name);
      form.append("price", String(parseFloat(formData.price)));
      form.append("description", formData.description || "");
      form.append("is_available", "true");

      if (image) {
        form.append("image", {
          uri: image.uri,
          name: "menuitem.jpg",
          type: "image/jpeg",
        } as any);
      }

      const res = await fetch(`${API_BASE_URL}/categories/${categoryId}/items`, {
        method: "POST",
        body: form,
        headers: { "Content-Type": "multipart/form-data" },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data));

      setFormData({ name: "", price: "", description: "" });
      setImage(null);
      setAddingCategoryId(null);
      fetchMenu();
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f57c00" />
      </View>
    );
  }

  return (
    <FlatList
      data={menuData}
      keyExtractor={(cat) => cat.id.toString()}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
      ListHeaderComponent={
        <View style={styles.headerWrapper}>
          <View style={styles.restaurantCard}>
            <Image
              source={{ uri: restaurant.image_url || "https://via.placeholder.com/400x200.png?text=No+Image" }}
              style={styles.restaurantImage}
            />
            <Text style={styles.restaurantName}>{restaurant.name}</Text>
          </View>
        </View>
      }
      renderItem={({ item: category }) => (
        <View style={styles.card}>
          <Text style={styles.categoryTitle}>{category.name}</Text>

          {category.menu_items.length === 0 ? (
            <Text style={styles.emptyText}>No menu items yet</Text>
          ) : (
            category.menu_items.map((menu) => (
              <View key={menu.id} style={styles.menuItem}>
                {menu.image_url && <Image source={{ uri: menu.image_url }} style={styles.menuItemImage} />}
                <View style={{ flex: 1, paddingLeft: 10 }}>
                  <Text style={styles.menuItemName}>
                    {menu.name} - ฿{menu.price.toFixed(2)}
                    {!menu.is_available && <Text style={{ color: "red" }}> (Unavailable)</Text>}
                  </Text>
                  {menu.description && <Text style={styles.menuItemDesc}>{menu.description}</Text>}
                </View>
              </View>
            ))
          )}

          {addingCategoryId === category.id ? (
            <View style={styles.formContainer}>
              <TextInput
                placeholder="Menu Name"
                style={styles.input}
                value={formData.name}
                onChangeText={(t) => setFormData((p) => ({ ...p, name: t }))}
              />
              <TextInput
                placeholder="Price"
                style={styles.input}
                keyboardType="numeric"
                value={formData.price}
                onChangeText={(t) => setFormData((p) => ({ ...p, price: t }))}
              />
              <TextInput
                placeholder="Description"
                style={styles.input}
                value={formData.description}
                onChangeText={(t) => setFormData((p) => ({ ...p, description: t }))}
              />

              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <TouchableOpacity style={styles.addButton} onPress={() => handleAddMenuItem(category.id)}>
                  <Text style={styles.addButtonText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: "#ccc" }]}
                  onPress={() => { setAddingCategoryId(null); setImage(null); }}
                >
                  <Text style={styles.addButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={[styles.addButton, { marginTop: 8 }]} onPress={pickImage}>
                <Text style={styles.addButtonText}>Pick Image</Text>
              </TouchableOpacity>
              {image && <Image source={{ uri: image.uri }} style={styles.menuItemImage} />}
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.addButton, { marginTop: 10 }]}
              onPress={() => setAddingCategoryId(category.id)}
            >
              <Text style={styles.addButtonText}>+ Add Menu Item</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      ListFooterComponent={
        addingCategoryId === "category" ? (
          <View style={styles.card}>
            <TextInput
              placeholder="Category Name"
              style={styles.input}
              value={formData.name}
              onChangeText={(t) => setFormData((p) => ({ ...p, name: t }))}
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <TouchableOpacity style={styles.addButton} onPress={handleAddCategory}>
                <Text style={styles.addButtonText}>Save Category</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: "#ccc" }]}
                onPress={() => setAddingCategoryId(null)}
              >
                <Text style={styles.addButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.addButton, { marginTop: 16, marginHorizontal: 16 }]}
            onPress={() => setAddingCategoryId("category")}
          >
            <Text style={styles.addButtonText}>+ Add Category</Text>
          </TouchableOpacity>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerWrapper: { marginHorizontal: -16, marginBottom: 16 },
  restaurantCard: {
    width: screenWidth,
    backgroundColor: "#fff",
    borderRadius: 0,
    elevation: 3,
  },
  restaurantImage: { width: "100%", height: 180, borderRadius: 0 },
  restaurantName: { fontSize: 22, fontWeight: "bold", padding: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  categoryTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    marginBottom: 8,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
  },
  menuItemImage: { width: 60, height: 60, borderRadius: 8 },
  menuItemName: { fontSize: 15, fontWeight: "600" },
  menuItemDesc: { fontSize: 13, color: "#666" },
  emptyText: { paddingLeft: 10, color: "#999", fontStyle: "italic" },
  input: { backgroundColor: "#f2f2f2", borderRadius: 12, padding: 10, marginTop: 8 },
  formContainer: { marginTop: 10 },
  addButton: {
    flex: 1,
    backgroundColor: "#f57c00",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginTop: 8,
    alignItems: "center",
  },
  addButtonText: { color: "#fff", fontWeight: "600" },
});