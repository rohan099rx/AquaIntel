import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Dimensions
} from 'react-native';
import { Platform } from 'react-native';

// Conditional import for mobile-only maps
let MapView: any, Marker: any, Region: any, Callout: any;

if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  Region = Maps.Region;
  Callout = Maps.Callout;
}
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

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
  const [selectedStation, setSelectedStation] = useState<GroundwaterStation | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [region, setRegion] = useState<Region>({
    latitude: 20.5937,
    longitude: 78.9629,
    latitudeDelta: 15,
    longitudeDelta: 15,
  });
  const [filter, setFilter] = useState<'all' | 'rising' | 'falling' | 'stable'>('all');
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    loadStations();
    getUserLocation();
  }, []);

  const getUserLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to show your position on the map');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location);
    } catch (error) {
      console.log('Error getting location:', error);
    }
  };

  const loadStations = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/stations`);
      if (response.ok) {
        const data = await response.json();
        setStations(data);
        
        // Cache data
        await AsyncStorage.setItem('map_stations', JSON.stringify(data));
      } else {
        // Load cached data
        const cached = await AsyncStorage.getItem('map_stations');
        if (cached) {
          setStations(JSON.parse(cached));
        }
      }
    } catch (error) {
      console.error('Error loading stations:', error);
      // Load cached data
      const cached = await AsyncStorage.getItem('map_stations');
      if (cached) {
        setStations(JSON.parse(cached));
      }
    } finally {
      setLoading(false);
    }
  };

  const getMarkerColor = (trend: string, level: number) => {
    if (trend === 'rising') return '#4CAF50';
    if (trend === 'falling') return '#F44336';
    if (level < 10) return '#FF9800'; // Warning for low levels
    return '#2196F3';
  };

  const filteredStations = stations.filter(station => {
    if (filter === 'all') return true;
    return station.trend === filter;
  });

  const renderStationMarker = (station: GroundwaterStation) => {
    if (!station.latitude || !station.longitude) return null;

    return (
      <Marker
        key={station.station_id}
        coordinate={{
          latitude: station.latitude,
          longitude: station.longitude
        }}
        pinColor={getMarkerColor(station.trend, station.current_level)}
        onPress={() => {
          setSelectedStation(station);
          setModalVisible(true);
        }}
      >
        <Callout tooltip>
          <View style={styles.calloutContainer}>
            <Text style={styles.calloutTitle}>{station.name}</Text>
            <Text style={styles.calloutLevel}>{station.current_level}m</Text>
            <View style={styles.calloutTrend}>
              <Ionicons 
                name={station.trend === 'rising' ? 'trending-up' : station.trend === 'falling' ? 'trending-down' : 'remove'} 
                size={16} 
                color={getMarkerColor(station.trend, station.current_level)} 
              />
              <Text style={[styles.calloutTrendText, { color: getMarkerColor(station.trend, station.current_level) }]}>
                {station.trend}
              </Text>
            </View>
          </View>
        </Callout>
      </Marker>
    );
  };

  const centerOnUserLocation = () => {
    if (userLocation) {
      setRegion({
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 1,
        longitudeDelta: 1,
      });
    }
  };

  const centerOnIndia = () => {
    setRegion({
      latitude: 20.5937,
      longitude: 78.9629,
      latitudeDelta: 15,
      longitudeDelta: 15,
    });
  };

  if (Platform.OS === 'web') {
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
          <Text style={styles.webFallbackTitle}>Map View</Text>
          <Text style={styles.webFallbackText}>
            Interactive map with groundwater stations is available on mobile devices.
          </Text>
          <Text style={styles.webFallbackText}>
            Open this app on your mobile device to view the full map experience with:
          </Text>
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>• Interactive station markers</Text>
            <Text style={styles.featureItem}>• Real-time water level indicators</Text>
            <Text style={styles.featureItem}>• GPS location services</Text>
            <Text style={styles.featureItem}>• Trend-based color coding</Text>
            <Text style={styles.featureItem}>• Station detail modal views</Text>
          </View>
          
          <View style={styles.stationsList}>
            <Text style={styles.stationsListTitle}>Available Stations ({stations.length})</Text>
            {stations.slice(0, 5).map(station => (
              <View key={station.station_id} style={styles.stationListItem}>
                <View>
                  <Text style={styles.stationListName}>{station.name}</Text>
                  <Text style={styles.stationListLocation}>{station.district}, {station.state}</Text>
                </View>
                <View style={styles.stationListLevel}>
                  <Text style={styles.levelText}>{station.current_level}m</Text>
                  <Ionicons 
                    name={station.trend === 'rising' ? 'trending-up' : station.trend === 'falling' ? 'trending-down' : 'remove'} 
                    size={16} 
                    color={station.trend === 'rising' ? '#4CAF50' : station.trend === 'falling' ? '#F44336' : '#FF9800'} 
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Groundwater Map</Text>
        <TouchableOpacity onPress={loadStations} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#2196F3" />
        </TouchableOpacity>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.activeFilter]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
              All ({stations.length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, filter === 'rising' && styles.activeFilter]}
            onPress={() => setFilter('rising')}
          >
            <Ionicons name="trending-up" size={16} color={filter === 'rising' ? '#fff' : '#4CAF50'} />
            <Text style={[styles.filterText, filter === 'rising' && styles.activeFilterText]}>
              Rising ({stations.filter(s => s.trend === 'rising').length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, filter === 'falling' && styles.activeFilter]}
            onPress={() => setFilter('falling')}
          >
            <Ionicons name="trending-down" size={16} color={filter === 'falling' ? '#fff' : '#F44336'} />
            <Text style={[styles.filterText, filter === 'falling' && styles.activeFilterText]}>
              Falling ({stations.filter(s => s.trend === 'falling').length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, filter === 'stable' && styles.activeFilter]}
            onPress={() => setFilter('stable')}
          >
            <Ionicons name="remove" size={16} color={filter === 'stable' ? '#fff' : '#FF9800'} />
            <Text style={[styles.filterText, filter === 'stable' && styles.activeFilterText]}>
              Stable ({stations.filter(s => s.trend === 'stable').length})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Map */}
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {filteredStations.map(renderStationMarker)}
        
        {userLocation && (
          <Marker
            coordinate={{
              latitude: userLocation.coords.latitude,
              longitude: userLocation.coords.longitude
            }}
            title="Your Location"
          >
            <View style={styles.userLocationMarker}>
              <Ionicons name="person" size={20} color="#fff" />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Map Controls */}
      <View style={styles.mapControls}>
        <TouchableOpacity style={styles.controlButton} onPress={centerOnUserLocation}>
          <Ionicons name="locate" size={24} color="#2196F3" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButton} onPress={centerOnIndia}>
          <Ionicons name="globe" size={24} color="#2196F3" />
        </TouchableOpacity>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Legend</Text>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.legendText}>Rising Level</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#F44336' }]} />
          <Text style={styles.legendText}>Falling Level</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
          <Text style={styles.legendText}>Low/Critical</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#2196F3' }]} />
          <Text style={styles.legendText}>Normal</Text>
        </View>
      </View>

      {/* Station Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedStation && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedStation.name}</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Location:</Text>
                    <Text style={styles.detailValue}>
                      {selectedStation.district}, {selectedStation.state}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Current Level:</Text>
                    <Text style={[styles.detailValue, styles.levelValue]}>
                      {selectedStation.current_level}m
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Trend:</Text>
                    <View style={styles.trendContainer}>
                      <Ionicons 
                        name={selectedStation.trend === 'rising' ? 'trending-up' : selectedStation.trend === 'falling' ? 'trending-down' : 'remove'} 
                        size={20} 
                        color={getMarkerColor(selectedStation.trend, selectedStation.current_level)} 
                      />
                      <Text style={[styles.detailValue, { color: getMarkerColor(selectedStation.trend, selectedStation.current_level) }]}>
                        {selectedStation.trend}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <Text style={[styles.detailValue, { color: selectedStation.status === 'active' ? '#4CAF50' : '#F44336' }]}>
                      {selectedStation.status}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Last Updated:</Text>
                    <Text style={styles.detailValue}>
                      {new Date(selectedStation.last_updated).toLocaleString()}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Coordinates:</Text>
                    <Text style={styles.detailValue}>
                      {selectedStation.latitude?.toFixed(4)}, {selectedStation.longitude?.toFixed(4)}
                    </Text>
                  </View>
                </ScrollView>

                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="analytics" size={20} color="#2196F3" />
                    <Text style={styles.actionButtonText}>View Charts</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="trending-up" size={20} color="#2196F3" />
                    <Text style={styles.actionButtonText}>Predictions</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activeFilter: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#fff',
  },
  map: {
    flex: 1,
  },
  mapControls: {
    position: 'absolute',
    top: height * 0.45,
    right: 20,
  },
  controlButton: {
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 12,
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  legend: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  userLocationMarker: {
    backgroundColor: '#2196F3',
    borderRadius: 20,
    padding: 8,
    borderWidth: 3,
    borderColor: '#fff',
  },
  calloutContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    minWidth: 120,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  calloutLevel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  calloutTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calloutTrendText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  modalBody: {
    padding: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  levelValue: {
    fontSize: 18,
    color: '#2196F3',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
});