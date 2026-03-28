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
      const res = await fetch("https://cominfo-api-server.onrender.com/canteens");
      const data = await res.json();
      setCanteens(data);
    } catch (err) {
      console.log("Error fetching canteens:", err);
    } finally {
      setLoading(false);
    }
  };

  // location tracking
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
      (loc) => {
        setUserLocation(loc.coords);
      }
    );
  };

  // haversine formula
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
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // SORT canteens by distance
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

  const renderCanteen = ({ item }: { item: Canteen }) => {
    let distanceText = "";

    if (userLocation) {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        item.latitude,
        item.longitude
      );

      if (distance < 1) {
        const meters = Math.round(distance * 1000);
        distanceText = `${meters} m away`;
      } else {
        distanceText = `${distance.toFixed(1)} km away`;
      }
    }

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          router.push({
            pathname: "/home/restaurants",
            params: { canteenId: item.id, canteenName: item.name },
          })
        }
      >
        {item.image_url && (
          <Image source={{ uri: item.image_url }} style={styles.image} />
        )}

        <View style={styles.info}>
          <Text style={styles.title}>{item.name}</Text>

          <Text style={styles.utilization}>
            Utilization: {item.utilization}%
          </Text>

          {distanceText !== "" && (
            <Text style={styles.distance}>{distanceText}</Text>
          )}
        </View>
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
      data={sortedCanteens}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderCanteen}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 3,
  },

  image: {
    width: "100%",
    height: 150,
  },

  info: {
    padding: 12,
  },

  title: {
    fontSize: 18,
    fontWeight: "bold",
  },

  utilization: {
    marginTop: 4,
    color: "#666",
  },

  distance: {
    marginTop: 4,
    color: "#007AFF",
    fontWeight: "600",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});