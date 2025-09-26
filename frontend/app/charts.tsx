import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert
} from 'react-native';
import { LineChart, BarChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

interface GroundwaterStation {
  station_id: string;
  name: string;
  state: string;
  district: string;
  current_level: number;
  trend: string;
  historical_data?: Array<{
    date: string;
    level: number;
    temperature: number;
    rainfall: number;
  }>;
}

interface ChartDataPoint {
  value: number;
  label?: string;
  labelTextStyle?: any;
  dataPointText?: string;
  textColor?: string;
  textShiftY?: number;
  textShiftX?: number;
}

interface PredictionPoint {
  date: string;
  predicted_level: number;
  confidence: number;
  lower_bound: number;
  upper_bound: number;
}

export default function ChartsScreen() {
  const [stations, setStations] = useState<GroundwaterStation[]>([]);
  const [selectedStation, setSelectedStation] = useState<GroundwaterStation | null>(null);
  const [predictions, setPredictions] = useState<PredictionPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'levels' | 'trends' | 'predictions' | 'rainfall'>('levels');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    loadStations();
  }, []);

  useEffect(() => {
    if (selectedStation && chartType === 'predictions') {
      loadPredictions(selectedStation.station_id);
    }
  }, [selectedStation, chartType]);

  const loadStations = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/stations`);
      if (response.ok) {
        const data = await response.json();
        setStations(data);
        if (data.length > 0) {
          setSelectedStation(data[0]);
        }
        await AsyncStorage.setItem('charts_stations', JSON.stringify(data));
      } else {
        const cached = await AsyncStorage.getItem('charts_stations');
        if (cached) {
          const data = JSON.parse(cached);
          setStations(data);
          if (data.length > 0) {
            setSelectedStation(data[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error loading stations:', error);
      const cached = await AsyncStorage.getItem('charts_stations');
      if (cached) {
        const data = JSON.parse(cached);
        setStations(data);
        if (data.length > 0) {
          setSelectedStation(data[0]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const loadPredictions = async (stationId: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/stations/${stationId}/predictions?days=30`);
      if (response.ok) {
        const data = await response.json();
        setPredictions(data.predictions || []);
      }
    } catch (error) {
      console.error('Error loading predictions:', error);
    }
  };

  const getFilteredHistoricalData = () => {
    if (!selectedStation?.historical_data) return [];
    
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    return selectedStation.historical_data
      .filter(point => new Date(point.date) >= cutoff)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const prepareLineChartData = (): ChartDataPoint[] => {
    const historicalData = getFilteredHistoricalData();
    
    if (chartType === 'levels') {
      return historicalData.map((point, index) => ({
        value: point.level,
        label: index % 5 === 0 ? new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
        labelTextStyle: { color: '#666', fontSize: 10 },
        dataPointText: point.level.toString(),
        textColor: '#2196F3',
        textShiftY: -10,
        textShiftX: -10
      }));
    } else if (chartType === 'rainfall') {
      return historicalData.map((point, index) => ({
        value: point.rainfall,
        label: index % 5 === 0 ? new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
        labelTextStyle: { color: '#666', fontSize: 10 },
        dataPointText: point.rainfall.toString(),
        textColor: '#4CAF50',
        textShiftY: -10,
        textShiftX: -10
      }));
    } else if (chartType === 'predictions' && predictions.length > 0) {
      return predictions.slice(0, 15).map((point, index) => ({
        value: point.predicted_level,
        label: index % 3 === 0 ? new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
        labelTextStyle: { color: '#666', fontSize: 10 },
        dataPointText: point.predicted_level.toFixed(1),
        textColor: '#FF9800',
        textShiftY: -10,
        textShiftX: -10
      }));
    }
    
    return [];
  };

  const prepareTrendsData = (): ChartDataPoint[] => {
    const trendCounts = stations.reduce((acc, station) => {
      acc[station.trend] = (acc[station.trend] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const colors = {
      rising: '#4CAF50',
      falling: '#F44336',
      stable: '#FF9800'
    };

    return Object.entries(trendCounts).map(([trend, count]) => ({
      value: count,
      label: trend.charAt(0).toUpperCase() + trend.slice(1),
      labelTextStyle: { color: '#666', fontSize: 12 },
      frontColor: colors[trend as keyof typeof colors] || '#2196F3'
    }));
  };

  const getStateAnalyticsData = (): ChartDataPoint[] => {
    const stateAverages = stations.reduce((acc, station) => {
      if (!acc[station.state]) {
        acc[station.state] = { total: 0, count: 0 };
      }
      acc[station.state].total += station.current_level;
      acc[station.state].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    return Object.entries(stateAverages)
      .map(([state, data]) => ({
        value: data.total / data.count,
        label: state.slice(0, 8),
        labelTextStyle: { color: '#666', fontSize: 10 },
        dataPointText: (data.total / data.count).toFixed(1),
        textColor: '#2196F3'
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  };

  const exportData = () => {
    Alert.alert(
      'Export Data',
      'Choose export format:',
      [
        { text: 'CSV Format', onPress: () => exportToCSV() },
        { text: 'PDF Report', onPress: () => exportToPDF() },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const exportToCSV = () => {
    Alert.alert('Export Success', 'Data exported to CSV format (feature simulated)');
  };

  const exportToPDF = () => {
    Alert.alert('Export Success', 'Report generated in PDF format (feature simulated)');
  };

  const renderChart = () => {
    if (chartType === 'trends') {
      const data = prepareTrendsData();
      return (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Trend Distribution Across All Stations</Text>
          <BarChart
            data={data}
            width={width - 80}
            height={250}
            barWidth={60}
            spacing={20}
            roundedTop
            roundedBottom
            hideRules
            xAxisThickness={0}
            yAxisThickness={1}
            yAxisTextStyle={{ color: '#666' }}
            noOfSections={5}
            maxValue={Math.max(...data.map(d => d.value)) + 2}
            isAnimated
            animationDuration={1000}
          />
        </View>
      );
    } else if (chartType === 'levels' || chartType === 'rainfall' || chartType === 'predictions') {
      const data = prepareLineChartData();
      const title = chartType === 'levels' ? 'Water Level Trends' : 
                   chartType === 'rainfall' ? 'Rainfall Data' : 
                   'Predicted Water Levels';
      const color = chartType === 'levels' ? '#2196F3' : 
                   chartType === 'rainfall' ? '#4CAF50' : '#FF9800';
      
      if (data.length === 0) {
        return (
          <View style={styles.noDataContainer}>
            <Ionicons name="bar-chart-outline" size={48} color="#ccc" />
            <Text style={styles.noDataText}>No data available for the selected range</Text>
          </View>
        );
      }

      return (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>
            {title} {selectedStation ? `- ${selectedStation.name}` : ''}
          </Text>
          <LineChart
            data={data}
            width={width - 80}
            height={250}
            spacing={Math.max(30, (width - 120) / data.length)}
            color={color}
            thickness={3}
            startFillColor={color}
            endFillColor={color}
            startOpacity={0.3}
            endOpacity={0.1}
            initialSpacing={0}
            noOfSections={6}
            maxValue={Math.max(...data.map(d => d.value)) + 5}
            yAxisColor="#666"
            yAxisThickness={1}
            rulesType="solid"
            rulesColor="#f0f0f0"
            yAxisTextStyle={{ color: '#666' }}
            xAxisColor="#666"
            pointerConfig={{
              pointerStripUptoDataPoint: true,
              pointerStripColor: 'lightgray',
              pointerStripWidth: 2,
              strokeDashArray: [2, 5],
              pointerColor: color,
              radius: 4,
              pointerLabelWidth: 100,
              pointerLabelHeight: 90,
              pointerLabelComponent: (items: any) => {
                return (
                  <View style={styles.pointerLabel}>
                    <Text style={styles.pointerText}>
                      {chartType === 'levels' ? 'Level: ' : chartType === 'rainfall' ? 'Rainfall: ' : 'Predicted: '}
                      {items[0].value}
                      {chartType === 'levels' || chartType === 'predictions' ? 'm' : 'mm'}
                    </Text>
                  </View>
                );
              },
            }}
            areaChart
            isAnimated
            animationDuration={1200}
          />
        </View>
      );
    }

    // State analytics chart
    const data = getStateAnalyticsData();
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Average Water Levels by State</Text>
        <BarChart
          data={data}
          width={width - 80}
          height={250}
          barWidth={40}
          spacing={15}
          roundedTop
          frontColor="#2196F3"
          hideRules
          xAxisThickness={0}
          yAxisThickness={1}
          yAxisTextStyle={{ color: '#666' }}
          noOfSections={5}
          maxValue={Math.max(...data.map(d => d.value)) + 5}
          isAnimated
          animationDuration={1000}
        />
      </View>
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Data Analytics</Text>
        <TouchableOpacity onPress={exportData} style={styles.exportButton}>
          <Ionicons name="download" size={24} color="#2196F3" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Station Selector */}
        {(chartType === 'levels' || chartType === 'rainfall' || chartType === 'predictions') && (
          <View style={styles.stationSelector}>
            <Text style={styles.selectorLabel}>Select Station:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {stations.map(station => (
                <TouchableOpacity
                  key={station.station_id}
                  style={[
                    styles.stationButton,
                    selectedStation?.station_id === station.station_id && styles.selectedStationButton
                  ]}
                  onPress={() => setSelectedStation(station)}
                >
                  <Text style={[
                    styles.stationButtonText,
                    selectedStation?.station_id === station.station_id && styles.selectedStationText
                  ]}>
                    {station.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Chart Type Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, chartType === 'levels' && styles.activeTab]}
            onPress={() => setChartType('levels')}
          >
            <Ionicons name="water" size={20} color={chartType === 'levels' ? '#fff' : '#666'} />
            <Text style={[styles.tabText, chartType === 'levels' && styles.activeTabText]}>Levels</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, chartType === 'trends' && styles.activeTab]}
            onPress={() => setChartType('trends')}
          >
            <Ionicons name="trending-up" size={20} color={chartType === 'trends' ? '#fff' : '#666'} />
            <Text style={[styles.tabText, chartType === 'trends' && styles.activeTabText]}>Trends</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, chartType === 'predictions' && styles.activeTab]}
            onPress={() => setChartType('predictions')}
          >
            <Ionicons name="analytics" size={20} color={chartType === 'predictions' ? '#fff' : '#666'} />
            <Text style={[styles.tabText, chartType === 'predictions' && styles.activeTabText]}>Forecast</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, chartType === 'rainfall' && styles.activeTab]}
            onPress={() => setChartType('rainfall')}
          >
            <Ionicons name="rainy" size={20} color={chartType === 'rainfall' ? '#fff' : '#666'} />
            <Text style={[styles.tabText, chartType === 'rainfall' && styles.activeTabText]}>Rainfall</Text>
          </TouchableOpacity>
        </View>

        {/* Time Range Selector */}
        {(chartType === 'levels' || chartType === 'rainfall') && (
          <View style={styles.timeRangeContainer}>
            <Text style={styles.selectorLabel}>Time Range:</Text>
            <View style={styles.timeRangeButtons}>
              {['7d', '30d', '90d'].map(range => (
                <TouchableOpacity
                  key={range}
                  style={[
                    styles.timeRangeButton,
                    timeRange === range && styles.activeTimeRange
                  ]}
                  onPress={() => setTimeRange(range as '7d' | '30d' | '90d')}
                >
                  <Text style={[
                    styles.timeRangeText,
                    timeRange === range && styles.activeTimeRangeText
                  ]}>
                    {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Chart */}
        {renderChart()}

        {/* Statistics Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Quick Statistics</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stations.length}</Text>
              <Text style={styles.statLabel}>Total Stations</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {stations.filter(s => s.trend === 'rising').length}
              </Text>
              <Text style={styles.statLabel}>Rising Trend</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {stations.filter(s => s.trend === 'falling').length}
              </Text>
              <Text style={styles.statLabel}>Falling Trend</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {(stations.reduce((acc, s) => acc + s.current_level, 0) / stations.length).toFixed(1)}m
              </Text>
              <Text style={styles.statLabel}>Average Level</Text>
            </View>
          </View>
        </View>

        {/* Predictions Info */}
        {chartType === 'predictions' && selectedStation && (
          <View style={styles.predictionsInfo}>
            <Text style={styles.predictionsTitle}>Forecast Information</Text>
            <Text style={styles.predictionsText}>
              • 30-day forecast using SARIMA-like algorithm
            </Text>
            <Text style={styles.predictionsText}>
              • Based on historical patterns and trends
            </Text>
            <Text style={styles.predictionsText}>
              • Confidence decreases over time
            </Text>
            <Text style={styles.predictionsText}>
              • Weather patterns and seasonal variations included
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  exportButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  stationSelector: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  stationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedStationButton: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  stationButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedStationText: {
    color: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  activeTab: {
    backgroundColor: '#2196F3',
  },
  tabText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
  timeRangeContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  timeRangeButtons: {
    flexDirection: 'row',
  },
  timeRangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activeTimeRange: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  timeRangeText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activeTimeRangeText: {
    color: '#fff',
  },
  chartContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDataText: {
    marginTop: 12,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  pointerLabel: {
    backgroundColor: '#fff',
    borderRadius: 4,
    padding: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  pointerText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  summaryContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  predictionsInfo: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  predictionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  predictionsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    lineHeight: 20,
  },
});