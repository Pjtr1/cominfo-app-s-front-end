import { Stack } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    Animated,
    FlatList,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type Message = {
  id: string;
  role: "user" | "ai";
  text: string;
};

export default function HomeLayout() {
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const slideAnim = useRef(new Animated.Value(400)).current;

  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isTyping) return;

    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: -4,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      );

    const a1 = animate(dot1, 0);
    const a2 = animate(dot2, 150);
    const a3 = animate(dot3, 300);

    a1.start();
    a2.start();
    a3.start();

    return () => {
      dot1.stopAnimation();
      dot2.stopAnimation();
      dot3.stopAnimation();
    };
  }, [isTyping]);

  function openChat() {
    setChatOpen(true);

    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }

  function closeChat() {
    Animated.timing(slideAnim, {
      toValue: 400,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setChatOpen(false);
      setMessages([]);
      setInput("");
    });
  }

  async function sendMessage() {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      text: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch(
        "https://cominfo-api-server.onrender.com/ai/message",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: userMessage.text,
          }),
        }
      );

      const data = await response.json();

      const aiMessage: Message = {
        id: Date.now().toString() + "_ai",
        role: "ai",
        text: data.reply ?? "AI response placeholder",
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now().toString() + "_error",
        role: "ai",
        text: "Sorry, something went wrong contacting the AI.",
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="restaurant" options={{ title: "Restaurant" }} />
      </Stack>

      {!chatOpen && (
        <TouchableOpacity
          onPress={openChat}
          style={{
            position: "absolute",
            bottom: 30,
            right: 20,
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: "#007AFF",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontSize: 20 }}>AI</Text>
        </TouchableOpacity>
      )}

      {chatOpen && (
        <Animated.View
          style={{
            position: "absolute",
            bottom: 0,
            width: "100%",
            height: "50%",
            backgroundColor: "white",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 10,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <TouchableOpacity
            onPress={closeChat}
            style={{ alignSelf: "flex-end", marginBottom: 10 }}
          >
            <Text>Close</Text>
          </TouchableOpacity>

          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            style={{ flex: 1 }}
            renderItem={({ item }) => (
              <View
                style={{
                  alignSelf:
                    item.role === "user" ? "flex-end" : "flex-start",
                  backgroundColor:
                    item.role === "user" ? "#007AFF" : "#E5E5EA",
                  padding: 10,
                  borderRadius: 10,
                  marginVertical: 4,
                  maxWidth: "80%",
                }}
              >
                <Text
                  style={{
                    color: item.role === "user" ? "white" : "black",
                  }}
                >
                  {item.text}
                </Text>
              </View>
            )}
          />

          {isTyping && (
            <View
              style={{
                alignSelf: "flex-start",
                backgroundColor: "#E5E5EA",
                padding: 10,
                borderRadius: 10,
                flexDirection: "row",
                gap: 5,
                marginBottom: 5,
              }}
            >
              <Animated.View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: "#555",
                  transform: [{ translateY: dot1 }],
                }}
              />
              <Animated.View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: "#555",
                  transform: [{ translateY: dot2 }],
                }}
              />
              <Animated.View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: "#555",
                  transform: [{ translateY: dot3 }],
                }}
              />
            </View>
          )}

          <View style={{ flexDirection: "row", marginTop: 10 }}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask the AI..."
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: "#ccc",
                borderRadius: 10,
                padding: 10,
              }}
            />

            <TouchableOpacity
              onPress={sendMessage}
              style={{
                marginLeft: 10,
                backgroundColor: "#007AFF",
                paddingHorizontal: 15,
                justifyContent: "center",
                borderRadius: 10,
              }}
            >
              <Text style={{ color: "white" }}>Send</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
}