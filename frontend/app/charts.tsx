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
import { MOCK_STATIONS, DWLRStation } from "../data/mockStations";
import FilterSearch from "../components/FilterSearch";

const screenWidth = Dimensions.get("window").width;

export default function ChartsScreen() {
  const [loading, setLoading] = useState(true);
  const [filteredStations, setFilteredStations] =
    useState<DWLRStation[]>(MOCK_STATIONS);
  const [selectedStationIndex, setSelectedStationIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("waterLevel");

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleFilter = (stations: DWLRStation[]) => {
    setFilteredStations(stations);
    if (stations.length > 0) {
      setSelectedStationIndex(0);
    }
  };

  const handleSearch = (term: string) => {
    // Search functionality is handled in FilterSearch component
  };

  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 1,
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

  const getQualityColor = (status: string): string => {
    switch (status) {
      case "excellent":
        return "#4CAF50";
      case "good":
        return "#8BC34A";
      case "fair":
        return "#FFC107";
      case "poor":
        return "#F44336";
      default:
        return "#2196F3";
    }
  };

  // Chart data preparation functions
  const prepareWaterLevelData = () => {
    if (
      filteredStations.length === 0 ||
      !filteredStations[selectedStationIndex]
    ) {
      return { labels: ["No Data"], datasets: [{ data: [0] }] };
    }

    const station = filteredStations[selectedStationIndex];
    const recentData = station.historical_data.slice(-7);

    return {
      labels: recentData.map((d) =>
        new Date(d.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      ),
      datasets: [{ data: recentData.map((d) => d.level) }],
    };
  };

  const preparePHData = () => {
    if (
      filteredStations.length === 0 ||
      !filteredStations[selectedStationIndex]
    ) {
      return { labels: ["No Data"], datasets: [{ data: [0] }] };
    }

    const station = filteredStations[selectedStationIndex];
    const recentData = station.historical_data.slice(-7);

    return {
      labels: recentData.map((d) =>
        new Date(d.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      ),
      datasets: [{ data: recentData.map((d) => d.pH) }],
    };
  };

  const prepareDissolvedOxygenData = () => {
    if (
      filteredStations.length === 0 ||
      !filteredStations[selectedStationIndex]
    ) {
      return { labels: ["No Data"], datasets: [{ data: [0] }] };
    }

    const station = filteredStations[selectedStationIndex];
    const recentData = station.historical_data.slice(-7);

    return {
      labels: recentData.map((d) =>
        new Date(d.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      ),
      datasets: [{ data: recentData.map((d) => d.dissolved_oxygen) }],
    };
  };

  const prepareTemperatureData = () => {
    if (
      filteredStations.length === 0 ||
      !filteredStations[selectedStationIndex]
    ) {
      return { labels: ["No Data"], datasets: [{ data: [0] }] };
    }

    const station = filteredStations[selectedStationIndex];
    const recentData = station.historical_data.slice(-7);

    return {
      labels: recentData.map((d) =>
        new Date(d.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      ),
      datasets: [{ data: recentData.map((d) => d.temperature) }],
    };
  };

  const prepareRainfallData = () => {
    if (
      filteredStations.length === 0 ||
      !filteredStations[selectedStationIndex]
    ) {
      return { labels: ["No Data"], datasets: [{ data: [0] }] };
    }

    const station = filteredStations[selectedStationIndex];
    const recentData = station.historical_data.slice(-7);

    return {
      labels: recentData.map((d) =>
        new Date(d.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      ),
      datasets: [{ data: recentData.map((d) => d.rainfall) }],
    };
  };

  const nextStation = () => {
    if (filteredStations.length > 0) {
      setSelectedStationIndex((prevIndex) =>
        prevIndex === filteredStations.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  const prevStation = () => {
    if (filteredStations.length > 0) {
      setSelectedStationIndex((prevIndex) =>
        prevIndex === 0 ? filteredStations.length - 1 : prevIndex - 1
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading Chart Data...</Text>
      </SafeAreaView>
    );
  }

  if (filteredStations.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <FilterSearch
          stations={MOCK_STATIONS}
          onFilter={handleFilter}
          onSearch={handleSearch}
        />
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>
            No stations match your search criteria
          </Text>
          <Text style={styles.noDataSubtext}>
            Try adjusting your filters or search terms
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const selectedStation = filteredStations[selectedStationIndex];

  return (
    <SafeAreaView style={styles.container}>
      <FilterSearch
        stations={MOCK_STATIONS}
        onFilter={handleFilter}
        onSearch={handleSearch}
      />

      <ScrollView style={styles.scrollView}>
        {/* Filter Results Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Filtered Results</Text>
          <Text style={styles.summaryText}>
            Showing {filteredStations.length} out of {MOCK_STATIONS.length}{" "}
            stations
          </Text>
        </View>

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
            style={[styles.tab, activeTab === "waterLevel" && styles.activeTab]}
            onPress={() => setActiveTab("waterLevel")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "waterLevel" && styles.activeTabText,
              ]}
            >
              Water Level
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "pH" && styles.activeTab]}
            onPress={() => setActiveTab("pH")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "pH" && styles.activeTabText,
              ]}
            >
              pH
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "oxygen" && styles.activeTab]}
            onPress={() => setActiveTab("oxygen")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "oxygen" && styles.activeTabText,
              ]}
            >
              Diss. Oxygen
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "climate" && styles.activeTab]}
            onPress={() => setActiveTab("climate")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "climate" && styles.activeTabText,
              ]}
            >
              Climate
            </Text>
          </TouchableOpacity>
        </View>

        {/* Chart Content based on Tab */}
        <View style={styles.chartContainer}>
          {activeTab === "waterLevel" && (
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>
                Water Level Trend (Last 7 Days)
              </Text>
              <LineChart
                data={prepareWaterLevelData()}
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
                over the past week.
              </Text>
            </View>
          )}

          {activeTab === "pH" && (
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>pH Levels (Last 7 Days)</Text>
              <LineChart
                data={preparePHData()}
                width={screenWidth - 40}
                height={220}
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => `rgba(75, 192, 192, ${opacity})`,
                }}
                bezier
                style={styles.chart}
              />
              <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>Current pH:</Text>
                <Text style={styles.infoValue}>
                  {selectedStation.water_quality.pH.toFixed(1)}
                </Text>
                <Text style={styles.infoNote}>
                  Ideal pH range for groundwater is 6.5-8.5.
                </Text>
              </View>
            </View>
          )}

          {activeTab === "oxygen" && (
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>
                Dissolved Oxygen (Last 7 Days)
              </Text>
              <LineChart
                data={prepareDissolvedOxygenData()}
                width={screenWidth - 40}
                height={220}
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => `rgba(255, 159, 64, ${opacity})`,
                }}
                bezier
                style={styles.chart}
                yAxisSuffix=" mg/L"
              />
              <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>Current Dissolved Oxygen:</Text>
                <Text style={styles.infoValue}>
                  {selectedStation.water_quality.dissolved_oxygen.toFixed(1)}{" "}
                  mg/L
                </Text>
                <Text style={styles.infoNote}>
                  Healthy water typically has oxygen levels above 6.0 mg/L.
                </Text>
              </View>
            </View>
          )}

          {activeTab === "climate" && (
            <View>
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Temperature (°C)</Text>
                <LineChart
                  data={prepareTemperatureData()}
                  width={screenWidth - 40}
                  height={180}
                  chartConfig={{
                    ...chartConfig,
                    color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
                  }}
                  bezier
                  style={styles.chart}
                  yAxisSuffix="°C"
                />
              </View>

              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Rainfall (mm)</Text>
                <BarChart
                  data={prepareRainfallData()}
                  width={screenWidth - 40}
                  height={180}
                  chartConfig={{
                    ...chartConfig,
                    color: (opacity = 1) => `rgba(54, 162, 235, ${opacity})`,
                  }}
                  style={styles.chart}
                  yAxisLabel=""
                  yAxisSuffix="mm"
                />
                <Text style={styles.chartDescription}>
                  Rainfall patterns affect groundwater recharge rates.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Water Quality Section */}
        <View style={styles.insightContainer}>
          <Text style={styles.insightTitle}>Water Quality Assessment</Text>

          <View style={styles.qualityCard}>
            <View style={styles.qualityHeader}>
              <Text style={styles.qualityHeading}>Overall Quality:</Text>
              <View
                style={[
                  styles.qualityBadge,
                  {
                    backgroundColor: getQualityColor(
                      selectedStation.water_quality.status
                    ),
                  },
                ]}
              >
                <Text style={styles.qualityBadgeText}>
                  {selectedStation.water_quality.status.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.qualityMetrics}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Quality Index</Text>
                <Text style={styles.metricValue}>
                  {selectedStation.water_quality.quality_index}/100
                </Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>pH Level</Text>
                <Text style={styles.metricValue}>
                  {selectedStation.water_quality.pH.toFixed(1)}
                </Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Dissolved O₂</Text>
                <Text style={styles.metricValue}>
                  {selectedStation.water_quality.dissolved_oxygen.toFixed(1)}{" "}
                  mg/L
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Data last updated:{" "}
            {new Date(selectedStation.last_updated).toDateString()}
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
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: "#666",
  },
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  noDataText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
    textAlign: "center",
    marginBottom: 10,
  },
  noDataSubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  summaryCard: {
    backgroundColor: "#fff",
    margin: 10,
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  summaryText: {
    fontSize: 14,
    color: "#666",
  },
  stationSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 10,
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
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
    color: "#333",
  },
  stationInfo: {
    flex: 1,
    paddingHorizontal: 10,
  },
  stationName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  stationLocation: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  levelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  levelLabel: {
    fontSize: 14,
    color: "#666",
  },
  levelValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginRight: 10,
  },
  trendBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  trendText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#2196F3",
  },
  tabText: {
    fontSize: 13,
    color: "#666",
  },
  activeTabText: {
    color: "#2196F3",
    fontWeight: "bold",
  },
  chartContainer: {
    marginBottom: 10,
  },
  chartCard: {
    backgroundColor: "#fff",
    marginHorizontal: 10,
    marginBottom: 10,
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  chart: {
    marginVertical: 10,
    borderRadius: 10,
  },
  chartDescription: {
    fontSize: 14,
    color: "#666",
    marginTop: 10,
  },
  infoBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 5,
    borderLeftWidth: 3,
    borderLeftColor: "#2196F3",
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  infoValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2196F3",
    marginVertical: 5,
  },
  infoNote: {
    fontSize: 12,
    color: "#666",
  },
  insightContainer: {
    marginHorizontal: 10,
    marginBottom: 20,
  },
  insightTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    marginLeft: 5,
  },
  qualityCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  qualityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  qualityHeading: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  qualityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 15,
  },
  qualityBadgeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  qualityMetrics: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metricItem: {
    alignItems: "center",
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  footer: {
    padding: 15,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#999",
  },
});
