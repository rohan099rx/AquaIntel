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
  Alert,
} from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
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
  last_updated: string;
}

interface PredictionPoint {
  date: string;
  predicted_level: number;
  confidence: number;
  lower_bound: number;
  upper_bound: number;
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

export default function PredictionsScreen() {
  const [stations, setStations] = useState<GroundwaterStation[]>([]);
  const [selectedStation, setSelectedStation] = useState<GroundwaterStation | null>(null);
  const [predictions, setPredictions] = useState<PredictionPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [forecastDays, setForecastDays] = useState<number>(30);
  const [alertThresholds, setAlertThresholds] = useState({
    critical_low: 5,
    warning_low: 10,
    warning_high: 40,
    critical_high: 50
  });

  useEffect(() => {
    loadStations();
  }, []);

  useEffect(() => {
    if (selectedStation) {
      loadPredictions(selectedStation.station_id, forecastDays);
    }
  }, [selectedStation, forecastDays]);

  const loadStations = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/stations`);
      if (response.ok) {
        const data = await response.json();
        setStations(data);
        if (data.length > 0) {
          setSelectedStation(data[0]);
        }
        await AsyncStorage.setItem('predictions_stations', JSON.stringify(data));
      } else {
        const cached = await AsyncStorage.getItem('predictions_stations');
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
      const cached = await AsyncStorage.getItem('predictions_stations');
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

  const loadPredictions = async (stationId: string, days: number) => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/stations/${stationId}/predictions?days=${days}`);
      if (response.ok) {
        const data = await response.json();
        setPredictions(data.predictions || []);
      }
    } catch (error) {
      console.error('Error loading predictions:', error);
      Alert.alert('Error', 'Failed to load predictions. Using cached data if available.');
    } finally {
      setLoading(false);
    }
  };

  const preparePredictionChartData = (): ChartDataPoint[] => {
    return predictions.slice(0, 30).map((point, index) => ({
      value: point.predicted_level,
      label: index % 5 === 0 ? new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
      labelTextStyle: { color: '#666', fontSize: 10 },
      dataPointText: point.predicted_level.toFixed(1),
      textColor: getPredictionColor(point.predicted_level),
      textShiftY: -10,
      textShiftX: -10
    }));
  };

  const prepareConfidenceData = (): ChartDataPoint[] => {
    return predictions.slice(0, 30).map((point, index) => ({
      value: point.confidence * 100,
      label: index % 5 === 0 ? new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
      labelTextStyle: { color: '#666', fontSize: 10 },
    }));
  };

  const getPredictionColor = (level: number): string => {
    if (level < alertThresholds.critical_low) return '#D32F2F';
    if (level < alertThresholds.warning_low) return '#F57C00';
    if (level > alertThresholds.critical_high) return '#D32F2F';
    if (level > alertThresholds.warning_high) return '#F57C00';
    return '#388E3C';
  };

  const getAlertLevel = (level: number): string => {
    if (level < alertThresholds.critical_low || level > alertThresholds.critical_high) return 'Critical';
    if (level < alertThresholds.warning_low || level > alertThresholds.warning_high) return 'Warning';
    return 'Normal';
  };

  const generateReport = () => {
    if (!selectedStation || predictions.length === 0) {
      Alert.alert('No Data', 'Please select a station with prediction data to generate a report.');
      return;
    }

    const alerts = predictions.filter(p => {
      const level = p.predicted_level;
      return level < alertThresholds.warning_low || level > alertThresholds.warning_high;
    });

    const criticalAlerts = predictions.filter(p => {
      const level = p.predicted_level;
      return level < alertThresholds.critical_low || level > alertThresholds.critical_high;
    });

    Alert.alert(
      'Prediction Report',
      `Station: ${selectedStation.name}\n\n` +
      `Forecast Period: ${forecastDays} days\n` +
      `Current Level: ${selectedStation.current_level}m\n` +
      `Average Predicted Level: ${(predictions.reduce((acc, p) => acc + p.predicted_level, 0) / predictions.length).toFixed(2)}m\n\n` +
      `Alerts:\n` +
      `• Warning Level: ${alerts.length} days\n` +
      `• Critical Level: ${criticalAlerts.length} days\n\n` +
      `Recommendation: ${criticalAlerts.length > 5 ? 'Immediate intervention required' : 
        alerts.length > 10 ? 'Monitor closely' : 'Normal monitoring'}`
    );
  };

  const setCustomThreshold = () => {
    Alert.alert(
      'Set Alert Thresholds',
      'This feature allows setting custom alert thresholds for water levels.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Configure', onPress: () => Alert.alert('Feature', 'Custom threshold configuration (feature simulated)') }
      ]
    );
  };

  if (loading && !selectedStation) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading Prediction Models...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Groundwater Predictions</Text>
        <TouchableOpacity onPress={generateReport} style={styles.reportButton}>
          <Ionicons name="document-text" size={24} color="#2196F3" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Station Selector */}
        <View style={styles.stationSelector}>
          <Text style={styles.selectorLabel}>Select Station for Forecast:</Text>
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

        {/* Forecast Period Selector */}
        <View style={styles.forecastSelector}>
          <Text style={styles.selectorLabel}>Forecast Period:</Text>
          <View style={styles.forecastButtons}>
            {[7, 15, 30, 60].map(days => (
              <TouchableOpacity
                key={days}
                style={[
                  styles.forecastButton,
                  forecastDays === days && styles.activeForecastButton
                ]}
                onPress={() => setForecastDays(days)}
              >
                <Text style={[
                  styles.forecastButtonText,
                  forecastDays === days && styles.activeForecastButtonText
                ]}>
                  {days} days
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Current Station Info */}
        {selectedStation && (
          <View style={styles.stationInfo}>
            <View style={styles.stationInfoHeader}>
              <Text style={styles.stationInfoTitle}>{selectedStation.name}</Text>
              <View style={styles.trendIndicator}>
                <Ionicons 
                  name={selectedStation.trend === 'rising' ? 'trending-up' : selectedStation.trend === 'falling' ? 'trending-down' : 'remove'} 
                  size={20} 
                  color={selectedStation.trend === 'rising' ? '#4CAF50' : selectedStation.trend === 'falling' ? '#F44336' : '#FF9800'} 
                />
                <Text style={[styles.trendText, { color: selectedStation.trend === 'rising' ? '#4CAF50' : selectedStation.trend === 'falling' ? '#F44336' : '#FF9800' }]}>
                  {selectedStation.trend}
                </Text>
              </View>
            </View>
            <Text style={styles.stationLocation}>{selectedStation.district}, {selectedStation.state}</Text>
            <Text style={styles.currentLevel}>Current Level: {selectedStation.current_level}m</Text>
          </View>
        )}

        {/* Predictions Chart */}
        {predictions.length > 0 ? (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Water Level Predictions ({forecastDays} days)</Text>
            <LineChart
              data={preparePredictionChartData()}
              width={width - 80}
              height={250}
              spacing={Math.max(20, (width - 120) / Math.min(predictions.length, 30))}
              color="#FF9800"
              thickness={3}
              startFillColor="#FF9800"
              endFillColor="#FF9800"
              startOpacity={0.3}
              endOpacity={0.1}
              initialSpacing={0}
              noOfSections={6}
              maxValue={Math.max(...preparePredictionChartData().map(d => d.value)) + 5}
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
                pointerColor: '#FF9800',
                radius: 4,
                pointerLabelWidth: 100,
                pointerLabelHeight: 90,
                pointerLabelComponent: (items: any) => {
                  return (
                    <View style={styles.pointerLabel}>
                      <Text style={styles.pointerText}>
                        Predicted: {items[0].value}m
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
        ) : (
          <View style={styles.noDataContainer}>
            <Ionicons name="analytics-outline" size={48} color="#ccc" />
            <Text style={styles.noDataText}>No prediction data available</Text>
            {loading && <ActivityIndicator size="small" color="#2196F3" style={{ marginTop: 10 }} />}
          </View>
        )}

        {/* Confidence Chart */}
        {predictions.length > 0 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Prediction Confidence Level</Text>
            <LineChart
              data={prepareConfidenceData()}
              width={width - 80}
              height={200}
              spacing={Math.max(20, (width - 120) / Math.min(predictions.length, 30))}
              color="#4CAF50"
              thickness={2}
              initialSpacing={0}
              noOfSections={5}
              maxValue={100}
              yAxisColor="#666"
              yAxisThickness={1}
              rulesType="solid"
              rulesColor="#f0f0f0"
              yAxisTextStyle={{ color: '#666' }}
              xAxisColor="#666"
              yAxisLabelSuffix="%"
              isAnimated
              animationDuration={1000}
            />
            <Text style={styles.chartNote}>
              * Confidence decreases over time as prediction horizon extends
            </Text>
          </View>
        )}

        {/* Alert Thresholds */}
        <View style={styles.alertContainer}>
          <View style={styles.alertHeader}>
            <Text style={styles.alertTitle}>Alert Thresholds</Text>
            <TouchableOpacity onPress={setCustomThreshold} style={styles.configButton}>
              <Ionicons name="settings" size={20} color="#2196F3" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.alertLevels}>
            <View style={styles.alertLevel}>
              <View style={[styles.alertIndicator, { backgroundColor: '#D32F2F' }]} />
              <Text style={styles.alertText}>Critical: {"<"}{alertThresholds.critical_low}m or {">"}{alertThresholds.critical_high}m</Text>
            </View>
            <View style={styles.alertLevel}>
              <View style={[styles.alertIndicator, { backgroundColor: '#F57C00' }]} />
              <Text style={styles.alertText}>Warning: {alertThresholds.critical_low}-{alertThresholds.warning_low}m or {alertThresholds.warning_high}-{alertThresholds.critical_high}m</Text>
            </View>
            <View style={styles.alertLevel}>
              <View style={[styles.alertIndicator, { backgroundColor: '#388E3C' }]} />
              <Text style={styles.alertText}>Normal: {alertThresholds.warning_low}-{alertThresholds.warning_high}m</Text>
            </View>
          </View>
        </View>

        {/* Prediction Summary */}
        {predictions.length > 0 && selectedStation && (
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Forecast Summary</Text>
            
            <View style={styles.summaryStats}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Current Level</Text>
                <Text style={styles.summaryValue}>{selectedStation.current_level}m</Text>
              </View>
              
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Avg Predicted</Text>
                <Text style={styles.summaryValue}>
                  {(predictions.reduce((acc, p) => acc + p.predicted_level, 0) / predictions.length).toFixed(1)}m
                </Text>
              </View>
              
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Min Predicted</Text>
                <Text style={[styles.summaryValue, { color: '#F44336' }]}>
                  {Math.min(...predictions.map(p => p.predicted_level)).toFixed(1)}m
                </Text>
              </View>
              
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Max Predicted</Text>
                <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
                  {Math.max(...predictions.map(p => p.predicted_level)).toFixed(1)}m
                </Text>
              </View>
            </View>

            <View style={styles.alertSummary}>
              {predictions.some(p => p.predicted_level < alertThresholds.critical_low || p.predicted_level > alertThresholds.critical_high) && (
                <View style={[styles.alertBanner, { backgroundColor: '#FFEBEE', borderColor: '#D32F2F' }]}>
                  <Ionicons name="warning" size={20} color="#D32F2F" />
                  <Text style={[styles.alertBannerText, { color: '#D32F2F' }]}>
                    Critical levels predicted - Immediate attention required
                  </Text>
                </View>
              )}
              
              {predictions.some(p => 
                (p.predicted_level < alertThresholds.warning_low && p.predicted_level >= alertThresholds.critical_low) ||
                (p.predicted_level > alertThresholds.warning_high && p.predicted_level <= alertThresholds.critical_high)
              ) && (
                <View style={[styles.alertBanner, { backgroundColor: '#FFF3E0', borderColor: '#F57C00' }]}>
                  <Ionicons name="alert-circle" size={20} color="#F57C00" />
                  <Text style={[styles.alertBannerText, { color: '#F57C00' }]}>
                    Warning levels detected - Monitor closely
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Model Information */}
        <View style={styles.modelInfo}>
          <Text style={styles.modelTitle}>Prediction Model Information</Text>
          <Text style={styles.modelText}>• SARIMA-based forecasting algorithm</Text>
          <Text style={styles.modelText}>• Incorporates seasonal patterns and trends</Text>
          <Text style={styles.modelText}>• Weather patterns and rainfall impact considered</Text>
          <Text style={styles.modelText}>• Historical data analysis for pattern recognition</Text>
          <Text style={styles.modelText}>• Confidence intervals provided for uncertainty quantification</Text>
        </View>
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
  reportButton: {
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
  forecastSelector: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  forecastButtons: {
    flexDirection: 'row',
  },
  forecastButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activeForecastButton: {
    backgroundColor: '#FF9800',
    borderColor: '#FF9800',
  },
  forecastButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activeForecastButtonText: {
    color: '#fff',
  },
  stationInfo: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  stationInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stationInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  stationLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  currentLevel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
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
  chartNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
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
  alertContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  configButton: {
    padding: 4,
  },
  alertLevels: {
    gap: 8,
  },
  alertLevel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  alertText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  summaryContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
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
  summaryStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  summaryItem: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  alertSummary: {
    gap: 8,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  alertBannerText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  modelInfo: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  modelTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  modelText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    lineHeight: 20,
  },
});