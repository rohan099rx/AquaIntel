import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: "#2196F3",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Overview",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          tabBarIcon: ({ color }) => (
            <Ionicons name="map" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="charts"
        options={{
          title: "Analytics",
          tabBarIcon: ({ color }) => (
            <Ionicons name="bar-chart" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="predictions"
        options={{
          title: "Forecast",
          tabBarIcon: ({ color }) => (
            <Ionicons name="analytics" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
