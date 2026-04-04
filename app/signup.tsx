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
import { useUser } from "../contexts/UserContext"; // adjust path if needed

export default function SignUpScreen() {
  const { setUser } = useUser();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"customer" | "seller">("customer");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!username || !email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("https://erratically-thermogenetic-landon.ngrok-free.dev/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
          role, // include role in request body
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Signup Failed", data.message || "Something went wrong");
        return;
      }

      // store user info in context
      setUser({
        id: data.id,
        username: data.username,
        email: data.email,
        role: data.role,
      });

      // navigate based on role
      if (data.role === "seller") {
        router.replace("/seller");
      } else {
        router.replace("/customer/home");
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
        <Text style={styles.header}>Create Account</Text>
        <Text style={styles.subHeader}>Sign up for KMITL Food Services</Text>

        {/* Username */}
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          placeholder="Choose a username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        {/* Email */}
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />

        {/* Password */}
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Create a password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
        />

        {/* Role picker */}
        <Text style={styles.label}>Role</Text>
        <View style={styles.roleContainer}>
          <TouchableOpacity
            style={[
              styles.roleButton,
              role === "customer" && styles.roleButtonSelected,
            ]}
            onPress={() => setRole("customer")}
          >
            <Text
              style={[
                styles.roleText,
                role === "customer" && styles.roleTextSelected,
              ]}
            >
              Customer
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.roleButton,
              role === "seller" && styles.roleButtonSelected,
            ]}
            onPress={() => setRole("seller")}
          >
            <Text
              style={[
                styles.roleText,
                role === "seller" && styles.roleTextSelected,
              ]}
            >
              Seller
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sign Up button */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleSignup}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Creating Account..." : "Sign Up →"}
          </Text>
        </TouchableOpacity>

        {/* Login link */}
        <View style={{ flexDirection: "row", justifyContent: "center" }}>
          <Text style={styles.login}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/")}>
            <Text style={styles.loginLink}>Log in</Text>
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
  roleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  roleButton: {
    flex: 1,
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
  },
  roleButtonSelected: {
    backgroundColor: "#f57c00",
    borderColor: "#f57c00",
  },
  roleText: {
    color: "#555",
    fontWeight: "500",
  },
  roleTextSelected: {
    color: "#fff",
    fontWeight: "700",
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
  login: {
    textAlign: "center",
    marginTop: 16,
    color: "#555",
  },
  loginLink: {
    marginTop: 16,
    color: "#f57c00",
    fontWeight: "600",
  },
});