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
import { LineChart, BarChart, PieChart } from "react-native-chart-kit";
import {
  MOCK_STATIONS,
  getStateStatistics,
  getStationsByTrend,
  getAverageWaterLevel,
} from "../data/mockStations";

export default function ChartsScreen() {
  const [loading, setLoading] = useState(true);
  const [selectedStationIndex, setSelectedStationIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const screenWidth = Dimensions.get("window").width;

  useEffect(() => {
    // Simulate loading for demo
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const selectedStation = MOCK_STATIONS[selectedStationIndex];
  const stateStats = getStateStatistics();
  const averageLevel = getAverageWaterLevel();

  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 1,
  };

  // Prepare trend distribution data
  const prepareTrendData = () => {
    const risingCount = getStationsByTrend("rising").length;
    const fallingCount = getStationsByTrend("falling").length;
    const stableCount = getStationsByTrend("stable").length;

    return [
      {
        name: "Rising",
        population: risingCount,
        color: "#4CAF50",
        legendFontColor: "#7F7F7F",
        legendFontSize: 15,
      },
      {
        name: "Falling",
        population: fallingCount,
        color: "#F44336",
        legendFontColor: "#7F7F7F",
        legendFontSize: 15,
      },
      {
        name: "Stable",
        population: stableCount,
        color: "#2196F3",
        legendFontColor: "#7F7F7F",
        legendFontSize: 15,
      },
    ];
  };

  // Prepare state comparison data
  const prepareStateComparisonData = () => {
    const topStates = stateStats.slice(0, 8); // Top 8 states
    return {
      labels: topStates.map((s) => s.state.substring(0, 8)),
      datasets: [
        {
          data: topStates.map((s) => s.averageLevel),
        },
      ],
    };
  };

  // Prepare monthly trend data for selected station
  const prepareMonthlyData = () => {
    const monthlyData = selectedStation.historical_data.slice(-30); // Last 30 days
    const groupedByWeek: { [key: string]: number[] } = {};

    monthlyData.forEach((data) => {
      const week = Math.floor(new Date(data.date).getDate() / 7);
      const weekKey = `Week ${week + 1}`;
      if (!groupedByWeek[weekKey]) {
        groupedByWeek[weekKey] = [];
      }
      groupedByWeek[weekKey].push(data.level);
    });

    const labels = Object.keys(groupedByWeek);
    const averages = labels.map((week) => {
      const values = groupedByWeek[week];
      return values.reduce((sum, val) => sum + val, 0) / values.length;
    });

    return {
      labels,
      datasets: [{ data: averages }],
    };
  };

  // Prepare water quality distribution
  const prepareQualityData = () => {
    const qualityCounts = { excellent: 0, good: 0, fair: 0, poor: 0 };
    MOCK_STATIONS.forEach((station) => {
      qualityCounts[station.water_quality.status]++;
    });

    return [
      {
        name: "Excellent",
        population: qualityCounts.excellent,
        color: "#4CAF50",
        legendFontColor: "#7F7F7F",
        legendFontSize: 12,
      },
      {
        name: "Good",
        population: qualityCounts.good,
        color: "#8BC34A",
        legendFontColor: "#7F7F7F",
        legendFontSize: 12,
      },
      {
        name: "Fair",
        population: qualityCounts.fair,
        color: "#FFC107",
        legendFontColor: "#7F7F7F",
        legendFontSize: 12,
      },
      {
        name: "Poor",
        population: qualityCounts.poor,
        color: "#F44336",
        legendFontColor: "#7F7F7F",
        legendFontSize: 12,
      },
    ];
  };

  const getTrendColor = (trend: string): string => {
    switch (trend) {
      case "rising":
        return "#4CAF50";
      case "falling":
        return "#F44336";
      case "stable":
        return "#FF9800";
      default:
        return "#2196F3";
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
        <Text style={styles.loadingText}>Loading Analytics Data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>DWLR Analytics Dashboard</Text>
        <Text style={styles.headerSubtitle}>100 Monitoring Stations</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Summary Stats */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{MOCK_STATIONS.length}</Text>
              <Text style={styles.statLabel}>Total Stations</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {MOCK_STATIONS.filter((s) => s.status === "active").length}
              </Text>
              <Text style={styles.statLabel}>Active Stations</Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{averageLevel}m</Text>
              <Text style={styles.statLabel}>Average Level</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stateStats.length}</Text>
              <Text style={styles.statLabel}>States Covered</Text>
            </View>
          </View>
        </View>

        {/* Chart Type Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "overview" && styles.activeTab]}
            onPress={() => setActiveTab("overview")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "overview" && styles.activeTabText,
              ]}
            >
              Overview
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "stations" && styles.activeTab]}
            onPress={() => setActiveTab("stations")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "stations" && styles.activeTabText,
              ]}
            >
              Stations
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "regional" && styles.activeTab]}
            onPress={() => setActiveTab("regional")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "regional" && styles.activeTabText,
              ]}
            >
              Regional
            </Text>
          </TouchableOpacity>
        </View>

        {/* Chart Content */}
        <View style={styles.chartContainer}>
          {activeTab === "overview" && (
            <>
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>
                  Water Level Trend Distribution
                </Text>
                <PieChart
                  data={prepareTrendData()}
                  width={screenWidth - 40}
                  height={220}
                  chartConfig={chartConfig}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                />
                <Text style={styles.chartDescription}>
                  Distribution of water level trends across all{" "}
                  {MOCK_STATIONS.length} monitoring stations.
                </Text>
              </View>

              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>
                  Water Quality Distribution
                </Text>
                <PieChart
                  data={prepareQualityData()}
                  width={screenWidth - 40}
                  height={220}
                  chartConfig={chartConfig}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                />
                <Text style={styles.chartDescription}>
                  Overall water quality assessment across all monitoring
                  stations.
                </Text>
              </View>
            </>
          )}

          {activeTab === "stations" && (
            <>
              {/* Station Selector */}
              <View style={styles.stationSelector}>
                <TouchableOpacity
                  onPress={prevStation}
                  style={styles.navButton}
                >
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
                        {
                          backgroundColor: getTrendColor(selectedStation.trend),
                        },
                      ]}
                    >
                      <Text style={styles.trendText}>
                        {selectedStation.trend}
                      </Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={nextStation}
                  style={styles.navButton}
                >
                  <Text style={styles.navButtonText}>▶</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>
                  Monthly Trend - {selectedStation.name}
                </Text>
                <LineChart
                  data={prepareMonthlyData()}
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
                  Weekly average water levels for the selected station over the
                  past month.
                </Text>
              </View>

              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Water Quality Metrics</Text>
                <View style={styles.qualityMetrics}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>pH Level</Text>
                    <Text style={styles.metricValue}>
                      {selectedStation.water_quality.pH.toFixed(1)}
                    </Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Dissolved Oxygen</Text>
                    <Text style={styles.metricValue}>
                      {selectedStation.water_quality.dissolved_oxygen.toFixed(
                        1
                      )}{" "}
                      mg/L
                    </Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Quality Index</Text>
                    <Text style={styles.metricValue}>
                      {selectedStation.water_quality.quality_index}/100
                    </Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Status</Text>
                    <Text
                      style={[
                        styles.metricValue,
                        { color: getTrendColor(selectedStation.trend) },
                      ]}
                    >
                      {selectedStation.water_quality.status}
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}

          {activeTab === "regional" && (
            <>
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>
                  Average Water Levels by State
                </Text>
                <BarChart
                  data={prepareStateComparisonData()}
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
                  Comparison of average water levels across different states.
                </Text>
              </View>

              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>
                  State-wise Station Distribution
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.stateTable}>
                    <View style={styles.tableHeader}>
                      <Text style={styles.tableHeaderCell}>State</Text>
                      <Text style={styles.tableHeaderCell}>Stations</Text>
                      <Text style={styles.tableHeaderCell}>Avg Level</Text>
                    </View>
                    {stateStats.map((stat, index) => (
                      <View key={index} style={styles.tableRow}>
                        <Text style={styles.tableCell}>{stat.state}</Text>
                        <Text style={styles.tableCell}>
                          {stat.stationCount}
                        </Text>
                        <Text style={styles.tableCell}>
                          {stat.averageLevel}m
                        </Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Data from {MOCK_STATIONS.length} DWLR stations across India
          </Text>
          <Text style={styles.footerText}>
            Last updated: {new Date().toLocaleDateString()}
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
    backgroundColor: "#2196F3",
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  headerSubtitle: {
    color: "#fff",
    fontSize: 14,
    opacity: 0.8,
    marginTop: 5,
  },
  scrollView: {
    flex: 1,
  },
  summaryContainer: {
    padding: 10,
  },
  summaryRow: {
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2196F3",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
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
    marginBottom: 15,
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
  stationSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
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
    fontSize: 16,
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
  qualityMetrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
  metricItem: {
    alignItems: "center",
    marginVertical: 10,
    minWidth: "40%",
  },
  metricLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  stateTable: {
    minWidth: 300,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  tableHeaderCell: {
    flex: 1,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  tableCell: {
    flex: 1,
    textAlign: "center",
    color: "#666",
  },
  footer: {
    padding: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
  },
});
