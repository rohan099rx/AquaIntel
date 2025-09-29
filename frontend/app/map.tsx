import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Platform,
  Linking,
} from "react-native";
import MapView, {
  Marker,
  PROVIDER_DEFAULT,
  UrlTile,
  Callout,
} from "react-native-maps";

// Define TypeScript interface for station data
interface Station {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  level: number;
  trend: "rising" | "falling" | "stable";
}

// Simple mock data for DWLR stations
const STATIONS: Station[] = [
  {
    id: "station1",
    name: "Mumbai Central",
    latitude: 19.076,
    longitude: 72.8777,
    level: 12.5,
    trend: "rising",
  },
  {
    id: "station2",
    name: "Bangalore North",
    latitude: 12.9716,
    longitude: 77.5946,
    level: 8.3,
    trend: "falling",
  },
  {
    id: "station3",
    name: "Delhi DWLR",
    latitude: 28.7041,
    longitude: 77.1025,
    level: 15.7,
    trend: "stable",
  },
  {
    id: "station4",
    name: "Chennai Coastal",
    latitude: 13.0827,
    longitude: 80.2707,
    level: 6.2,
    trend: "rising",
  },
  // Add more stations for better coverage
  {
    id: "station5",
    name: "Kolkata Basin",
    latitude: 22.5726,
    longitude: 88.3639,
    level: 9.8,
    trend: "stable",
  },
  {
    id: "station6",
    name: "Hyderabad Aquifer",
    latitude: 17.385,
    longitude: 78.4867,
    level: 7.2,
    trend: "falling",
  },
];

export default function Map() {
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "rising" | "falling" | "stable">(
    "all"
  );
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const mapRef = useRef<MapView>(null);
  const [mapType, setMapType] = useState<"standard" | "terrain" | "satellite">(
    "standard"
  );

  // Define map tile templates for different map types
  const tileTemplates = {
    standard: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    terrain: "https://tile.opentopomap.org/{z}/{x}/{y}.png",
    satellite:
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  };

  // Map type credits
  const mapCredits = {
    standard: "© OpenStreetMap contributors",
    terrain: "© OpenTopoMap (CC-BY-SA)",
    satellite: "© Esri, Maxar, Earthstar Geographics",
  };

  // Simulate loading delay
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Filter stations based on trend
  const filteredStations = STATIONS.filter((station) => {
    if (filter === "all") return true;
    return station.trend === filter;
  });

  // Get marker color based on trend
  const getMarkerColor = (trend: string): string => {
    switch (trend) {
      case "rising":
        return "green";
      case "falling":
        return "red";
      case "stable":
        return "orange";
      default:
        return "blue";
    }
  };

  // Function to focus map on selected station
  const focusStation = (station: Station) => {
    setSelectedStation(station);
    mapRef.current?.animateToRegion(
      {
        latitude: station.latitude,
        longitude: station.longitude,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      },
      1000
    );
  };

  // Reset map view to show all of India
  const resetMapView = () => {
    mapRef.current?.animateToRegion(
      {
        latitude: 23.5937, // Center of India
        longitude: 78.9629,
        latitudeDelta: 15,
        longitudeDelta: 15,
      },
      1000
    );
    setSelectedStation(null);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading Map...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>DWLR Monitoring Map</Text>
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === "all" && styles.activeFilter,
            ]}
            onPress={() => setFilter("all")}
          >
            <Text
              style={[
                styles.filterText,
                filter === "all" && styles.activeFilterText,
              ]}
            >
              All Stations ({STATIONS.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === "rising" && styles.activeFilter,
            ]}
            onPress={() => setFilter("rising")}
          >
            <Text
              style={[
                styles.filterText,
                filter === "rising" && styles.activeFilterText,
              ]}
            >
              Rising ({STATIONS.filter((s) => s.trend === "rising").length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === "falling" && styles.activeFilter,
            ]}
            onPress={() => setFilter("falling")}
          >
            <Text
              style={[
                styles.filterText,
                filter === "falling" && styles.activeFilterText,
              ]}
            >
              Falling ({STATIONS.filter((s) => s.trend === "falling").length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === "stable" && styles.activeFilter,
            ]}
            onPress={() => setFilter("stable")}
          >
            <Text
              style={[
                styles.filterText,
                filter === "stable" && styles.activeFilterText,
              ]}
            >
              Stable ({STATIONS.filter((s) => s.trend === "stable").length})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Map Style Selector */}
      <View style={styles.mapTypeContainer}>
        <TouchableOpacity
          style={[
            styles.mapTypeButton,
            mapType === "standard" && styles.activeMapType,
          ]}
          onPress={() => setMapType("standard")}
        >
          <Text style={styles.mapTypeText}>Standard</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.mapTypeButton,
            mapType === "terrain" && styles.activeMapType,
          ]}
          onPress={() => setMapType("terrain")}
        >
          <Text style={styles.mapTypeText}>Terrain</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.mapTypeButton,
            mapType === "satellite" && styles.activeMapType,
          ]}
          onPress={() => setMapType("satellite")}
        >
          <Text style={styles.mapTypeText}>Satellite</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.resetButton} onPress={resetMapView}>
          <Text style={styles.resetText}>Reset View</Text>
        </TouchableOpacity>
      </View>

      {/* Map with OpenStreetMap */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={{
            latitude: 23.5937, // Center of India
            longitude: 78.9629,
            latitudeDelta: 15,
            longitudeDelta: 15,
          }}
          mapType="none" // We'll use custom tiles instead
        >
          {/* Map Tiles based on selected type */}
          <UrlTile
            urlTemplate={tileTemplates[mapType]}
            maximumZ={19}
            zIndex={-1}
          />

          {/* Station Markers */}
          {filteredStations.map((station) => (
            <Marker
              key={station.id}
              coordinate={{
                latitude: station.latitude,
                longitude: station.longitude,
              }}
              title={station.name}
              description={`Water level: ${station.level}m (${station.trend})`}
              pinColor={getMarkerColor(station.trend)}
              onPress={() => focusStation(station)}
            >
              <Callout tooltip>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{station.name}</Text>
                  <Text style={styles.calloutText}>
                    Water level: {station.level}m
                  </Text>
                  <Text
                    style={[
                      styles.calloutText,
                      { color: getMarkerColor(station.trend) },
                    ]}
                  >
                    Status: {station.trend}
                  </Text>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>

        {/* OpenStreetMap Attribution */}
        <View style={styles.attribution}>
          <Text
            style={styles.attributionText}
            onPress={() =>
              Linking.openURL("https://www.openstreetmap.org/copyright")
            }
          >
            {mapCredits[mapType]}
          </Text>
        </View>
      </View>

      {/* Station details */}
      {selectedStation && (
        <View style={styles.detailsCard}>
          <Text style={styles.stationName}>{selectedStation.name}</Text>
          <Text style={styles.stationDetail}>
            Water Level: {selectedStation.level} meters
          </Text>
          <Text style={styles.stationDetail}>
            Trend:{" "}
            <Text style={{ color: getMarkerColor(selectedStation.trend) }}>
              {selectedStation.trend}
            </Text>
          </Text>
          <Text style={styles.stationDetail}>
            Coordinates: {selectedStation.latitude.toFixed(4)},{" "}
            {selectedStation.longitude.toFixed(4)}
          </Text>
          <TouchableOpacity
            style={styles.viewMoreButton}
            onPress={() => alert(`Viewing details for ${selectedStation.name}`)}
          >
            <Text style={styles.viewMoreText}>View Historical Data</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Legend */}
      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>Legend</Text>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: "green" }]} />
          <Text style={styles.legendText}>Rising</Text>

          <View style={[styles.legendDot, { backgroundColor: "red" }]} />
          <Text style={styles.legendText}>Falling</Text>

          <View style={[styles.legendDot, { backgroundColor: "orange" }]} />
          <Text style={styles.legendText}>Stable</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#333",
  },
  header: {
    padding: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  filterContainer: {
    padding: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  activeFilter: {
    backgroundColor: "#007BFF",
  },
  filterText: {
    color: "#333",
  },
  activeFilterText: {
    color: "#fff",
  },
  mapTypeContainer: {
    flexDirection: "row",
    padding: 6,
    backgroundColor: "#fff",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  mapTypeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: "#f0f0f0",
  },
  activeMapType: {
    backgroundColor: "#e0e0e0",
  },
  mapTypeText: {
    fontSize: 12,
    color: "#333",
  },
  resetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: "#ffebee",
  },
  resetText: {
    fontSize: 12,
    color: "#d32f2f",
  },
  mapContainer: {
    flex: 1,
    overflow: "hidden",
    position: "relative",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  attribution: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  attributionText: {
    fontSize: 10,
    color: "#555",
    textDecorationLine: "underline",
  },
  callout: {
    width: 140,
    padding: 10,
    borderRadius: 6,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  calloutTitle: {
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 5,
  },
  calloutText: {
    fontSize: 12,
    marginBottom: 2,
  },
  detailsCard: {
    margin: 10,
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  stationName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  stationDetail: {
    fontSize: 16,
    marginBottom: 4,
    color: "#555",
  },
  viewMoreButton: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "#e3f2fd",
    borderRadius: 4,
    alignItems: "center",
  },
  viewMoreText: {
    color: "#1976d2",
    fontWeight: "500",
  },
  legendContainer: {
    padding: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
    marginLeft: 10,
  },
  legendText: {
    fontSize: 12,
    marginRight: 15,
    color: "#555",
  },
});
