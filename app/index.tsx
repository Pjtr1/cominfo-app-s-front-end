import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
// 👇 ADD
import { useNavigation } from "@react-navigation/native";
import { router } from "expo-router";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  // 👇 ADD
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation();

  // 👇 ADD: login handler
  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("https://cominfo-api-server.onrender.com/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: username, // will rename later
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // API returned error (wrong email/password)
        Alert.alert("Login Failed", data.message || "Wrong email or password");
        return;
      }

      // ✅ success: API returns row id & email
      console.log("Logged in user:", data);

      // 👇 navigate to placeholder screen
      router.replace("/home");
    } catch (error) {
      Alert.alert("Error", "Something went wrong. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>KMITL CAFETERIAS</Text>

      {/* Card */}
      <View style={styles.card}>
        <Text style={styles.header}>เข้าสู่ระบบ</Text>
        <Text style={styles.subHeader}>
          Welcome back to KMITL Food Services
        </Text>

        {/* Username */}
        <Text style={styles.label}>Student ID / Username</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 64012345"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        {/* Password */}
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
        />

        {/* Forgot password */}
        <TouchableOpacity>
          <Text style={styles.forgot}>Forgot Password?</Text>
        </TouchableOpacity>

        {/* Login button */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Logging in..." : "Login →"}
          </Text>
        </TouchableOpacity>

        {/* Signup */}
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