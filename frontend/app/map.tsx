import React, { useState, useEffect } from "react";
import { View, StyleSheet, Text, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";
import { MOCK_STATIONS } from "../data/mockStations";

export default function MapScreen() {
  const [loading, setLoading] = useState(true);

  // Generate HTML content with all 100 stations
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
      <style>
        body {
          margin: 0;
          padding: 0;
        }
        #map {
          width: 100%;
          height: 100vh;
        }
        .legend {
          padding: 6px 8px;
          background: white;
          background: rgba(255, 255, 255, 0.8);
          box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
          border-radius: 5px;
          line-height: 24px;
          color: #555;
        }
        .legend i {
          width: 18px;
          height: 18px;
          float: left;
          margin-right: 8px;
          opacity: 0.7;
        }
        .marker-pin {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          box-shadow: 0 0 3px rgba(0,0,0,0.5);
        }
        .custom-marker-green .marker-pin { background-color: #6ab04c; }
        .custom-marker-red .marker-pin { background-color: #eb4d4b; }
        .custom-marker-blue .marker-pin { background-color: #3498db; }
        .custom-marker-gray .marker-pin { background-color: #95a5a6; }
        .popup-content {
          padding: 10px;
          max-width: 250px;
        }
        .popup-content h3 {
          margin-top: 0;
          margin-bottom: 8px;
        }
        .trend-rising { color: #6ab04c; font-weight: bold; }
        .trend-falling { color: #eb4d4b; font-weight: bold; }
        .trend-stable { color: #3498db; font-weight: bold; }
        .water-quality {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #eee;
        }
        .quality-excellent { color: #4CAF50; font-weight: bold; }
        .quality-good { color: #8BC34A; font-weight: bold; }
        .quality-fair { color: #FFC107; font-weight: bold; }
        .quality-poor { color: #F44336; font-weight: bold; }
        .status-active { color: #4CAF50; }
        .status-maintenance { color: #FF9800; }
        .status-inactive { color: #F44336; }
        .cluster-marker {
          background: #2196F3;
          border-radius: 50%;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const map = L.map('map').setView([20.5937, 78.9629], 5);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        // Add markers from mock data (100 stations)
        const stations = ${JSON.stringify(MOCK_STATIONS)};
        
        // Create marker cluster group for better performance
        const markers = [];
        
        stations.forEach(station => {
          if (station.latitude && station.longitude) {
            let color = 'gray';
            if (station.status === 'active') {
              color = station.trend === 'rising' ? 'green' : 
                     station.trend === 'falling' ? 'red' : 'blue';
            }
            
            const marker = L.marker([station.latitude, station.longitude], {
              icon: L.divIcon({
                className: 'custom-marker-' + color,
                html: '<div class="marker-pin"></div>',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
              })
            });
            
            const popupContent = 
              '<div class="popup-content">' +
              '<h3>' + station.name + '</h3>' +
              '<p><strong>ID:</strong> ' + station.station_id + '</p>' +
              '<p><strong>Location:</strong> ' + station.district + ', ' + station.state + '</p>' +
              '<p><strong>Status:</strong> <span class="status-' + station.status + '">' + station.status + '</span></p>' +
              '<p><strong>Current Level:</strong> ' + station.current_level + ' meters</p>' +
              '<p><strong>Trend:</strong> <span class="trend-' + station.trend + '">' + station.trend + '</span></p>' +
              '<div class="water-quality">' +
              '<p><strong>Water Quality:</strong> <span class="quality-' + station.water_quality.status + '">' + 
              station.water_quality.status + '</span></p>' +
              '<p><strong>pH:</strong> ' + station.water_quality.pH.toFixed(1) + '</p>' +
              '<p><strong>Dissolved Oxygen:</strong> ' + station.water_quality.dissolved_oxygen.toFixed(1) + ' mg/L</p>' +
              '<p><strong>Quality Index:</strong> ' + station.water_quality.quality_index + '/100</p>' +
              '</div>' +
              '<p><strong>Last Updated:</strong> ' + new Date(station.last_updated).toLocaleString() + '</p>' +
              '</div>';
            
            marker.bindPopup(popupContent);
            marker.addTo(map);
            markers.push(marker);
          }
        });
        
        // Add legend
        const legend = L.control({position: 'bottomleft'});
        legend.onAdd = function(map) {
          const div = L.DomUtil.create('div', 'legend');
          div.innerHTML = '<h4>DWLR Stations (' + stations.length + ')</h4>' +
            '<div><i style="background: #6ab04c"></i> Rising Water Level</div>' +
            '<div><i style="background: #eb4d4b"></i> Falling Water Level</div>' +
            '<div><i style="background: #3498db"></i> Stable Water Level</div>' +
            '<div><i style="background: #95a5a6"></i> Inactive/Maintenance</div>';
          return div;
        };
        legend.addTo(map);
        
        // Add stats control
        const stats = L.control({position: 'topright'});
        stats.onAdd = function(map) {
          const div = L.DomUtil.create('div', 'legend');
          const activeStations = stations.filter(s => s.status === 'active').length;
          const risingTrend = stations.filter(s => s.trend === 'rising' && s.status === 'active').length;
          const fallingTrend = stations.filter(s => s.trend === 'falling' && s.status === 'active').length;
          const stableTrend = stations.filter(s => s.trend === 'stable' && s.status === 'active').length;
          
          div.innerHTML = '<h4>Station Statistics</h4>' +
            '<div><strong>Total:</strong> ' + stations.length + '</div>' +
            '<div><strong>Active:</strong> ' + activeStations + '</div>' +
            '<div style="color: #6ab04c;"><strong>Rising:</strong> ' + risingTrend + '</div>' +
            '<div style="color: #eb4d4b;"><strong>Falling:</strong> ' + fallingTrend + '</div>' +
            '<div style="color: #3498db;"><strong>Stable:</strong> ' + stableTrend + '</div>';
          return div;
        };
        stats.addTo(map);
      </script>
    </body>
    </html>
  `;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        <WebView
          source={{ html: htmlContent }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          onLoadEnd={() => setLoading(false)}
          renderLoading={() => (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#0000ff" />
              <Text style={styles.loadingText}>
                Loading 100 DWLR stations...
              </Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
  },
});
