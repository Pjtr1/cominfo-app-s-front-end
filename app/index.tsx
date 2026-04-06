import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { API_BASE_URL } from "../config/api";
import { useUser } from "../contexts/UserContext";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { setUser } = useUser();

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Login Failed", data.message || "Wrong email or password");
        return;
      }

      // Store user in context
      setUser({
        id: data.id,
        username: data.username,
        email: data.email,
        role: data.role,
      });

      console.log("Logged in user:", data);

      // Customer flow
      if (data.role === "customer") {
        router.replace("/customer/home");
        return;
      }

      // Seller flow
      if (data.role === "seller") {
        try {
          const restaurantRes = await fetch(
            `${API_BASE_URL}/users/${data.id}/restaurants`
          );
          const restaurants = await restaurantRes.json();

          if (!restaurantRes.ok || restaurants.length === 0) {
            // No restaurant -> default seller page
            router.replace("/seller");
            return;
          }

          // Has restaurant -> take the first one
          const restaurant = restaurants[0];

          // Navigate with params (JSON string for local search)
          router.replace({
            pathname: "/seller/seller_homepage/seller_restaurant",
            params: { restaurant: JSON.stringify(restaurant) },
          });
        } catch (err) {
          console.error("Restaurant fetch error:", err);
          Alert.alert("Error", "Failed to load restaurant data");
        }
        return;
      }

      // Unknown role
      Alert.alert("Error", "Unknown user role");
    } catch (error) {
      Alert.alert("Error", "Something went wrong. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>KMITL CAFETERIAS</Text>

      <View style={styles.card}>
        <Text style={styles.header}>เข้าสู่ระบบ</Text>
        <Text style={styles.subHeader}>
          Welcome back to KMITL Food Services
        </Text>

        <Text style={styles.label}>Email / Username</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 64012345@kmitl.ac.th"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
        />

        <TouchableOpacity>
          <Text style={styles.forgot}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Logging in..." : "Login →"}
          </Text>
        </TouchableOpacity>

        <View style={{ flexDirection: "row", justifyContent: "center" }}>
          <Text style={styles.signup}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/signup")}>
            <Text style={styles.signupLink}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#d9c6b3",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 20,
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
    marginBottom: 6,
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
  forgot: {
    color: "#f57c00",
    textAlign: "right",
    marginTop: 10,
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
  signup: {
    textAlign: "center",
    marginTop: 16,
    color: "#555",
  },
  signupLink: {
    color: "#f57c00",
    fontWeight: "600",
    marginTop: 16,
  },
});