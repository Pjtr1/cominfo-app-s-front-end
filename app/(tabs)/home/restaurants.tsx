import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    View,
} from "react-native";

type Restaurant = {
  id: number;
  name: string;
  queue: number;
  image_url: string | null;
  canteen_id: number;
};

export default function RestaurantsPage() {
  const { canteenId, canteenName } = useLocalSearchParams();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const res = await fetch(
        `https://cominfo-api-server.onrender.com/canteens/${canteenId}/restaurants`
      );
      const data = await res.json();
      setRestaurants(data);
    } catch (err) {
      console.log("Error fetching restaurants:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderRestaurant = ({ item }: { item: Restaurant }) => {
    return (
      <View style={styles.card}>
        {/* Only render image if not null */}
        {item.image_url && (
          <Image source={{ uri: item.image_url }} style={styles.image} />
        )}

        <View style={styles.info}>
          <Text style={styles.title}>{item.name}</Text>
          <Text style={styles.queue}>Queue: {item.queue}</Text>
        </View>
      </View>
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
    <View style={styles.container}>
      <Text style={styles.header}>{canteenName}</Text>

      <FlatList
        data={restaurants}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderRestaurant}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    fontSize: 22,
    fontWeight: "bold",
    padding: 16,
  },

  list: {
    paddingHorizontal: 16,
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

  queue: {
    marginTop: 4,
    color: "#666",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});