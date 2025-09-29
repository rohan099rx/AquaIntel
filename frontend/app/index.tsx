import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

// Dashboard mock data
const DASHBOARD_DATA = {
  totalStations: 156,
  activeStations: 147,
  criticalAlerts: 8,
  averageWaterLevel: 14.3,
  recentReadings: [
    {
      id: "R001",
      stationId: "DWLR001",
      name: "Mumbai Central",
      level: 12.5,
      timestamp: "2025-09-26T08:30:00",
    },
    {
      id: "R002",
      stationId: "DWLR002",
      name: "Bangalore Main",
      level: 8.3,
      timestamp: "2025-09-26T08:15:00",
    },
    {
      id: "R003",
      stationId: "DWLR003",
      name: "Delhi DWLR",
      level: 15.7,
      timestamp: "2025-09-26T08:00:00",
    },
    {
      id: "R004",
      stationId: "DWLR004",
      name: "Chennai Coastal",
      level: 6.2,
      timestamp: "2025-09-26T07:45:00",
    },
    {
      id: "R005",
      stationId: "DWLR005",
      name: "Jaipur Desert",
      level: 22.8,
      timestamp: "2025-09-26T07:30:00",
    },
  ],
  nationalTrend: {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"],
    datasets: [
      {
        data: [13.2, 13.5, 13.8, 14.1, 14.5, 14.8, 14.6, 14.4, 14.3],
      },
    ],
  },
};

export default function OverviewScreen() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(DASHBOARD_DATA);
  const screenWidth = Dimensions.get("window").width;
  const router = useRouter();

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
  };

  type AllowedSection = "map" | "charts" | "predictions";

  const navigateToSection = (section: AllowedSection) => {
    router.push(`/${section}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading dashboard data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>DWLR Monitoring System</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome to the DWLR Dashboard</Text>
          <Text style={styles.welcomeText}>
            Monitor groundwater levels across multiple stations and analyze
            trends in real-time.
          </Text>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {dashboardData.totalStations}
              </Text>
              <Text style={styles.statLabel}>Total Stations</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {dashboardData.activeStations}
              </Text>
              <Text style={styles.statLabel}>Active Stations</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statCard, styles.alertCard]}>
              <Text style={[styles.statValue, styles.alertValue]}>
                {dashboardData.criticalAlerts}
              </Text>
              <Text style={styles.statLabel}>Critical Alerts</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {dashboardData.averageWaterLevel}m
              </Text>
              <Text style={styles.statLabel}>Avg Water Level</Text>
            </View>
          </View>
        </View>

        {/* Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.cardTitle}>National Average Trend (2025)</Text>
          <LineChart
            data={dashboardData.nationalTrend}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              backgroundColor: "#ffffff",
              backgroundGradientFrom: "#ffffff",
              backgroundGradientTo: "#ffffff",
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: "6",
                strokeWidth: "2",
                stroke: "#ffa726",
              },
            }}
            bezier
            style={styles.chart}
            yAxisSuffix="m"
          />
        </View>

        {/* Recent Readings */}
        <View style={styles.readingsCard}>
          <Text style={styles.cardTitle}>Recent Readings</Text>
          {dashboardData.recentReadings.map((reading) => (
            <View key={reading.id} style={styles.readingItem}>
              <View style={styles.readingMain}>
                <Text style={styles.readingStation}>{reading.name}</Text>
                <Text style={styles.readingId}>ID: {reading.stationId}</Text>
              </View>
              <View style={styles.readingDetails}>
                <Text style={styles.readingLevel}>{reading.level}m</Text>
                <Text style={styles.readingTime}>
                  {formatTime(reading.timestamp)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Quick Access Buttons */}
        <View style={styles.quickAccessContainer}>
          <Text style={styles.cardTitle}>Quick Access</Text>
          <View style={styles.navGrid}>
            <TouchableOpacity
              style={styles.navCard}
              onPress={() => navigateToSection("map")} // ✅ No leading slash
            >
              <Ionicons name="map" size={30} color="#2196F3" />
              <Text style={styles.navCardTitle}>Monitoring Map</Text>
              <Text style={styles.navCardDesc}>View all station locations</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navCard}
              onPress={() => navigateToSection("charts")}
            >
              <Ionicons name="bar-chart" size={30} color="#4CAF50" />
              <Text style={styles.navCardTitle}>Analytics</Text>
              <Text style={styles.navCardDesc}>View trends and insights</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navCard}
              onPress={() => navigateToSection("predictions")}
            >
              <Ionicons name="analytics" size={30} color="#FF9800" />
              <Text style={styles.navCardTitle}>Forecast</Text>
              <Text style={styles.navCardDesc}>Predictive analysis</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Last updated: September 27, 2025
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#666",
  },
  header: {
    backgroundColor: "#2196F3",
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  headerTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
  },
  welcomeSection: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  welcomeText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  statsContainer: {
    padding: 10,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 5,
  },
  alertCard: {
    backgroundColor: "#fff8e1",
    borderLeftWidth: 4,
    borderLeftColor: "#ffc107",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2196F3",
  },
  alertValue: {
    color: "#f57c00",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
  },
  chartCard: {
    backgroundColor: "#fff",
    margin: 10,
    padding: 15,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  readingsCard: {
    backgroundColor: "#fff",
    margin: 10,
    padding: 15,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  readingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  readingMain: {
    flex: 2,
  },
  readingStation: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  readingId: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  readingDetails: {
    flex: 1,
    alignItems: "flex-end",
  },
  readingLevel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2196F3",
  },
  readingTime: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  quickAccessContainer: {
    backgroundColor: "#fff",
    margin: 10,
    padding: 15,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  navGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  navCard: {
    width: "31%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    marginBottom: 10,
  },
  navCardTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 5,
    color: "#333",
  },
  navCardDesc: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  footer: {
    alignItems: "center",
    padding: 20,
  },
  footerText: {
    color: "#999",
    fontSize: 12,
  },
});
