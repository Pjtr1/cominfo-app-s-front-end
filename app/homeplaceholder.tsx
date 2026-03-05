import { Text, View } from "react-native";

export default function HomePlaceholder() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Logged in successfully 🎉</Text>
      <Text>This is a placeholder screen</Text>
    </View>
  );
}