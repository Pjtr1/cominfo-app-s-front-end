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
// 👇 ADD UserContext
import { useUser } from "../contexts/UserContext";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { setUser } = useUser(); // get setter from context

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "https://erratically-thermogenetic-landon.ngrok-free.dev/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: username, // still using username field for input
            password: password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Login Failed", data.message || "Wrong email or password");
        return;
      }

      // ✅ Store full user info in context
      setUser({
        id: data.id,
        username: data.username,
        email: data.email,
        role: data.role,
      });

      console.log("Logged in user:", data);

      // 👇 role-based navigation
      if (data.role === "customer") {
        router.replace("/customer/home");
      } else if (data.role === "seller") {
        router.replace("/seller");
      } else {
        Alert.alert("Error", "Unknown user role");
      }
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