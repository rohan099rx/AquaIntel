import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
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
}

export default function MapScreen() {
  const [stations, setStations] = useState<GroundwaterStation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStations();
  }, []);

  const loadStations = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/stations`);
      if (response.ok) {
        const data = await response.json();
        setStations(data);
        await AsyncStorage.setItem('map_stations', JSON.stringify(data));
      } else {
        const cached = await AsyncStorage.getItem('map_stations');
        if (cached) {
          setStations(JSON.parse(cached));
        }
      }
    } catch (error) {
      console.error('Error loading stations:', error);
      const cached = await AsyncStorage.getItem('map_stations');
      if (cached) {
        setStations(JSON.parse(cached));
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading Map Data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Groundwater Map</Text>
        <TouchableOpacity onPress={loadStations} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#2196F3" />
        </TouchableOpacity>
      </View>

      <View style={styles.webFallbackContainer}>
        <Ionicons name="map-outline" size={80} color="#ccc" />
        <Text style={styles.webFallbackTitle}>Interactive Map View</Text>
        
        {Platform.OS === 'web' ? (
          <>
            <Text style={styles.webFallbackText}>
              Interactive map with groundwater stations is available on mobile devices.
            </Text>
            <Text style={styles.webFallbackText}>
              Open this app on your mobile device to view the full map experience with:
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.webFallbackText}>
              Full interactive map features coming soon! This includes:
            </Text>
          </>
        )}
        
        <View style={styles.featureList}>
          <Text style={styles.featureItem}>• Interactive station markers with color-coded trends</Text>
          <Text style={styles.featureItem}>• Real-time water level indicators</Text>
          <Text style={styles.featureItem}>• GPS location services and user positioning</Text>
          <Text style={styles.featureItem}>• OpenStreetMap integration</Text>
          <Text style={styles.featureItem}>• Station detail modal views with predictions</Text>
          <Text style={styles.featureItem}>• Filter stations by trend and status</Text>
        </View>
        
        <View style={styles.stationsList}>
          <Text style={styles.stationsListTitle}>Available Monitoring Stations ({stations.length})</Text>
          <ScrollView style={styles.stationsScrollView}>
            {stations.map(station => (
              <View key={station.station_id} style={styles.stationListItem}>
                <View style={styles.stationInfo}>
                  <Text style={styles.stationListName}>{station.name}</Text>
                  <Text style={styles.stationListLocation}>{station.district}, {station.state}</Text>
                  <Text style={styles.stationId}>ID: {station.station_id}</Text>
                  {station.latitude && station.longitude && (
                    <Text style={styles.coordinates}>
                      📍 {station.latitude.toFixed(4)}, {station.longitude.toFixed(4)}
                    </Text>
                  )}
                </View>
                <View style={styles.stationListLevel}>
                  <Text style={styles.levelText}>{station.current_level}m</Text>
                  <View style={styles.trendIndicator}>
                    <Ionicons 
                      name={station.trend === 'rising' ? 'trending-up' : station.trend === 'falling' ? 'trending-down' : 'remove'} 
                      size={20} 
                      color={station.trend === 'rising' ? '#4CAF50' : station.trend === 'falling' ? '#F44336' : '#FF9800'} 
                    />
                    <Text style={[
                      styles.trendText,
                      { color: station.trend === 'rising' ? '#4CAF50' : station.trend === 'falling' ? '#F44336' : '#FF9800' }
                    ]}>
                      {station.trend}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
        
        <View style={styles.mapInfo}>
          <Text style={styles.mapInfoTitle}>🗺️ Map Features (Mobile)</Text>
          <Text style={styles.mapInfoText}>
            When available, the interactive map will display all {stations.length} DWLR stations
            across India with real-time data visualization, trend analysis, and predictive insights.
          </Text>
        </View>
      </View>
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
  refreshButton: {
    padding: 8,
  },
  webFallbackContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30,
    backgroundColor: '#f5f5f5',
  },
  webFallbackTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  webFallbackText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 22,
  },
  featureList: {
    marginVertical: 20,
    alignSelf: 'stretch',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  featureItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    paddingLeft: 10,
    lineHeight: 20,
  },
  stationsList: {
    alignSelf: 'stretch',
    flex: 1,
  },
  stationsListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  stationsScrollView: {
    flex: 1,
  },
  stationListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  stationInfo: {
    flex: 1,
  },
  stationListName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  stationListLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  stationId: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  coordinates: {
    fontSize: 12,
    color: '#2196F3',
  },
  stationListLevel: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  levelText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  mapInfo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    alignSelf: 'stretch',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  mapInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  mapInfoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});