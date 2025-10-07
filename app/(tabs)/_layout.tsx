import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { View, Text, Pressable } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

function QuickActionsTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();

  const allowed = new Set(['index', 'inventory', 'orders', 'notes', 'settings']);

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderTopColor: colors.border,
        borderTopWidth: 1,
        paddingTop: 6,
        paddingBottom: 10,
      }}
    >
      {state.routes.filter(r => allowed.has(r.name as string)).map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? (options.tabBarLabel as string)
            : options.title !== undefined
              ? options.title
              : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        const iconColor = isFocused ? '#4A5D3F' : colors.textLight;
        const squareBg = isFocused ? '#B8CCA0' : '#4A5D3F26';

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            onLongPress={onLongPress}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6 }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: squareBg,
                borderWidth: 2,
                borderColor: '#4A5D3F',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {options.tabBarIcon
                ? options.tabBarIcon({ focused: isFocused, color: iconColor, size: 18 })
                : null}
            </View>
            <Text
              style={{
                marginTop: 6,
                fontSize: 11,
                fontWeight: '600',
                color: isFocused ? '#4A5D3F' : colors.textLight,
              }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      tabBar={(props) => <QuickActionsTabBar {...props} />}
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        // The custom tabBar handles layout and labels
        tabBarActiveBackgroundColor: colors.primary + '20', // 20% opacity background for active tab
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.surface,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarLabel: 'Home',
          headerShown: false,
          tabBarIcon: ({ color }) => <Feather name="home" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: "Books",
          tabBarLabel: 'Books',
          headerShown: false,
          tabBarIcon: ({ color }) => <Feather name="book" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarLabel: 'Orders',
          headerShown: false,
          tabBarIcon: ({ color }) => <Feather name="clipboard" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: "Notes",
          tabBarLabel: 'Notes',
          headerShown: false,
          tabBarIcon: ({ color }) => <Feather name="file-text" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarLabel: 'Settings',
          headerShown: false,
          tabBarIcon: ({ color }) => <Feather name="settings" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="import"
        options={{
          title: "Import",
          headerShown: false,
          href: null, // This hides the tab from the bottom navigation
        }}
      />
    </Tabs>
  );
}