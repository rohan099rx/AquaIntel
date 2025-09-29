import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { LineChart, BarChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";

// Forecast data
const FORECAST_DATA = {
  nationalTrend: {
    current: 14.3,
    oneYear: 14.1,
    threeYear: 13.7,
    fiveYear: 13.2,
  },
  labels: ["Current", "1 Year", "3 Years", "5 Years"],
  datasets: [
    {
      data: [14.3, 14.1, 13.7, 13.2],
    },
  ],
  stateForecasts: [
    { state: "Maharashtra", current: 12.5, fiveYear: 11.8, change: -5.6 },
    { state: "Karnataka", current: 8.3, fiveYear: 7.5, change: -9.6 },
    { state: "Delhi", current: 15.7, fiveYear: 14.2, change: -9.5 },
    { state: "Tamil Nadu", current: 6.2, fiveYear: 5.7, change: -8.1 },
    { state: "Rajasthan", current: 22.8, fiveYear: 19.5, change: -14.5 },
  ],
  // Monthly forecast - 6 months
  monthlyForecast: {
    labels: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
    datasets: [
      {
        data: [14.2, 14.1, 14.0, 13.9, 13.8, 13.7],
      },
    ],
  },
  // Weekly forecast - 5 days
  fiveDayForecast: {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    datasets: [
      {
        data: [14.3, 14.28, 14.27, 14.25, 14.23],
      },
    ],
  },
  // Weekly forecast - 7 days
  sevenDayForecast: {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        data: [14.3, 14.28, 14.27, 14.25, 14.23, 14.22, 14.2],
      },
    ],
  },
  impactFactors: [
    {
      factor: "Climate Change",
      impact: "High",
      description: "Changing rainfall patterns",
    },
    {
      factor: "Agricultural Usage",
      impact: "Very High",
      description: "Increasing irrigation demand",
    },
    {
      factor: "Urbanization",
      impact: "Medium",
      description: "Reducing natural recharge areas",
    },
    {
      factor: "Industrial Usage",
      impact: "High",
      description: "Increasing extraction for manufacturing",
    },
  ],
};

export default function Predictions() {
  const [loading, setLoading] = useState(true);
  const [forecastData, setForecastData] = useState(FORECAST_DATA);
  const [selectedTimeframe, setSelectedTimeframe] = useState<
    "5day" | "7day" | "monthly"
  >("monthly");
  const [selectedYearframe, setSelectedYearframe] = useState<
    "oneYear" | "threeYear" | "fiveYear"
  >("fiveYear");
  const screenWidth = Dimensions.get("window").width;

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 1,
  };

  const getChangeColor = (change: number) => {
    return change < 0 ? "#F44336" : change > 0 ? "#4CAF50" : "#FF9800";
  };

  const getImpactColor = (impact: string) => {
    switch (impact.toLowerCase()) {
      case "very high":
        return "#D32F2F";
      case "high":
        return "#F44336";
      case "medium":
        return "#FF9800";
      case "low":
        return "#4CAF50";
      default:
        return "#2196F3";
    }
  };

  const getForecastChartData = () => {
    switch (selectedTimeframe) {
      case "5day":
        return forecastData.fiveDayForecast;
      case "7day":
        return forecastData.sevenDayForecast;
      case "monthly":
      default:
        return forecastData.monthlyForecast;
    }
  };

  const getLongTermChangePercent = () => {
    const current = forecastData.nationalTrend.current;
    const future = forecastData.nationalTrend[selectedYearframe];
    return (((current - future) / current) * 100).toFixed(1);
  };

  const getLongTermFutureValue = () => {
    return forecastData.nationalTrend[selectedYearframe];
  };

  const getYearFrameLabel = () => {
    switch (selectedYearframe) {
      case "oneYear":
        return "1 year";
      case "threeYear":
        return "3 years";
      case "fiveYear":
        return "5 years";
      default:
        return "5 years";
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading forecast data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Water Level Forecasts</Text>
        </View>

        {/* Long-term Forecast */}
        <View style={styles.forecastCard}>
          <Text style={styles.cardTitle}>Long-term Projection</Text>

          <View style={styles.timeframeSelector}>
            <TouchableOpacity
              style={[
                styles.timeframeButton,
                selectedYearframe === "oneYear" && styles.activeTimeframe,
              ]}
              onPress={() => setSelectedYearframe("oneYear")}
            >
              <Text
                style={[
                  styles.timeframeText,
                  selectedYearframe === "oneYear" && styles.activeTimeframeText,
                ]}
              >
                1 Year
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.timeframeButton,
                selectedYearframe === "threeYear" && styles.activeTimeframe,
              ]}
              onPress={() => setSelectedYearframe("threeYear")}
            >
              <Text
                style={[
                  styles.timeframeText,
                  selectedYearframe === "threeYear" &&
                    styles.activeTimeframeText,
                ]}
              >
                3 Years
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.timeframeButton,
                selectedYearframe === "fiveYear" && styles.activeTimeframe,
              ]}
              onPress={() => setSelectedYearframe("fiveYear")}
            >
              <Text
                style={[
                  styles.timeframeText,
                  selectedYearframe === "fiveYear" &&
                    styles.activeTimeframeText,
                ]}
              >
                5 Years
              </Text>
            </TouchableOpacity>
          </View>

          <LineChart
            data={{
              labels: ["Current", getYearFrameLabel()],
              datasets: [
                {
                  data: [
                    forecastData.nationalTrend.current,
                    getLongTermFutureValue(),
                  ],
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
          <View style={styles.insightContainer}>
            <Text style={styles.insightText}>
              National average water level is predicted to
              <Text style={styles.highlightText}>
                {" "}
                decrease by {getLongTermChangePercent()}%{" "}
              </Text>
              over the next {getYearFrameLabel()}, from{" "}
              {forecastData.nationalTrend.current}m to{" "}
              {getLongTermFutureValue()}m.
            </Text>
          </View>
        </View>

        {/* Short-term Forecast */}
        <View style={styles.forecastCard}>
          <Text style={styles.cardTitle}>Short-term Forecast</Text>

          <View style={styles.timeframeSelector}>
            <TouchableOpacity
              style={[
                styles.timeframeButton,
                selectedTimeframe === "5day" && styles.activeTimeframe,
              ]}
              onPress={() => setSelectedTimeframe("5day")}
            >
              <Text
                style={[
                  styles.timeframeText,
                  selectedTimeframe === "5day" && styles.activeTimeframeText,
                ]}
              >
                5 Day
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.timeframeButton,
                selectedTimeframe === "7day" && styles.activeTimeframe,
              ]}
              onPress={() => setSelectedTimeframe("7day")}
            >
              <Text
                style={[
                  styles.timeframeText,
                  selectedTimeframe === "7day" && styles.activeTimeframeText,
                ]}
              >
                7 Day
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.timeframeButton,
                selectedTimeframe === "monthly" && styles.activeTimeframe,
              ]}
              onPress={() => setSelectedTimeframe("monthly")}
            >
              <Text
                style={[
                  styles.timeframeText,
                  selectedTimeframe === "monthly" && styles.activeTimeframeText,
                ]}
              >
                Monthly
              </Text>
            </TouchableOpacity>
          </View>

          <LineChart
            data={getForecastChartData()}
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
        </View>

        {/* State-wise Forecast */}
        <View style={styles.forecastCard}>
          <Text style={styles.cardTitle}>State-wise 5-Year Projections</Text>
          <View style={styles.stateTable}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>State</Text>
              <Text style={styles.tableHeaderCell}>Current</Text>
              <Text style={styles.tableHeaderCell}>5-Year</Text>
              <Text style={styles.tableHeaderCell}>Change</Text>
            </View>

            {forecastData.stateForecasts.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2 }]}>
                  {item.state}
                </Text>
                <Text style={styles.tableCell}>{item.current}m</Text>
                <Text style={styles.tableCell}>{item.fiveYear}m</Text>
                <Text
                  style={[
                    styles.tableCell,
                    { color: getChangeColor(item.change) },
                  ]}
                >
                  {item.change}%
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Impact Factors */}
        <View style={styles.forecastCard}>
          <Text style={styles.cardTitle}>Impact Factors</Text>
          {forecastData.impactFactors.map((factor, index) => (
            <View key={index} style={styles.impactItem}>
              <View style={styles.impactHeader}>
                <Text style={styles.impactFactor}>{factor.factor}</Text>
                <View
                  style={[
                    styles.impactBadge,
                    { backgroundColor: getImpactColor(factor.impact) },
                  ]}
                >
                  <Text style={styles.impactLevel}>{factor.impact}</Text>
                </View>
              </View>
              <Text style={styles.impactDescription}>{factor.description}</Text>
            </View>
          ))}
        </View>

        {/* Recommendations */}
        <View style={styles.forecastCard}>
          <Text style={styles.cardTitle}>Recommendations</Text>
          <View style={styles.recommendationItem}>
            <Text style={styles.recommendationTitle}>Water Conservation</Text>
            <Text style={styles.recommendationText}>
              Implement stricter water conservation policies in high-risk areas,
              particularly in Maharashtra and Rajasthan.
            </Text>
          </View>
          <View style={styles.recommendationItem}>
            <Text style={styles.recommendationTitle}>
              Agricultural Practices
            </Text>
            <Text style={styles.recommendationText}>
              Promote drip irrigation and less water-intensive crops to reduce
              agricultural water usage.
            </Text>
          </View>
          <View style={styles.recommendationItem}>
            <Text style={styles.recommendationTitle}>Recharge Zones</Text>
            <Text style={styles.recommendationText}>
              Protect and enhance natural groundwater recharge zones in urban
              areas through improved planning.
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Forecast models last updated: September 25, 2025
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
    padding: 20,
    backgroundColor: "#2196F3",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    marginTop: 5,
  },
  forecastCard: {
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
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    textAlign: "center",
  },
  timeframeSelector: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 15,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 4,
  },
  timeframeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  activeTimeframe: {
    backgroundColor: "#2196F3",
  },
  timeframeText: {
    color: "#666",
    fontWeight: "500",
  },
  activeTimeframeText: {
    color: "#fff",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  insightContainer: {
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    marginTop: 10,
  },
  insightText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  highlightText: {
    fontWeight: "bold",
    color: "#F44336",
  },
  stateTable: {
    marginVertical: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    paddingVertical: 12,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  tableHeaderCell: {
    flex: 1,
    fontWeight: "bold",
    fontSize: 14,
    color: "#555",
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  tableCell: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    textAlign: "center",
  },
  impactItem: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
  },
  impactHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  impactFactor: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  impactBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  impactLevel: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "bold",
  },
  impactDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  recommendationItem: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  recommendationText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
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
