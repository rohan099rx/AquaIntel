import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

interface GroundwaterStation {
  station_id: string;
  name: string;
  state: string;
  district: string;
  current_level: number;
  status: string;
  trend: 'rising' | 'falling' | 'stable';
  last_updated: string;
  latitude?: number;
  longitude?: number;
  historical_data?: Array<{
    date: string;
    level: number;
    temperature: number;
    rainfall: number;
  }>;
}

interface AnalyticsSummary {
  total_stations: number;
  active_stations: number;
  trend_distribution: {
    falling: number;
    rising: number;
    stable: number;
  };
  state_statistics: Array<{
    state: string;
    average_level: number;
    station_count: number;
  }>;
}

export default function GroundwaterMonitoringApp() {
  const [stations, setStations] = useState<GroundwaterStation[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'stations' | 'analytics'>('overview');
  const [error, setError] = useState<string | null>(null);

  // Initialize data on app start
  const initializeApp = async () => {
    try {
      setLoading(true);
      setError(null);

      // Initialize stations in backend
      const initResponse = await fetch(`${BACKEND_URL}/api/stations/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!initResponse.ok) {
        throw new Error('Failed to initialize stations');
      }

      await loadData();
    } catch (err) {
      console.error('Initialization error:', err);
      setError('Failed to initialize app. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Load stations and analytics data
  const loadData = async () => {
    try {
      const [stationsResponse, analyticsResponse] = await Promise.all([
        fetch(`${BACKEND_URL}/api/stations`),
        fetch(`${BACKEND_URL}/api/analytics/summary`)
      ]);

      if (stationsResponse.ok && analyticsResponse.ok) {
        const stationsData = await stationsResponse.json();
        const analyticsData = await analyticsResponse.json();

        setStations(stationsData);
        setAnalytics(analyticsData);

        // Cache data for offline access
        await AsyncStorage.setItem('stations_data', JSON.stringify(stationsData));
        await AsyncStorage.setItem('analytics_data', JSON.stringify(analyticsData));
      } else {
        throw new Error('Failed to fetch data');
      }
    } catch (err) {
      console.error('Load data error:', err);
      // Try to load cached data
      await loadCachedData();
      setError('Using cached data. Check connection for latest updates.');
    }
  };

  // Load cached data for offline access
  const loadCachedData = async () => {
    try {
      const cachedStations = await AsyncStorage.getItem('stations_data');
      const cachedAnalytics = await AsyncStorage.getItem('analytics_data');

      if (cachedStations) {
        setStations(JSON.parse(cachedStations));
      }
      if (cachedAnalytics) {
        setAnalytics(JSON.parse(cachedAnalytics));
      }
    } catch (err) {
      console.error('Error loading cached data:', err);
    }
  };

  // Simulate real-time update for a random station
  const simulateRealTimeUpdate = async () => {
    if (stations.length === 0) return;

    try {
      const randomStation = stations[Math.floor(Math.random() * stations.length)];
      const response = await fetch(`${BACKEND_URL}/api/stations/${randomStation.station_id}/simulate-update`, {
        method: 'POST',
      });

      if (response.ok) {
        const updateData = await response.json();
        
        // Update the station in local state
        setStations(prevStations =>
          prevStations.map(station =>
            station.station_id === updateData.station_id
              ? { ...station, current_level: updateData.new_level }
              : station
          )
        );

        // Show notification
        Alert.alert(
          'Real-Time Update',
          `${randomStation.name}: Water level changed from ${updateData.previous_level}m to ${updateData.new_level}m`,
          [{ text: 'OK' }]
        );
      }
    } catch (err) {
      console.error('Simulate update error:', err);
    }
  };

  // Refresh data
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    initializeApp();
    
    // Set up real-time simulation interval (every 30 seconds)
    const interval = setInterval(() => {
      if (!loading) {
        simulateRealTimeUpdate();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Render trend icon
  const renderTrendIcon = (trend: string) => {
    const iconName = trend === 'rising' ? 'trending-up' : trend === 'falling' ? 'trending-down' : 'remove';
    const color = trend === 'rising' ? '#4CAF50' : trend === 'falling' ? '#F44336' : '#FF9800';
    return <Ionicons name={iconName} size={20} color={color} />;
  };

  // Render station card
  const renderStationCard = (station: GroundwaterStation) => (
    <View key={station.station_id} style={styles.stationCard}>
      <View style={styles.stationHeader}>
        <Text style={styles.stationName}>{station.name}</Text>
        <View style={styles.trendContainer}>
          {renderTrendIcon(station.trend)}
          <Text style={[styles.trendText, { color: station.trend === 'rising' ? '#4CAF50' : station.trend === 'falling' ? '#F44336' : '#FF9800' }]}>
            {station.trend}
          </Text>
        </View>
      </View>
      
      <Text style={styles.locationText}>{station.district}, {station.state}</Text>
      
      <View style={styles.levelContainer}>
        <Text style={styles.levelLabel}>Current Water Level</Text>
        <Text style={styles.levelValue}>{station.current_level}m</Text>
      </View>
      
      <View style={styles.stationFooter}>
        <Text style={styles.statusText}>Status: {station.status}</Text>
        <Text style={styles.updateText}>
          Updated: {new Date(station.last_updated).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  // Render analytics summary
  const renderAnalytics = () => {
    if (!analytics) return null;

    return (
      <View style={styles.analyticsContainer}>
        <Text style={styles.sectionTitle}>System Overview</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="water" size={30} color="#2196F3" />
            <Text style={styles.statValue}>{analytics.total_stations}</Text>
            <Text style={styles.statLabel}>Total Stations</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={30} color="#4CAF50" />
            <Text style={styles.statValue}>{analytics.active_stations}</Text>
            <Text style={styles.statLabel}>Active Stations</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Trend Distribution</Text>
        
        <View style={styles.trendStats}>
          <View style={styles.trendItem}>
            <Ionicons name="trending-up" size={24} color="#4CAF50" />
            <Text style={styles.trendValue}>{analytics.trend_distribution.rising}</Text>
            <Text style={styles.trendLabel}>Rising</Text>
          </View>
          
          <View style={styles.trendItem}>
            <Ionicons name="trending-down" size={24} color="#F44336" />
            <Text style={styles.trendValue}>{analytics.trend_distribution.falling}</Text>
            <Text style={styles.trendLabel}>Falling</Text>
          </View>
          
          <View style={styles.trendItem}>
            <Ionicons name="remove" size={24} color="#FF9800" />
            <Text style={styles.trendValue}>{analytics.trend_distribution.stable}</Text>
            <Text style={styles.trendLabel}>Stable</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>State Statistics</Text>
        
        {analytics.state_statistics.slice(0, 5).map((stat, index) => (
          <View key={stat.state} style={styles.stateStatCard}>
            <View>
              <Text style={styles.stateName}>{stat.state}</Text>
              <Text style={styles.stateStations}>{stat.station_count} stations</Text>
            </View>
            <Text style={styles.stateAverage}>{stat.average_level}m avg</Text>
          </View>
        ))}
      </View>
    );
  };

  // Loading screen
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#1976D2" />
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Initializing Groundwater Monitoring System...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1976D2" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Groundwater Monitor</Text>
        <Text style={styles.headerSubtitle}>Real-Time DWLR Network</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={20} color="#F44336" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'overview' && styles.activeTab]}
          onPress={() => setSelectedTab('overview')}
        >
          <Ionicons name="analytics" size={20} color={selectedTab === 'overview' ? '#2196F3' : '#666'} />
          <Text style={[styles.tabText, selectedTab === 'overview' && styles.activeTabText]}>Overview</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'stations' && styles.activeTab]}
          onPress={() => setSelectedTab('stations')}
        >
          <Ionicons name="location" size={20} color={selectedTab === 'stations' ? '#2196F3' : '#666'} />
          <Text style={[styles.tabText, selectedTab === 'stations' && styles.activeTabText]}>Stations</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'analytics' && styles.activeTab]}
          onPress={() => setSelectedTab('analytics')}
        >
          <Ionicons name="bar-chart" size={20} color={selectedTab === 'analytics' ? '#2196F3' : '#666'} />
          <Text style={[styles.tabText, selectedTab === 'analytics' && styles.activeTabText]}>Analytics</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {selectedTab === 'overview' && (
          <View style={styles.overviewContainer}>
            <Text style={styles.sectionTitle}>System Status</Text>
            {renderAnalytics()}
            
            <Text style={styles.sectionTitle}>Recent Station Updates</Text>
            {stations.slice(0, 3).map(renderStationCard)}
          </View>
        )}

        {selectedTab === 'stations' && (
          <View style={styles.stationsContainer}>
            <Text style={styles.sectionTitle}>All Monitoring Stations ({stations.length})</Text>
            {stations.map(renderStationCard)}
          </View>
        )}

        {selectedTab === 'analytics' && (
          <View style={styles.analyticsContainer}>
            {renderAnalytics()}
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
    textAlign: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    paddingTop: 50,
    position: 'relative',
    backgroundColor: '#2196F3',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  refreshButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    padding: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 8,
  },
  errorText: {
    marginLeft: 8,
    color: '#F44336',
    fontSize: 14,
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2196F3',
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#2196F3',
  },
  content: {
    flex: 1,
  },
  overviewContainer: {
    padding: 20,
  },
  stationsContainer: {
    padding: 20,
  },
  analyticsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    marginTop: 20,
  },
  stationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  stationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  levelContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  levelLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  levelValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  stationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  updateText: {
    fontSize: 12,
    color: '#666',
  },
  statsGrid: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  trendStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  trendItem: {
    alignItems: 'center',
  },
  trendValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  trendLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  stateStatCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  stateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  stateStations: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  stateAverage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
});