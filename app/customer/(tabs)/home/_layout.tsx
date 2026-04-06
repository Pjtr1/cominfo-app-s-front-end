import { Ionicons } from '@expo/vector-icons';
import * as Location from "expo-location";
import { Stack } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  PanResponder,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_BASE_URL } from "../../../../config/api";

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

  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null); 

  const slideAnim = useRef(new Animated.Value(400)).current;

  // Typing dots
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  // Screen bounds
  const { width, height } = Dimensions.get("window");
  const BUTTON_SIZE = 60;
  const MARGIN = 20;

  const maxX = width - BUTTON_SIZE - MARGIN;
  const maxY = height - BUTTON_SIZE - MARGIN;

  // Drag state
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const last = useRef({ x: 0, y: 0 });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,

      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5,

      onPanResponderMove: (_, gesture) => {
        let newX = last.current.x + gesture.dx;
        let newY = last.current.y + gesture.dy;

        // Clamp inside screen
        newX = Math.max(-maxX, Math.min(newX, 0));
        newY = Math.max(-maxY + 50, Math.min(newY, 30));

        pan.setValue({ x: newX, y: newY });
      },

      onPanResponderRelease: (_, gesture) => {
        let newX = last.current.x + gesture.dx;
        let newY = last.current.y + gesture.dy;

        // KEEP your original clamps
        newX = Math.max(-maxX, Math.min(newX, 18));
        newY = Math.max(-maxY + 50, Math.min(newY, 30));

        const middleX = (-maxX + 18) / 2;

        let finalX;

        if (gesture.vx < -0.5) {
          finalX = -maxX;
        } else if (gesture.vx > 0.5) {
          finalX = 18;
        } else {
          finalX = newX < middleX ? -maxX : 18;
        }

        Animated.spring(pan, {
          toValue: { x: finalX, y: newY },
          useNativeDriver: false,
        }).start();

        last.current = { x: finalX, y: newY };
      },
    })
  ).current;

  // ✅ GET USER LOCATION
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      let location = await Location.getCurrentPositionAsync({});
      setCoords({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();
  }, []);

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
        `${API_BASE_URL}/ai/message`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: userMessage.text,
            latitude: coords?.latitude ?? 0,     
            longitude: coords?.longitude ?? 0,   
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
    <>
      <Stack screenOptions={{ headerShown: false }} />

      {!chatOpen && (
        <Animated.View
          {...panResponder.panHandlers}
          style={{
            position: "absolute",
            bottom: 30,
            right: 20,
            transform: pan.getTranslateTransform(),
          }}
        >
          <TouchableOpacity
            onPress={openChat}
            activeOpacity={0.8}
            style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: "#f57c00",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="chatbubble-ellipses" size={28} color="white" />
          </TouchableOpacity>
        </Animated.View>
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
                    item.role === "user" ? "#f57c00" : "#E5E5EA",
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
              {[dot1, dot2, dot3].map((dot, i) => (
                <Animated.View
                  key={i}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: "#555",
                    transform: [{ translateY: dot }],
                  }}
                />
              ))}
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
                backgroundColor: "#f57c00",
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
    </>
  );
}