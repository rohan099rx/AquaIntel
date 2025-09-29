import React, { useState } from "react";
import { View, StyleSheet, Text, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";

// Mock station data in case API call fails
const MOCK_STATIONS = [
  {
    station_id: "DWLR001",
    name: "Mumbai Central Station",
    state: "Maharashtra",
    district: "Mumbai",
    current_level: 12.5,
    trend: "rising",
    latitude: 19.076,
    longitude: 72.8777,
    last_updated: new Date().toISOString(),
  },
  {
    station_id: "DWLR002",
    name: "Bangalore Main Station",
    state: "Karnataka",
    district: "Bangalore",
    current_level: 8.3,
    trend: "falling",
    latitude: 12.9716,
    longitude: 77.5946,
    last_updated: new Date().toISOString(),
  },
  {
    station_id: "DWLR003",
    name: "Delhi DWLR Station",
    state: "Delhi",
    district: "New Delhi",
    current_level: 15.7,
    trend: "stable",
    latitude: 28.7041,
    longitude: 77.1025,
    last_updated: new Date().toISOString(),
  },
];

export default function MapScreen() {
  const [loading, setLoading] = useState(true);

  // Generate HTML content directly with mock data (no API dependency)
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
        .popup-content {
          padding: 10px;
          max-width: 200px;
        }
        .popup-content h3 {
          margin-top: 0;
          margin-bottom: 8px;
        }
        .trend-rising { color: #6ab04c; font-weight: bold; }
        .trend-falling { color: #eb4d4b; font-weight: bold; }
        .trend-stable { color: #3498db; font-weight: bold; }
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
        
        // Add markers from mock data
        const stations = ${JSON.stringify(MOCK_STATIONS)};
        
        stations.forEach(station => {
          const color = station.trend === 'rising' ? 'green' : 
                        station.trend === 'falling' ? 'red' : 'blue';
                        
          L.marker([station.latitude, station.longitude], {
            icon: L.divIcon({
              className: 'custom-marker-' + color,
              html: '<div class="marker-pin" style="background-color: ' + color + ';"></div>',
              iconSize: [30, 42],
              iconAnchor: [15, 42]
            })
          }).addTo(map)
          .bindPopup(
            '<div class="popup-content">' +
            '<h3>' + station.name + '</h3>' +
            '<p><strong>ID:</strong> ' + station.station_id + '</p>' +
            '<p><strong>Location:</strong> ' + station.district + ', ' + station.state + '</p>' +
            '<p><strong>Current Level:</strong> ' + station.current_level + ' meters</p>' +
            '<p><strong>Trend:</strong> <span class="trend-' + station.trend + '">' + station.trend + '</span></p>' +
            '<p><strong>Last Updated:</strong> ' + new Date(station.last_updated).toLocaleString() + '</p>' +
            '</div>'
          );
        });
        
        // Add legend
        const legend = L.control({position: 'bottomleft'});
        legend.onAdd = function(map) {
          const div = L.DomUtil.create('div', 'legend');
          div.innerHTML = '<h4>DWLR Station Status</h4>' +
            '<div><i style="background: #6ab04c"></i> Rising Water Level</div>' +
            '<div><i style="background: #eb4d4b"></i> Falling Water Level</div>' +
            '<div><i style="background: #3498db"></i> Stable Water Level</div>';
          return div;
        };
        legend.addTo(map);
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
              <Text style={styles.loadingText}>Loading map...</Text>
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
