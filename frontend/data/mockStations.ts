export interface DWLRStation {
  station_id: string;
  name: string;
  state: string;
  district: string;
  current_level: number;
  status: "active" | "inactive" | "maintenance";
  trend: "rising" | "falling" | "stable";
  last_updated: string;
  latitude: number;
  longitude: number;
  historical_data: HistoricalData[];
  water_quality: WaterQuality;
}

export interface HistoricalData {
  date: string;
  level: number;
  temperature: number;
  rainfall: number;
  pH: number;
  dissolved_oxygen: number;
}

export interface WaterQuality {
  pH: number;
  dissolved_oxygen: number;
  quality_index: number;
  status: "excellent" | "good" | "fair" | "poor";
}

// Indian states and their major districts with coordinates
const INDIAN_LOCATIONS = [
  // Maharashtra
  { state: "Maharashtra", district: "Mumbai", lat: 19.076, lng: 72.8777 },
  { state: "Maharashtra", district: "Pune", lat: 18.5204, lng: 73.8567 },
  { state: "Maharashtra", district: "Nagpur", lat: 21.1458, lng: 79.0882 },
  { state: "Maharashtra", district: "Nashik", lat: 19.9975, lng: 73.7898 },
  { state: "Maharashtra", district: "Aurangabad", lat: 19.8762, lng: 75.3433 },

  // Karnataka
  { state: "Karnataka", district: "Bangalore", lat: 12.9716, lng: 77.5946 },
  { state: "Karnataka", district: "Mysore", lat: 12.2958, lng: 76.6394 },
  { state: "Karnataka", district: "Hubli", lat: 15.3647, lng: 75.124 },
  { state: "Karnataka", district: "Mangalore", lat: 12.9141, lng: 74.856 },
  { state: "Karnataka", district: "Belgaum", lat: 15.8497, lng: 74.4977 },

  // Tamil Nadu
  { state: "Tamil Nadu", district: "Chennai", lat: 13.0827, lng: 80.2707 },
  { state: "Tamil Nadu", district: "Coimbatore", lat: 11.0168, lng: 76.9558 },
  { state: "Tamil Nadu", district: "Madurai", lat: 9.9252, lng: 78.1198 },
  { state: "Tamil Nadu", district: "Trichy", lat: 10.7905, lng: 78.7047 },
  { state: "Tamil Nadu", district: "Salem", lat: 11.6643, lng: 78.146 },

  // Gujarat
  { state: "Gujarat", district: "Ahmedabad", lat: 23.0225, lng: 72.5714 },
  { state: "Gujarat", district: "Surat", lat: 21.1702, lng: 72.8311 },
  { state: "Gujarat", district: "Vadodara", lat: 22.3072, lng: 73.1812 },
  { state: "Gujarat", district: "Rajkot", lat: 22.3039, lng: 70.8022 },
  { state: "Gujarat", district: "Bhavnagar", lat: 21.7645, lng: 72.1519 },

  // Rajasthan
  { state: "Rajasthan", district: "Jaipur", lat: 26.9124, lng: 75.7873 },
  { state: "Rajasthan", district: "Jodhpur", lat: 26.2389, lng: 73.0243 },
  { state: "Rajasthan", district: "Udaipur", lat: 24.5854, lng: 73.7125 },
  { state: "Rajasthan", district: "Kota", lat: 25.2138, lng: 75.8648 },
  { state: "Rajasthan", district: "Bikaner", lat: 28.0229, lng: 73.3119 },

  // Uttar Pradesh
  { state: "Uttar Pradesh", district: "Lucknow", lat: 26.8467, lng: 80.9462 },
  { state: "Uttar Pradesh", district: "Kanpur", lat: 26.4499, lng: 80.3319 },
  { state: "Uttar Pradesh", district: "Agra", lat: 27.1767, lng: 78.0081 },
  { state: "Uttar Pradesh", district: "Varanasi", lat: 25.3176, lng: 82.9739 },
  { state: "Uttar Pradesh", district: "Allahabad", lat: 25.4358, lng: 81.8463 },

  // West Bengal
  { state: "West Bengal", district: "Kolkata", lat: 22.5726, lng: 88.3639 },
  { state: "West Bengal", district: "Howrah", lat: 22.5958, lng: 88.2636 },
  { state: "West Bengal", district: "Durgapur", lat: 23.5204, lng: 87.3119 },
  { state: "West Bengal", district: "Asansol", lat: 23.6839, lng: 86.9523 },
  { state: "West Bengal", district: "Siliguri", lat: 26.7271, lng: 88.3953 },

  // Andhra Pradesh
  {
    state: "Andhra Pradesh",
    district: "Visakhapatnam",
    lat: 17.6868,
    lng: 83.2185,
  },
  {
    state: "Andhra Pradesh",
    district: "Vijayawada",
    lat: 16.5062,
    lng: 80.648,
  },
  { state: "Andhra Pradesh", district: "Guntur", lat: 16.3067, lng: 80.4365 },
  { state: "Andhra Pradesh", district: "Nellore", lat: 14.4426, lng: 79.9865 },
  { state: "Andhra Pradesh", district: "Tirupati", lat: 13.6288, lng: 79.4192 },

  // Telangana
  { state: "Telangana", district: "Hyderabad", lat: 17.385, lng: 78.4867 },
  { state: "Telangana", district: "Warangal", lat: 17.9689, lng: 79.5941 },
  { state: "Telangana", district: "Nizamabad", lat: 18.6725, lng: 78.0941 },
  { state: "Telangana", district: "Karimnagar", lat: 18.4386, lng: 79.1288 },

  // Kerala
  {
    state: "Kerala",
    district: "Thiruvananthapuram",
    lat: 8.5241,
    lng: 76.9366,
  },
  { state: "Kerala", district: "Kochi", lat: 9.9312, lng: 76.2673 },
  { state: "Kerala", district: "Kozhikode", lat: 11.2588, lng: 75.7804 },
  { state: "Kerala", district: "Thrissur", lat: 10.5276, lng: 76.2144 },

  // Madhya Pradesh
  { state: "Madhya Pradesh", district: "Bhopal", lat: 23.2599, lng: 77.4126 },
  { state: "Madhya Pradesh", district: "Indore", lat: 22.7196, lng: 75.8577 },
  { state: "Madhya Pradesh", district: "Gwalior", lat: 26.2183, lng: 78.1828 },
  { state: "Madhya Pradesh", district: "Jabalpur", lat: 23.1815, lng: 79.9864 },

  // Other states
  { state: "Delhi", district: "New Delhi", lat: 28.6139, lng: 77.209 },
  { state: "Punjab", district: "Amritsar", lat: 31.634, lng: 74.8723 },
  { state: "Punjab", district: "Ludhiana", lat: 30.901, lng: 75.8573 },
  { state: "Haryana", district: "Gurgaon", lat: 28.4595, lng: 77.0266 },
  { state: "Haryana", district: "Faridabad", lat: 28.4089, lng: 77.3178 },
  { state: "Bihar", district: "Patna", lat: 25.5941, lng: 85.1376 },
  { state: "Bihar", district: "Gaya", lat: 24.7914, lng: 85.0002 },
  { state: "Jharkhand", district: "Ranchi", lat: 23.3441, lng: 85.3096 },
  { state: "Jharkhand", district: "Jamshedpur", lat: 22.8046, lng: 86.2029 },
  { state: "Odisha", district: "Bhubaneswar", lat: 20.2961, lng: 85.8245 },
  { state: "Odisha", district: "Cuttack", lat: 20.4625, lng: 85.8828 },
  { state: "Chhattisgarh", district: "Raipur", lat: 21.2514, lng: 81.6296 },
  { state: "Assam", district: "Guwahati", lat: 26.1445, lng: 91.7362 },
  { state: "Himachal Pradesh", district: "Shimla", lat: 31.1048, lng: 77.1734 },
  { state: "Uttarakhand", district: "Dehradun", lat: 30.3165, lng: 78.0322 },
];

const STATION_TYPES = [
  "Central Monitoring Station",
  "Urban DWLR Well",
  "Agricultural Zone Monitor",
  "Industrial Area Station",
  "Coastal Monitoring Point",
  "Desert Region Well",
  "Forest Area Monitor",
  "Railway Station Well",
  "Highway Junction Station",
  "Market District Monitor",
  "Residential Area Well",
  "Educational Campus Station",
  "Hospital Zone Monitor",
  "Temple Complex Well",
  "Park Area Monitor",
  "Shopping Mall Station",
  "Airport Vicinity Well",
  "River Basin Monitor",
  "Mountain Region Station",
  "Valley Area Well",
];

// Generate random historical data
const generateHistoricalData = (
  currentLevel: number,
  trend: string
): HistoricalData[] => {
  const data: HistoricalData[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 90); // 90 days of historical data

  let baseLevel = currentLevel;

  for (let i = 0; i < 90; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);

    // Apply trend
    if (trend === "falling") {
      baseLevel = currentLevel + (90 - i) * 0.02 + Math.random() * 1 - 0.5;
    } else if (trend === "rising") {
      baseLevel = currentLevel - (90 - i) * 0.02 + Math.random() * 1 - 0.5;
    } else {
      baseLevel = currentLevel + Math.random() * 2 - 1;
    }

    // Ensure positive levels
    baseLevel = Math.max(0.5, baseLevel);

    // Add seasonal variation
    const seasonalFactor = 0.5 * Math.sin((i / 365) * 2 * Math.PI);
    const level = baseLevel + seasonalFactor;

    data.push({
      date: date.toISOString().split("T")[0],
      level: Math.round(level * 100) / 100,
      temperature:
        Math.round(
          (20 + Math.random() * 15 + Math.sin((i / 365) * 2 * Math.PI) * 5) * 10
        ) / 10,
      rainfall: Math.round(Math.random() * 50 * 10) / 10,
      pH: Math.round((6.5 + Math.random() * 2) * 10) / 10,
      dissolved_oxygen: Math.round((4 + Math.random() * 6) * 10) / 10,
    });
  }

  return data;
};

// Calculate water quality
const calculateWaterQuality = (
  pH: number,
  dissolvedOxygen: number
): WaterQuality => {
  // pH factor (0-100): best at 7.0, worse as it deviates
  const pHFactor = Math.max(0, 100 - Math.abs(pH - 7.0) * 20);

  // Dissolved oxygen factor (0-100): higher is better up to 10 mg/L
  const doFactor = Math.min(100, (dissolvedOxygen / 10) * 100);

  // Average the factors for overall index
  const qualityIndex = (pHFactor + doFactor) / 2;

  let status: "excellent" | "good" | "fair" | "poor";
  if (qualityIndex >= 80) status = "excellent";
  else if (qualityIndex >= 60) status = "good";
  else if (qualityIndex >= 40) status = "fair";
  else status = "poor";

  return {
    pH,
    dissolved_oxygen: dissolvedOxygen,
    quality_index: Math.round(qualityIndex),
    status,
  };
};

// Generate station ID
const generateStationId = (index: number): string => {
  const prefix = "DWLR";
  const randomString = Math.random()
    .toString(36)
    .substring(2, 10)
    .toUpperCase();
  return `${prefix}${String(index).padStart(3, "0")}${randomString.substring(
    0,
    4
  )}`;
};

// Generate 100 DWLR stations
export const generateMockStations = (): DWLRStation[] => {
  const stations: DWLRStation[] = [];

  for (let i = 0; i < 100; i++) {
    // Select location (cycle through available locations)
    const location = INDIAN_LOCATIONS[i % INDIAN_LOCATIONS.length];

    // Add small random offset to coordinates for variety
    const latOffset = (Math.random() - 0.5) * 0.1;
    const lngOffset = (Math.random() - 0.5) * 0.1;

    // Generate station properties
    const trend: "rising" | "falling" | "stable" =
      Math.random() < 0.3
        ? "falling"
        : Math.random() < 0.6
        ? "rising"
        : "stable";

    const currentLevel = Math.round((Math.random() * 45 + 5) * 100) / 100; // 5-50 meters

    const status: "active" | "inactive" | "maintenance" =
      Math.random() < 0.85
        ? "active"
        : Math.random() < 0.95
        ? "maintenance"
        : "inactive";

    const stationType =
      STATION_TYPES[Math.floor(Math.random() * STATION_TYPES.length)];

    // Generate historical data
    const historicalData = generateHistoricalData(currentLevel, trend);
    const latestData = historicalData[historicalData.length - 1];

    // Calculate water quality
    const waterQuality = calculateWaterQuality(
      latestData.pH,
      latestData.dissolved_oxygen
    );

    // Create station
    const station: DWLRStation = {
      station_id: generateStationId(i + 1),
      name: `${stationType} ${i + 1}`,
      state: location.state,
      district: location.district,
      current_level: currentLevel,
      status,
      trend,
      last_updated: new Date().toISOString(),
      latitude: location.lat + latOffset,
      longitude: location.lng + lngOffset,
      historical_data: historicalData,
      water_quality: waterQuality,
    };

    stations.push(station);
  }

  return stations;
};

// Export the generated stations
export const MOCK_STATIONS: DWLRStation[] = generateMockStations();

// Export helper functions for analytics
export const getStationsByState = (state: string): DWLRStation[] => {
  return MOCK_STATIONS.filter((station) => station.state === state);
};

export const getStationsByTrend = (
  trend: "rising" | "falling" | "stable"
): DWLRStation[] => {
  return MOCK_STATIONS.filter((station) => station.trend === trend);
};

export const getStationsByStatus = (
  status: "active" | "inactive" | "maintenance"
): DWLRStation[] => {
  return MOCK_STATIONS.filter((station) => station.status === status);
};

export const getAverageWaterLevel = (): number => {
  const total = MOCK_STATIONS.reduce(
    (sum, station) => sum + station.current_level,
    0
  );
  return Math.round((total / MOCK_STATIONS.length) * 100) / 100;
};

export const getStateStatistics = () => {
  const stateStats: {
    [key: string]: { count: number; avgLevel: number; totalLevel: number };
  } = {};

  MOCK_STATIONS.forEach((station) => {
    if (!stateStats[station.state]) {
      stateStats[station.state] = { count: 0, avgLevel: 0, totalLevel: 0 };
    }
    stateStats[station.state].count++;
    stateStats[station.state].totalLevel += station.current_level;
  });

  // Calculate averages
  Object.keys(stateStats).forEach((state) => {
    stateStats[state].avgLevel =
      Math.round(
        (stateStats[state].totalLevel / stateStats[state].count) * 100
      ) / 100;
  });

  return Object.entries(stateStats).map(([state, stats]) => ({
    state,
    stationCount: stats.count,
    averageLevel: stats.avgLevel,
  }));
};
