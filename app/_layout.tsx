import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { ActivityIndicator, Text } from "react-native";
import { useBookStore } from "@/hooks/useBookStore";
import { EmptyState } from "@/components/EmptyState";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { BookStoreProvider } from "@/hooks/useBookStore";
import { ThemeProvider, useTheme } from "@/hooks/useTheme";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ToastProvider } from "@/components";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import LockScreen from "@/components/LockScreen";

// Splash screen handling is managed in RootLayout and gated by data loading

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { colors, isDark } = useTheme();

  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="book/[id]"
        options={{
          title: "Book Details",
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.surface,
        }}
      />
      <Stack.Screen
        name="book/edit/[id]"
        options={{
          title: "Edit Book",
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.surface,
        }}
      />
      <Stack.Screen
        name="book/add"
        options={{
          title: "Add Book",
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.surface,
        }}
      />
      <Stack.Screen
        name="order/index"
        options={{
          title: "Order Management",
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.surface,
        }}
      />
      <Stack.Screen
        name="search"
        options={{
          title: "Search Books",
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.surface,
        }}
      />
    </Stack>
  );
}

function AppContent() {
  const { colors, isDark } = useTheme();

  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <BookStoreProvider>
            <Gate />
          </BookStoreProvider>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );

}

function Gate() {
  const { loading: authLoading, unlocked } = useAuth();
  const { colors, isDark } = useTheme();

  if (authLoading) {
    return (
      <GestureHandlerRootView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar style={isDark ? "light" : "dark"} backgroundColor={colors.primary} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.textSecondary }}>Preparing security…</Text>
      </GestureHandlerRootView>
    );
  }

  if (!unlocked) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style={isDark ? "light" : "dark"} backgroundColor={colors.primary} />
        <LockScreen />
      </GestureHandlerRootView>
    );
  }

  return <BookStoreContent />;
}

function BookStoreContent() {
  const { loading, error } = useBookStore();
  const { colors, isDark } = useTheme();
  useEffect(() => {
    // Hide splash as soon as store finished loading (success or error)
    if (!loading) {
      SplashScreen.hideAsync().catch(() => { });
    }
  }, [loading]);
  if (loading) {
    return (
      <GestureHandlerRootView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar style={isDark ? "light" : "dark"} backgroundColor={colors.primary} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.textSecondary }}>Loading app data...</Text>
      </GestureHandlerRootView>
    );
  }
  if (error) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style={isDark ? "light" : "dark"} backgroundColor={colors.primary} />
        <EmptyState
          icon="alert-triangle"
          title="Failed to load app data"
          subtitle={error.message || String(error)}
        >
          <Text style={{ color: 'red', marginTop: 12 }}>Please restart the app or contact support.</Text>
        </EmptyState>
      </GestureHandlerRootView>
    );
  }
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style={isDark ? "light" : "dark"} backgroundColor={colors.primary} />
      <RootLayoutNav />
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Keep the splash screen visible while we fetch resources
        await SplashScreen.preventAutoHideAsync();

        // Pre-load any resources or make any API calls you need here
        // For now, just simulate some loading time
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      // Hide the splash screen after the app is ready
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </QueryClientProvider>
  );
}