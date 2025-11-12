import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import "../global.css";
import { useEffect, useState } from "react";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { LogBox, ActivityIndicator, View } from "react-native";
import { semanticVectorStore } from "@/services/vectorStores/semanticSearchVectorStore";

import { useColorScheme } from "@/hooks/useColorScheme";

// Suppress SafeAreaView deprecation warning
LogBox.ignoreLogs(["SafeAreaView has been deprecated"]);

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const [vectorStoreLoaded, setVectorStoreLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        console.log("[RootLayout] Loading semantic vector store...");
        await semanticVectorStore.load();
        console.log("[RootLayout] Semantic vector store loaded successfully");
        setVectorStoreLoaded(true);
      } catch (error) {
        console.error("[RootLayout] Failed to load semantic vector store:", error);
        // Continue even if vector store fails to load
        setVectorStoreLoaded(true);
      }
    })();
  }, []);

  if (!loaded || !vectorStoreLoaded) {
    // Show loading screen while fonts and vector store are loading
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen
          name="index"
          options={{ headerShown: true, headerTitle: "taropsqlite" }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
