import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DWLRStation } from "../data/mockStations";

interface FilterSearchProps {
  stations: DWLRStation[];
  onFilter: (filteredStations: DWLRStation[]) => void;
  onSearch: (searchTerm: string) => void;
}

interface FilterOptions {
  states: string[];
  districts: string[];
  trends: ("rising" | "falling" | "stable")[];
  statuses: ("active" | "inactive" | "maintenance")[];
  waterLevelRange: { min: number; max: number };
  qualityStatuses: ("excellent" | "good" | "fair" | "poor")[];
}

export default function FilterSearch({
  stations,
  onFilter,
  onSearch,
}: FilterSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    states: [],
    districts: [],
    trends: [],
    statuses: [],
    waterLevelRange: { min: 0, max: 100 },
    qualityStatuses: [],
  });

  // Get unique values for filter options
  const getUniqueStates = () =>
    [...new Set(stations.map((s) => s.state))].sort();
  const getUniqueDistricts = () =>
    [...new Set(stations.map((s) => s.district))].sort();
  const getDistrictsForStates = () => {
    if (filters.states.length === 0) return getUniqueDistricts();
    return [
      ...new Set(
        stations
          .filter((s) => filters.states.includes(s.state))
          .map((s) => s.district)
      ),
    ].sort();
  };

  const handleSearch = (text: string) => {
    setSearchTerm(text);
    onSearch(text);
  };

  const toggleFilter = (type: keyof FilterOptions, value: any) => {
    setFilters((prev) => {
      const newFilters = { ...prev };

      if (Array.isArray(newFilters[type])) {
        const array = newFilters[type] as any[];
        if (array.includes(value)) {
          newFilters[type] = array.filter((item) => item !== value) as any;
        } else {
          newFilters[type] = [...array, value] as any;
        }
      }

      return newFilters;
    });
  };

  const applyFilters = () => {
    let filtered = stations;

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (station) =>
          station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          station.station_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          station.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
          station.district.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // State filter
    if (filters.states.length > 0) {
      filtered = filtered.filter((station) =>
        filters.states.includes(station.state)
      );
    }

    // District filter
    if (filters.districts.length > 0) {
      filtered = filtered.filter((station) =>
        filters.districts.includes(station.district)
      );
    }

    // Trend filter
    if (filters.trends.length > 0) {
      filtered = filtered.filter((station) =>
        filters.trends.includes(station.trend)
      );
    }

    // Status filter
    if (filters.statuses.length > 0) {
      filtered = filtered.filter((station) =>
        filters.statuses.includes(station.status)
      );
    }

    // Water level range filter
    filtered = filtered.filter(
      (station) =>
        station.current_level >= filters.waterLevelRange.min &&
        station.current_level <= filters.waterLevelRange.max
    );

    // Quality status filter
    if (filters.qualityStatuses.length > 0) {
      filtered = filtered.filter((station) =>
        filters.qualityStatuses.includes(station.water_quality.status)
      );
    }

    onFilter(filtered);
    setShowFilters(false);

    Alert.alert(
      "Filters Applied",
      `Found ${filtered.length} stations matching your criteria.`,
      [{ text: "OK" }]
    );
  };

  const clearFilters = () => {
    setFilters({
      states: [],
      districts: [],
      trends: [],
      statuses: [],
      waterLevelRange: { min: 0, max: 100 },
      qualityStatuses: [],
    });
    setSearchTerm("");
    onFilter(stations);
    onSearch("");
  };

  const getActiveFilterCount = () => {
    return (
      filters.states.length +
      filters.districts.length +
      filters.trends.length +
      filters.statuses.length +
      filters.qualityStatuses.length +
      (searchTerm.trim() ? 1 : 0)
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#666"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search stations, IDs, states, districts..."
            value={searchTerm}
            onChangeText={handleSearch}
            placeholderTextColor="#999"
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity
              onPress={() => handleSearch("")}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Button */}
        <TouchableOpacity
          style={[
            styles.filterButton,
            getActiveFilterCount() > 0 && styles.filterButtonActive,
          ]}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons
            name="filter"
            size={20}
            color={getActiveFilterCount() > 0 ? "#fff" : "#666"}
          />
          {getActiveFilterCount() > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>
                {getActiveFilterCount()}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Quick Filter Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.quickFilters}
      >
        <TouchableOpacity
          style={[
            styles.quickFilterPill,
            filters.trends.includes("rising") && styles.quickFilterActive,
          ]}
          onPress={() => toggleFilter("trends", "rising")}
        >
          <Text
            style={[
              styles.quickFilterText,
              filters.trends.includes("rising") && styles.quickFilterActiveText,
            ]}
          >
            Rising
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.quickFilterPill,
            filters.trends.includes("falling") && styles.quickFilterActive,
          ]}
          onPress={() => toggleFilter("trends", "falling")}
        >
          <Text
            style={[
              styles.quickFilterText,
              filters.trends.includes("falling") &&
                styles.quickFilterActiveText,
            ]}
          >
            Falling
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.quickFilterPill,
            filters.statuses.includes("active") && styles.quickFilterActive,
          ]}
          onPress={() => toggleFilter("statuses", "active")}
        >
          <Text
            style={[
              styles.quickFilterText,
              filters.statuses.includes("active") &&
                styles.quickFilterActiveText,
            ]}
          >
            Active
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.quickFilterPill,
            filters.qualityStatuses.includes("excellent") &&
              styles.quickFilterActive,
          ]}
          onPress={() => toggleFilter("qualityStatuses", "excellent")}
        >
          <Text
            style={[
              styles.quickFilterText,
              filters.qualityStatuses.includes("excellent") &&
                styles.quickFilterActiveText,
            ]}
          >
            Excellent Quality
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Filter Stations</Text>
            <TouchableOpacity onPress={clearFilters}>
              <Text style={styles.clearText}>Clear All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* States Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>States</Text>
              <View style={styles.filterOptions}>
                {getUniqueStates().map((state) => (
                  <TouchableOpacity
                    key={state}
                    style={[
                      styles.filterOption,
                      filters.states.includes(state) &&
                        styles.filterOptionActive,
                    ]}
                    onPress={() => toggleFilter("states", state)}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        filters.states.includes(state) &&
                          styles.filterOptionActiveText,
                      ]}
                    >
                      {state}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Districts Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Districts</Text>
              <View style={styles.filterOptions}>
                {getDistrictsForStates().map((district) => (
                  <TouchableOpacity
                    key={district}
                    style={[
                      styles.filterOption,
                      filters.districts.includes(district) &&
                        styles.filterOptionActive,
                    ]}
                    onPress={() => toggleFilter("districts", district)}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        filters.districts.includes(district) &&
                          styles.filterOptionActiveText,
                      ]}
                    >
                      {district}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Trend Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Water Level Trends</Text>
              <View style={styles.filterOptions}>
                {["rising", "falling", "stable"].map((trend) => (
                  <TouchableOpacity
                    key={trend}
                    style={[
                      styles.filterOption,
                      filters.trends.includes(trend as any) &&
                        styles.filterOptionActive,
                    ]}
                    onPress={() => toggleFilter("trends", trend)}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        filters.trends.includes(trend as any) &&
                          styles.filterOptionActiveText,
                      ]}
                    >
                      {trend.charAt(0).toUpperCase() + trend.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Status Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Station Status</Text>
              <View style={styles.filterOptions}>
                {["active", "inactive", "maintenance"].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.filterOption,
                      filters.statuses.includes(status as any) &&
                        styles.filterOptionActive,
                    ]}
                    onPress={() => toggleFilter("statuses", status)}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        filters.statuses.includes(status as any) &&
                          styles.filterOptionActiveText,
                      ]}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Water Quality Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Water Quality</Text>
              <View style={styles.filterOptions}>
                {["excellent", "good", "fair", "poor"].map((quality) => (
                  <TouchableOpacity
                    key={quality}
                    style={[
                      styles.filterOption,
                      filters.qualityStatuses.includes(quality as any) &&
                        styles.filterOptionActive,
                    ]}
                    onPress={() => toggleFilter("qualityStatuses", quality)}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        filters.qualityStatuses.includes(quality as any) &&
                          styles.filterOptionActiveText,
                      ]}
                    >
                      {quality.charAt(0).toUpperCase() + quality.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Water Level Range */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>
                Water Level Range (meters)
              </Text>
              <View style={styles.rangeContainer}>
                <View style={styles.rangeInputContainer}>
                  <Text style={styles.rangeLabel}>Min:</Text>
                  <TextInput
                    style={styles.rangeInput}
                    value={filters.waterLevelRange.min.toString()}
                    onChangeText={(text) => {
                      const value = parseFloat(text) || 0;
                      setFilters((prev) => ({
                        ...prev,
                        waterLevelRange: {
                          ...prev.waterLevelRange,
                          min: value,
                        },
                      }));
                    }}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
                <View style={styles.rangeInputContainer}>
                  <Text style={styles.rangeLabel}>Max:</Text>
                  <TextInput
                    style={styles.rangeInput}
                    value={filters.waterLevelRange.max.toString()}
                    onChangeText={(text) => {
                      const value = parseFloat(text) || 100;
                      setFilters((prev) => ({
                        ...prev,
                        waterLevelRange: {
                          ...prev.waterLevelRange,
                          max: value,
                        },
                      }));
                    }}
                    keyboardType="numeric"
                    placeholder="100"
                  />
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 45,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  clearButton: {
    padding: 5,
  },
  filterButton: {
    width: 45,
    height: 45,
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  filterButtonActive: {
    backgroundColor: "#2196F3",
  },
  filterBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#FF5722",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  quickFilters: {
    marginTop: 10,
    flexDirection: "row",
  },
  quickFilterPill: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  quickFilterActive: {
    backgroundColor: "#2196F3",
  },
  quickFilterText: {
    fontSize: 14,
    color: "#666",
  },
  quickFilterActiveText: {
    color: "#fff",
    fontWeight: "500",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  clearText: {
    color: "#2196F3",
    fontSize: 16,
    fontWeight: "500",
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  filterSection: {
    marginBottom: 30,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  filterOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  filterOption: {
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  filterOptionActive: {
    backgroundColor: "#2196F3",
    borderColor: "#2196F3",
  },
  filterOptionText: {
    fontSize: 14,
    color: "#666",
  },
  filterOptionActiveText: {
    color: "#fff",
    fontWeight: "500",
  },
  rangeContainer: {
    flexDirection: "row",
    gap: 20,
  },
  rangeInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rangeLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  rangeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: "#f8f9fa",
  },
  modalActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  applyButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  applyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
