import * as Location from "expo-location";
import { useRouter } from "expo-router";
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

type Canteen = {
  id: number;
  name: string;
  utilization: number;
  latitude: number;
  longitude: number;
  image_url: string | null;
  isOther?: boolean;
};

export default function HomePage() {
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const router = useRouter();

  useEffect(() => {
    fetchCanteens();
    startLocationTracking();
  }, []);

  const fetchCanteens = async () => {
    try {
      const res = await fetch(
        "https://erratically-thermogenetic-landon.ngrok-free.dev/canteens"
      );
      const data = await res.json();
      setCanteens(data);
    } catch (err) {
      console.log("Error fetching canteens:", err);
    } finally {
      setLoading(false);
    }
  };

  const startLocationTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.log("Location permission denied");
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    setUserLocation(location.coords);

    Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 5,
      },
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

  const sortedCanteens = [...canteens].sort((a, b) => {
    if (!userLocation) return 0;
    const distA = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      a.latitude,
      a.longitude
    );
    const distB = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      b.latitude,
      b.longitude
    );
    return distA - distB;
  });

  const canteensWithOther: Canteen[] = [
    ...sortedCanteens,
    {
      id: -1,
      name: "Other restaurants",
      utilization: 0,
      latitude: 0,
      longitude: 0,
      image_url: null,
      isOther: true,
    },
  ];

  const renderCanteen = ({ item }: { item: Canteen }) => {
    if (item.isOther) {
      return (
        <TouchableOpacity
          style={styles.card}
          onPress={() =>
            router.push({
              pathname: "/customer/(tabs)/home/restaurants",
              params: { canteenId: "null", canteenName: "Other restaurants" },
            })
          }
        >
          <View style={styles.info}>
            <Text style={styles.title}>Other restaurants</Text>
            <Text style={styles.utilization}>
              Restaurants not in a canteen
            </Text>
          </View>
        </TouchableOpacity>
      );
    }

    let distanceText = "";
    if (userLocation) {
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
      router.push({
        pathname: "/customer/(tabs)/home/map",
        params: {
          canteenLat: item.latitude.toString(),
          canteenLon: item.longitude.toString(),
        },
      });
    };

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          router.push({
            pathname: "/customer/(tabs)/home/restaurants",
            params: { canteenId: item.id.toString(), canteenName: item.name },
          })
        }
      >
        {item.image_url && <Image source={{ uri: item.image_url }} style={styles.image} />}
        <View style={styles.info}>
          <Text style={styles.title}>{item.name}</Text>
          <Text style={styles.utilization}>Seat occupied: {item.utilization}% </Text>
          {distanceText !== "" && <Text style={styles.distance}>{distanceText}</Text>}
        </View>
        {/* Map button at bottom right */}
        <TouchableOpacity style={styles.mapButton} onPress={openMap}>
          <Text style={styles.mapButtonText}>Map</Text>
        </TouchableOpacity>
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
      data={canteensWithOther}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderCanteen}
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
  distance: { marginTop: 4, color: "#f57c00", fontWeight: "600" }, // changed to orange
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  mapButton: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "#f57c00", // changed to orange
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  mapButtonText: { color: "#fff", fontWeight: "bold" },
});