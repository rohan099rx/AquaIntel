import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LineChart, BarChart } from "react-native-chart-kit";

// Mock data for charts
const MOCK_STATIONS = [
  {
    station_id: "DWLR001",
    name: "Mumbai Central Station",
    state: "Maharashtra",
    district: "Mumbai",
    current_level: 12.5,
    trend: "rising",
    latitude: 19.076,
    longitude: 72.8777,
    historical_data: [10.2, 10.8, 11.5, 12.0, 12.5],
    monthly_data: [
      9.8, 10.2, 10.5, 10.9, 11.3, 11.8, 12.2, 12.5, 12.3, 12.1, 11.9, 11.7,
    ],
  },
  {
    station_id: "DWLR002",
    name: "Bangalore Main Station",
    state: "Karnataka",
    district: "Bangalore",
    current_level: 8.3,
    trend: "falling",
    latitude: 12.9716,
    longitude: 77.5946,
    historical_data: [10.1, 9.8, 9.2, 8.7, 8.3],
    monthly_data: [
      10.2, 10.0, 9.8, 9.6, 9.4, 9.2, 9.0, 8.8, 8.7, 8.6, 8.4, 8.3,
    ],
  },
  {
    station_id: "DWLR003",
    name: "Delhi DWLR Station",
    state: "Delhi",
    district: "New Delhi",
    current_level: 15.7,
    trend: "stable",
    latitude: 28.7041,
    longitude: 77.1025,
    historical_data: [15.5, 15.6, 15.7, 15.6, 15.7],
    monthly_data: [
      15.3, 15.4, 15.5, 15.5, 15.6, 15.7, 15.8, 15.7, 15.7, 15.6, 15.7, 15.7,
    ],
  },
  {
    station_id: "DWLR004",
    name: "Chennai Coastal Station",
    state: "Tamil Nadu",
    district: "Chennai",
    current_level: 6.2,
    trend: "rising",
    latitude: 13.0827,
    longitude: 80.2707,
    historical_data: [5.1, 5.4, 5.7, 6.0, 6.2],
    monthly_data: [4.8, 5.0, 5.2, 5.4, 5.6, 5.8, 6.0, 6.2, 6.3, 6.4, 6.3, 6.2],
  },
  {
    station_id: "DWLR005",
    name: "Jaipur Desert Station",
    state: "Rajasthan",
    district: "Jaipur",
    current_level: 22.8,
    trend: "falling",
    latitude: 26.9124,
    longitude: 75.7873,
    historical_data: [24.5, 24.0, 23.5, 23.1, 22.8],
    monthly_data: [
      25.0, 24.8, 24.5, 24.2, 24.0, 23.7, 23.5, 23.3, 23.1, 22.9, 22.8, 22.8,
    ],
  },
];

export default function ChartsScreen() {
  const [loading, setLoading] = useState(true);
  const [selectedStationIndex, setSelectedStationIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("yearly");
  const screenWidth = Dimensions.get("window").width;

  useEffect(() => {
    // Simulate loading for demo
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const selectedStation = MOCK_STATIONS[selectedStationIndex];

  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 1,
  };

  // Trend status color
  const getTrendColor = (trend: string): string => {
    switch (trend) {
      case "rising":
        return "#4CAF50"; // Green
      case "falling":
        return "#F44336"; // Red
      case "stable":
        return "#FF9800"; // Orange
      default:
        return "#2196F3"; // Blue
    }
  };

  const nextStation = () => {
    setSelectedStationIndex((prevIndex) =>
      prevIndex === MOCK_STATIONS.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevStation = () => {
    setSelectedStationIndex((prevIndex) =>
      prevIndex === 0 ? MOCK_STATIONS.length - 1 : prevIndex - 1
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading Chart Data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Groundwater Analytics</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Station Selector */}
        <View style={styles.stationSelector}>
          <TouchableOpacity onPress={prevStation} style={styles.navButton}>
            <Text style={styles.navButtonText}>◀</Text>
          </TouchableOpacity>

          <View style={styles.stationInfo}>
            <Text style={styles.stationName}>{selectedStation.name}</Text>
            <Text style={styles.stationLocation}>
              {selectedStation.district}, {selectedStation.state}
            </Text>
            <View style={styles.levelContainer}>
              <Text style={styles.levelLabel}>Current Level: </Text>
              <Text style={styles.levelValue}>
                {selectedStation.current_level}m
              </Text>
              <View
                style={[
                  styles.trendBadge,
                  { backgroundColor: getTrendColor(selectedStation.trend) },
                ]}
              >
                <Text style={styles.trendText}>{selectedStation.trend}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity onPress={nextStation} style={styles.navButton}>
            <Text style={styles.navButtonText}>▶</Text>
          </TouchableOpacity>
        </View>

        {/* Chart Type Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "yearly" && styles.activeTab]}
            onPress={() => setActiveTab("yearly")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "yearly" && styles.activeTabText,
              ]}
            >
              Yearly Trend
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "monthly" && styles.activeTab]}
            onPress={() => setActiveTab("monthly")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "monthly" && styles.activeTabText,
              ]}
            >
              Monthly Data
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "compare" && styles.activeTab]}
            onPress={() => setActiveTab("compare")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "compare" && styles.activeTabText,
              ]}
            >
              Compare
            </Text>
          </TouchableOpacity>
        </View>

        {/* Chart Content based on Tab */}
        <View style={styles.chartContainer}>
          {activeTab === "yearly" && (
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>5-Year Water Level Trend</Text>
              <LineChart
                data={{
                  labels: ["2021", "2022", "2023", "2024", "2025"],
                  datasets: [
                    {
                      data: selectedStation.historical_data,
                      color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                      strokeWidth: 2,
                    },
                  ],
                }}
                width={screenWidth - 40}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                yAxisSuffix="m"
              />
              <Text style={styles.chartDescription}>
                Water levels{" "}
                {selectedStation.trend === "rising"
                  ? "increased"
                  : selectedStation.trend === "falling"
                  ? "decreased"
                  : "remained stable"}{" "}
                over the past 5 years.
              </Text>
            </View>
          )}

          {activeTab === "monthly" && (
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Monthly Water Levels (2025)</Text>
              <LineChart
                data={{
                  labels: [
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "May",
                    "Jun",
                    "Jul",
                    "Aug",
                    "Sep",
                    "Oct",
                    "Nov",
                    "Dec",
                  ],
                  datasets: [
                    {
                      data: selectedStation.monthly_data,
                      color: (opacity = 1) => `rgba(75, 192, 192, ${opacity})`,
                      strokeWidth: 2,
                    },
                  ],
                }}
                width={screenWidth - 40}
                height={220}
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => `rgba(75, 192, 192, ${opacity})`,
                }}
                bezier
                style={styles.chart}
                yAxisSuffix="m"
              />
              <Text style={styles.chartDescription}>
                Monthly fluctuations showing {selectedStation.trend} trend in
                water levels throughout 2025.
              </Text>
            </View>
          )}

          {activeTab === "compare" && (
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Regional Comparison</Text>
              <BarChart
                data={{
                  labels: MOCK_STATIONS.map((s) => s.name.split(" ")[0]),
                  datasets: [
                    {
                      data: MOCK_STATIONS.map((s) => s.current_level),
                    },
                  ],
                }}
                width={screenWidth - 40}
                height={220}
                yAxisLabel=""
                yAxisSuffix="m"
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
                }}
                style={styles.chart}
                showValuesOnTopOfBars={true}
              />
              <Text style={styles.chartDescription}>
                Comparison of current water levels across different monitoring
                stations.
              </Text>
            </View>
          )}
        </View>

        {/* Insights and Analysis */}
        <View style={styles.insightContainer}>
          <Text style={styles.insightTitle}>Water Level Insights</Text>

          <View style={styles.insightCard}>
            <Text style={styles.insightHeading}>Trend Analysis</Text>
            <Text style={styles.insightText}>
              {selectedStation.trend === "rising"
                ? `Water levels at ${selectedStation.name} are rising, which may indicate increased rainfall or reduced extraction in the area.`
                : selectedStation.trend === "falling"
                ? `Water levels at ${selectedStation.name} are falling, suggesting potential over-extraction or reduced recharge in the area.`
                : `Water levels at ${selectedStation.name} are stable, indicating a balance between recharge and extraction.`}
            </Text>
          </View>

          <View style={styles.insightCard}>
            <Text style={styles.insightHeading}>Recommendations</Text>
            <Text style={styles.insightText}>
              {selectedStation.trend === "rising"
                ? "• Monitor for potential flooding risks\n• Consider increasing controlled extraction\n• Ensure proper drainage systems"
                : selectedStation.trend === "falling"
                ? "• Implement water conservation measures\n• Reduce extraction rates\n• Promote rainwater harvesting"
                : "• Maintain current water management practices\n• Continue regular monitoring\n• Implement sustainable usage policies"}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Data last updated: September 2025
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  scrollView: {
    flex: 1,
  },
  stationSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    margin: 10,
    padding: 15,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  navButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
  },
  navButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#555",
  },
  stationInfo: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 10,
  },
  stationName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  stationLocation: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  levelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  levelLabel: {
    fontSize: 14,
    color: "#666",
  },
  levelValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginRight: 5,
  },
  trendBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 5,
  },
  trendText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  tabsContainer: {
    flexDirection: "row",
    marginHorizontal: 10,
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#e0e0e0",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  activeTab: {
    backgroundColor: "#2196F3",
  },
  tabText: {
    fontWeight: "500",
    color: "#555",
  },
  activeTabText: {
    color: "#fff",
  },
  chartContainer: {
    padding: 10,
  },
  chartCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartDescription: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 10,
  },
  insightContainer: {
    padding: 10,
    marginTop: 5,
  },
  insightTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  insightCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  insightHeading: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  insightText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 22,
  },
  footer: {
    padding: 15,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
  },
});
