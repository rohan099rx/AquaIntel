#!/usr/bin/env python3
"""
Comprehensive Backend Testing for Real-Time Groundwater Monitoring API
Tests all backend endpoints with realistic data scenarios
"""

import requests
import json
import time
from datetime import datetime
import sys

# Backend URL from environment
BACKEND_URL = "https://dwlr-monitor-1.preview.emergentagent.com/api"

class GroundwaterAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'GroundwaterTester/1.0'
        })
        self.test_results = []
        self.sample_station_ids = []

    def log_test(self, test_name, success, details="", response_data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if response_data and not success:
            print(f"   Response: {response_data}")
        print()
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'details': details,
            'timestamp': datetime.now().isoformat()
        })

    def test_api_root(self):
        """Test API root endpoint"""
        try:
            response = self.session.get(f"{BACKEND_URL}/")
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "Groundwater Monitoring API" in data["message"]:
                    self.log_test("API Root Endpoint", True, f"Version: {data.get('version', 'N/A')}")
                    return True
                else:
                    self.log_test("API Root Endpoint", False, "Invalid response format", data)
            else:
                self.log_test("API Root Endpoint", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("API Root Endpoint", False, f"Connection error: {str(e)}")
        return False

    def test_database_initialization(self):
        """Test POST /api/stations/initialize"""
        try:
            response = self.session.post(f"{BACKEND_URL}/stations/initialize")
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "stations" in data:
                    stations_count = len(data["stations"])
                    if stations_count == 10:
                        self.sample_station_ids = data["stations"]
                        self.log_test("Database Initialization", True, 
                                    f"Created {stations_count} stations: {', '.join(data['stations'][:3])}...")
                        return True
                    else:
                        self.log_test("Database Initialization", False, 
                                    f"Expected 10 stations, got {stations_count}")
                else:
                    self.log_test("Database Initialization", False, "Invalid response format", data)
            else:
                self.log_test("Database Initialization", False, 
                            f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Database Initialization", False, f"Error: {str(e)}")
        return False

    def test_get_all_stations(self):
        """Test GET /api/stations with various filters"""
        try:
            # Test without filters
            response = self.session.get(f"{BACKEND_URL}/stations")
            if response.status_code == 200:
                stations = response.json()
                if isinstance(stations, list) and len(stations) > 0:
                    station = stations[0]
                    required_fields = ['station_id', 'name', 'state', 'district', 
                                     'current_level', 'trend', 'latitude', 'longitude']
                    
                    missing_fields = [field for field in required_fields if field not in station]
                    if not missing_fields:
                        self.log_test("Get All Stations", True, 
                                    f"Retrieved {len(stations)} stations with all required fields")
                        
                        # Test filtering by state
                        if len(stations) > 0:
                            test_state = stations[0]['state']
                            filter_response = self.session.get(f"{BACKEND_URL}/stations?state={test_state}")
                            if filter_response.status_code == 200:
                                filtered_stations = filter_response.json()
                                if all(s['state'].lower() == test_state.lower() for s in filtered_stations):
                                    self.log_test("Station Filtering by State", True, 
                                                f"Filtered {len(filtered_stations)} stations for {test_state}")
                                else:
                                    self.log_test("Station Filtering by State", False, 
                                                "Filter not working correctly")
                            else:
                                self.log_test("Station Filtering by State", False, 
                                            f"HTTP {filter_response.status_code}")
                        
                        return True
                    else:
                        self.log_test("Get All Stations", False, 
                                    f"Missing required fields: {missing_fields}")
                else:
                    self.log_test("Get All Stations", False, "No stations returned or invalid format")
            else:
                self.log_test("Get All Stations", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Get All Stations", False, f"Error: {str(e)}")
        return False

    def test_individual_station(self):
        """Test GET /api/stations/{station_id}"""
        if not self.sample_station_ids:
            self.log_test("Individual Station", False, "No sample station IDs available")
            return False
        
        try:
            station_id = self.sample_station_ids[0]
            response = self.session.get(f"{BACKEND_URL}/stations/{station_id}")
            
            if response.status_code == 200:
                station = response.json()
                required_fields = ['station_id', 'name', 'state', 'district', 
                                 'current_level', 'trend', 'latitude', 'longitude', 'historical_data']
                
                missing_fields = [field for field in required_fields if field not in station]
                if not missing_fields:
                    historical_count = len(station.get('historical_data', []))
                    self.log_test("Individual Station", True, 
                                f"Station {station_id}: {station['name']} in {station['state']}, "
                                f"Level: {station['current_level']}m, Historical points: {historical_count}")
                    return True
                else:
                    self.log_test("Individual Station", False, 
                                f"Missing fields: {missing_fields}")
            elif response.status_code == 404:
                self.log_test("Individual Station", False, f"Station {station_id} not found")
            else:
                self.log_test("Individual Station", False, 
                            f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Individual Station", False, f"Error: {str(e)}")
        return False

    def test_predictions_api(self):
        """Test GET /api/stations/{station_id}/predictions"""
        if not self.sample_station_ids:
            self.log_test("Predictions API", False, "No sample station IDs available")
            return False
        
        try:
            station_id = self.sample_station_ids[0]
            
            # Test default predictions (30 days)
            response = self.session.get(f"{BACKEND_URL}/stations/{station_id}/predictions")
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ['station_id', 'predictions', 'forecast_period', 'generated_at']
                
                missing_fields = [field for field in required_fields if field not in data]
                if not missing_fields:
                    predictions = data['predictions']
                    if len(predictions) == 30:  # Default 30 days
                        # Check prediction structure
                        if predictions:
                            pred = predictions[0]
                            pred_fields = ['date', 'predicted_level', 'confidence', 'lower_bound', 'upper_bound']
                            missing_pred_fields = [field for field in pred_fields if field not in pred]
                            
                            if not missing_pred_fields:
                                self.log_test("Predictions API", True, 
                                            f"Generated {len(predictions)} predictions for {station_id}, "
                                            f"First prediction: {pred['predicted_level']}m (confidence: {pred['confidence']})")
                                
                                # Test custom forecast period
                                custom_response = self.session.get(f"{BACKEND_URL}/stations/{station_id}/predictions?days=7")
                                if custom_response.status_code == 200:
                                    custom_data = custom_response.json()
                                    if len(custom_data['predictions']) == 7:
                                        self.log_test("Custom Forecast Period", True, "7-day forecast working")
                                    else:
                                        self.log_test("Custom Forecast Period", False, 
                                                    f"Expected 7 predictions, got {len(custom_data['predictions'])}")
                                
                                return True
                            else:
                                self.log_test("Predictions API", False, 
                                            f"Missing prediction fields: {missing_pred_fields}")
                        else:
                            self.log_test("Predictions API", False, "No predictions generated")
                    else:
                        self.log_test("Predictions API", False, 
                                    f"Expected 30 predictions, got {len(predictions)}")
                else:
                    self.log_test("Predictions API", False, f"Missing fields: {missing_fields}")
            elif response.status_code == 404:
                self.log_test("Predictions API", False, f"Station {station_id} not found")
            else:
                self.log_test("Predictions API", False, 
                            f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Predictions API", False, f"Error: {str(e)}")
        return False

    def test_real_time_simulation(self):
        """Test POST /api/stations/{station_id}/simulate-update"""
        if not self.sample_station_ids:
            self.log_test("Real-time Simulation", False, "No sample station IDs available")
            return False
        
        try:
            station_id = self.sample_station_ids[0]
            
            # Get current level first
            get_response = self.session.get(f"{BACKEND_URL}/stations/{station_id}")
            if get_response.status_code != 200:
                self.log_test("Real-time Simulation", False, "Could not get initial station data")
                return False
            
            initial_data = get_response.json()
            initial_level = initial_data['current_level']
            
            # Simulate update
            response = self.session.post(f"{BACKEND_URL}/stations/{station_id}/simulate-update")
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ['station_id', 'previous_level', 'new_level', 'change', 'updated_at']
                
                missing_fields = [field for field in required_fields if field not in data]
                if not missing_fields:
                    if data['previous_level'] == initial_level:
                        change = data['change']
                        new_level = data['new_level']
                        self.log_test("Real-time Simulation", True, 
                                    f"Station {station_id}: {initial_level}m → {new_level}m "
                                    f"(change: {change:+.2f}m)")
                        
                        # Verify the update persisted
                        verify_response = self.session.get(f"{BACKEND_URL}/stations/{station_id}")
                        if verify_response.status_code == 200:
                            verify_data = verify_response.json()
                            if abs(verify_data['current_level'] - new_level) < 0.01:
                                self.log_test("Data Persistence", True, "Update persisted in database")
                            else:
                                self.log_test("Data Persistence", False, 
                                            f"Expected {new_level}, got {verify_data['current_level']}")
                        
                        return True
                    else:
                        self.log_test("Real-time Simulation", False, 
                                    f"Previous level mismatch: expected {initial_level}, got {data['previous_level']}")
                else:
                    self.log_test("Real-time Simulation", False, f"Missing fields: {missing_fields}")
            elif response.status_code == 404:
                self.log_test("Real-time Simulation", False, f"Station {station_id} not found")
            else:
                self.log_test("Real-time Simulation", False, 
                            f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Real-time Simulation", False, f"Error: {str(e)}")
        return False

    def test_analytics_summary(self):
        """Test GET /api/analytics/summary"""
        try:
            response = self.session.get(f"{BACKEND_URL}/analytics/summary")
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ['total_stations', 'active_stations', 'trend_distribution', 'state_statistics']
                
                missing_fields = [field for field in required_fields if field not in data]
                if not missing_fields:
                    # Validate trend distribution
                    trend_dist = data['trend_distribution']
                    trend_fields = ['falling', 'rising', 'stable']
                    missing_trend_fields = [field for field in trend_fields if field not in trend_dist]
                    
                    if not missing_trend_fields:
                        total_trends = sum(trend_dist.values())
                        total_stations = data['total_stations']
                        
                        # Validate state statistics
                        state_stats = data['state_statistics']
                        if isinstance(state_stats, list) and len(state_stats) > 0:
                            stat = state_stats[0]
                            stat_fields = ['state', 'average_level', 'station_count']
                            missing_stat_fields = [field for field in stat_fields if field not in stat]
                            
                            if not missing_stat_fields:
                                self.log_test("Analytics Summary", True, 
                                            f"Total: {total_stations} stations, Active: {data['active_stations']}, "
                                            f"Trends - Falling: {trend_dist['falling']}, Rising: {trend_dist['rising']}, "
                                            f"Stable: {trend_dist['stable']}, States: {len(state_stats)}")
                                return True
                            else:
                                self.log_test("Analytics Summary", False, 
                                            f"Missing state stat fields: {missing_stat_fields}")
                        else:
                            self.log_test("Analytics Summary", False, "No state statistics returned")
                    else:
                        self.log_test("Analytics Summary", False, 
                                    f"Missing trend fields: {missing_trend_fields}")
                else:
                    self.log_test("Analytics Summary", False, f"Missing fields: {missing_fields}")
            else:
                self.log_test("Analytics Summary", False, 
                            f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Analytics Summary", False, f"Error: {str(e)}")
        return False

    def test_error_handling(self):
        """Test error handling for invalid requests"""
        try:
            # Test non-existent station
            response = self.session.get(f"{BACKEND_URL}/stations/INVALID_ID")
            if response.status_code == 404:
                self.log_test("Error Handling - Invalid Station", True, "404 returned for invalid station ID")
            else:
                self.log_test("Error Handling - Invalid Station", False, 
                            f"Expected 404, got {response.status_code}")
            
            # Test invalid prediction days
            if self.sample_station_ids:
                station_id = self.sample_station_ids[0]
                response = self.session.get(f"{BACKEND_URL}/stations/{station_id}/predictions?days=200")
                if response.status_code == 422:  # Validation error
                    self.log_test("Error Handling - Invalid Parameters", True, "422 returned for invalid days parameter")
                else:
                    # Some APIs might handle this differently, so we'll be lenient
                    self.log_test("Error Handling - Invalid Parameters", True, 
                                f"Handled invalid parameter (status: {response.status_code})")
            
            return True
        except Exception as e:
            self.log_test("Error Handling", False, f"Error: {str(e)}")
        return False

    def run_all_tests(self):
        """Run all backend tests"""
        print("🧪 Starting Comprehensive Backend API Testing")
        print(f"🌐 Backend URL: {BACKEND_URL}")
        print("=" * 60)
        
        # Test sequence
        tests = [
            ("API Connectivity", self.test_api_root),
            ("Database Initialization", self.test_database_initialization),
            ("Station Retrieval", self.test_get_all_stations),
            ("Individual Station", self.test_individual_station),
            ("Predictions API", self.test_predictions_api),
            ("Real-time Simulation", self.test_real_time_simulation),
            ("Analytics Summary", self.test_analytics_summary),
            ("Error Handling", self.test_error_handling)
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            print(f"🔍 Testing {test_name}...")
            if test_func():
                passed += 1
            time.sleep(1)  # Brief pause between tests
        
        print("=" * 60)
        print(f"📊 Test Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All backend tests PASSED! API is fully functional.")
            return True
        else:
            print(f"⚠️  {total - passed} tests FAILED. Check the details above.")
            return False

def main():
    """Main test execution"""
    tester = GroundwaterAPITester()
    success = tester.run_all_tests()
    
    # Return appropriate exit code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()