import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { API_BASE_URL } from "../../../../config/api";
type Restaurant = {
  id: number;
  name: string;
  image_url: string | null;
  canteen_id: number | null;
  owner_id: number | null;
  latitude: number | null;
  longitude: number | null;
  is_open: boolean;
  utilization: number | null;
  payment_qr_url: string | null;
  distance?: number | null;
};

export default function RestaurantsPage() {
  const { canteenId, canteenName } = useLocalSearchParams();
  const router = useRouter();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    fetchRestaurants();
    trackUserLocation();
  }, []);

  const fetchRestaurants = async () => {
    try {
      let url = `${API_BASE_URL}/restaurants`;
      if (canteenId && canteenId !== "null") {
        url += `?canteen_id=${canteenId}`;
      }

      const res = await fetch(url);
      const data: Restaurant[] = await res.json();
      setRestaurants(data);
    } catch (err) {
      console.log("Error fetching restaurants:", err);
    } finally {
      setLoading(false);
    }
  };

  const trackUserLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;

    const location = await Location.getCurrentPositionAsync({});
    setUserLocation(location.coords);

    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 5 },
      (loc) => setUserLocation(loc.coords)
    );
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const sortedRestaurants = [...restaurants].sort((a, b) => {
    if (!userLocation) return 0;

    const distA =
      a.latitude != null && a.longitude != null
        ? calculateDistance(userLocation.latitude, userLocation.longitude, a.latitude, a.longitude)
        : Infinity;

    const distB =
      b.latitude != null && b.longitude != null
        ? calculateDistance(userLocation.latitude, userLocation.longitude, b.latitude, b.longitude)
        : Infinity;

    return distA - distB;
  });

  const renderRestaurant = ({ item }: { item: Restaurant }) => {
    let distanceText = "";

    if (userLocation && item.latitude != null && item.longitude != null) {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        item.latitude,
        item.longitude
      );
      distanceText =
        distance < 1
          ? `${Math.round(distance * 1000)} m away`
          : `${distance.toFixed(1)} km away`;
    }

    const openMap = () => {
      if (item.latitude != null && item.longitude != null) {
        router.push({
          pathname: "/customer/(tabs)/home/map",
          params: {
            canteenLat: item.latitude.toString(),
            canteenLon: item.longitude.toString(),
          },
        });
      }
    };

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          router.push({
            pathname: "/customer/(tabs)/home/menu",
            params: {
              restaurantId: item.id.toString(),
              restaurantName: item.name,
              restaurantImage: item.image_url ?? "",
            },
          })
        }
      >
        {item.image_url && (
          <Image source={{ uri: item.image_url }} style={styles.image} />
        )}

        <View style={styles.info}>
          <Text style={styles.title}>{item.name}</Text>
          <Text style={{ color: item.is_open ? "green" : "red" }}>
            {item.is_open ? "Open" : "Closed"}
          </Text>
          {item.utilization != null && (
            <Text style={styles.utilization}>
              Seat occupied: {item.utilization}%
            </Text>
          )}
          {distanceText !== "" && (
            <Text style={styles.distance}>{distanceText}</Text>
          )}
        </View>

        {/* Map button (ONLY if coords exist) */}
        {item.latitude != null && item.longitude != null && (
          <TouchableOpacity style={styles.mapButton} onPress={openMap}>
            <Text style={styles.mapButtonText}>Map</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <FlatList
      data={sortedRestaurants}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderRestaurant}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 3,
    position: "relative",
  },
  image: { width: "100%", height: 150 },
  info: { padding: 12 },
  title: { fontSize: 18, fontWeight: "bold" },
  utilization: { marginTop: 4, color: "#666" },
  distance: { marginTop: 4, color: "#f57c00", fontWeight: "600" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  mapButton: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "#f57c00",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  mapButtonText: { color: "#fff", fontWeight: "bold" },
});