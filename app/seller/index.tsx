import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { API_BASE_URL } from "../../config/api";
import { useUser } from "../../contexts/UserContext";

export default function CreateRestaurantScreen() {
  const { user } = useUser(); // get user

  const [name, setName] = useState("");
  const [isOpen, setIsOpen] = useState(true);

  const [hasCanteen, setHasCanteen] = useState(false);
  const [canteenId, setCanteenId] = useState<number | null>(null);

  const [image, setImage] = useState<any>(null);

  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapVisible, setMapVisible] = useState(false);

  const [loading, setLoading] = useState(false);

  const canteens = [
    { id: 1, name: "Canteen A" },
    { id: 2, name: "Canteen B" },
    { id: 3, name: "Canteen C" },
    { id: 4, name: "Canteen D" },
  ];

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) setImage(result.assets[0]);
  };

  const handleSubmit = async () => {
    if (!name) {
      Alert.alert("Error", "Name is required");
      return;
    }

    if (!location) {
      Alert.alert("Error", "Please pick a location on the map");
      return;
    }

    if (!user) {
      Alert.alert("Error", "User not logged in");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("name", name);

    // get get owner id from usercontext
    formData.append("owner_id", String(user.id));

    formData.append("latitude", String(location.latitude));
    formData.append("longitude", String(location.longitude));
    formData.append("is_open", isOpen ? "true" : "false");

    const randomUtil = Math.floor(Math.random() * 101);
    formData.append("utilization", String(randomUtil));

    // payment_qr_url intentionally not sent

    if (hasCanteen && canteenId) {
      formData.append("canteen_id", String(canteenId));
    }

    if (image) {
      formData.append("image", {
        uri: image.uri,
        name: "restaurant.jpg",
        type: "image/jpeg",
      } as any);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/restaurants`, {
        method: "POST",
        headers: { "Content-Type": "multipart/form-data" },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Something went wrong");

      Alert.alert("Success", "Restaurant created!");

      router.push({
        pathname: "/seller/seller_homepage/seller_restaurant",
        params: { restaurant: JSON.stringify(data) },
      });
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>KMITL CAFETERIAS</Text>

        <TouchableOpacity style={styles.goBackBtn} onPress={() => router.push("/")}>
          <Text style={{ color: "#f57c00", fontWeight: "600" }}>← Back to Login</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.header}>Create Restaurant</Text>
          <Text style={styles.subHeader}>Add a new restaurant to the system</Text>

          <Text style={styles.label}>Restaurant Name *</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />

          {/* OWNER ID INPUT REMOVED */}

          <TouchableOpacity style={styles.imageBtn} onPress={() => setMapVisible(true)}>
            <Text style={{ color: "white" }}>
              {location ? "Change Location" : "Pick Location on Map"}
            </Text>
          </TouchableOpacity>

          {location && (
            <Text style={{ marginTop: 8, color: "#555" }}>
              Lat: {location.latitude.toFixed(4)}, Lng: {location.longitude.toFixed(4)}
            </Text>
          )}

          <View style={styles.switchRow}>
            <Text>Open</Text>
            <Switch value={isOpen} onValueChange={setIsOpen} />
          </View>

          <View style={styles.switchRow}>
            <Text>Inside a canteen?</Text>
            <Switch
              value={hasCanteen}
              onValueChange={(val) => {
                setHasCanteen(val);
                if (!val) setCanteenId(null);
              }}
            />
          </View>

          {hasCanteen &&
            canteens.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.canteenOption, canteenId === c.id && styles.canteenSelected]}
                onPress={() => setCanteenId(c.id)}
              >
                <Text style={{ color: canteenId === c.id ? "#fff" : "#333" }}>
                  {c.name}
                </Text>
              </TouchableOpacity>
            ))}

          <TouchableOpacity style={styles.imageBtn} onPress={pickImage}>
            <Text style={{ color: "white" }}>Pick Image</Text>
          </TouchableOpacity>

          {image && <Image source={{ uri: image.uri }} style={styles.preview} />}

          <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create →</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={mapVisible}>
        <MapView
          style={{ flex: 1 }}
          initialRegion={{
            latitude: 13.736717,
            longitude: 100.523186,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          onPress={(e) => setLocation(e.nativeEvent.coordinate)}
        >
          {location && <Marker coordinate={location} />}
        </MapView>

        <TouchableOpacity style={styles.mapConfirm} onPress={() => setMapVisible(false)}>
          <Text style={{ color: "white" }}>Confirm Location</Text>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#d9c6b3",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 20,
    marginTop: 20,
  },
  goBackBtn: {
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
  },
  header: {
    fontSize: 24,
    fontWeight: "700",
  },
  subHeader: {
    color: "#666",
    marginBottom: 20,
  },
  label: {
    marginTop: 12,
    marginBottom: 6,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    padding: 14,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  canteenOption: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#eee",
    marginTop: 8,
  },
  canteenSelected: {
    backgroundColor: "#f57c00",
  },
  imageBtn: {
    backgroundColor: "#888",
    padding: 14,
    alignItems: "center",
    borderRadius: 12,
    marginTop: 15,
  },
  preview: {
    width: "100%",
    height: 180,
    marginTop: 10,
    borderRadius: 12,
  },
  button: {
    backgroundColor: "#f57c00",
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 20,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  mapConfirm: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: "#f57c00",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
});