import * as FileSystem from "expo-file-system";
import { Asset } from "expo-asset";

export interface CSVRow {
  Date: string;
  Water_Level_m: number;
  Temperature_C: number;
  Rainfall_mm: number;
  pH: number;
  Dissolved_Oxygen_mg_L: number;
}

export interface Station {
  station_id: string;
  name: string;
  state: string;
  district: string;
  current_level: number;
  trend: string;
  latitude: number;
  longitude: number;
  last_updated: string;
  historical_data: CSVRow[];
  water_quality: {
    pH: number;
    dissolved_oxygen: number;
    quality_index: number;
    status: string;
  };
}

// Predefined station locations to map CSV data to
const STATION_LOCATIONS = [
  {
    station_id: "DWLR001",
    name: "Mumbai Central DWLR",
    state: "Maharashtra",
    district: "Mumbai",
    latitude: 19.076,
    longitude: 72.8777,
  },
  {
    station_id: "DWLR002",
    name: "Bangalore Main DWLR",
    state: "Karnataka",
    district: "Bangalore",
    latitude: 12.9716,
    longitude: 77.5946,
  },
  {
    station_id: "DWLR003",
    name: "Delhi Central DWLR",
    state: "Delhi",
    district: "New Delhi",
    latitude: 28.7041,
    longitude: 77.1025,
  },
  {
    station_id: "DWLR004",
    name: "Chennai Coastal DWLR",
    state: "Tamil Nadu",
    district: "Chennai",
    latitude: 13.0827,
    longitude: 80.2707,
  },
  {
    station_id: "DWLR005",
    name: "Jaipur Desert DWLR",
    state: "Rajasthan",
    district: "Jaipur",
    latitude: 26.9124,
    longitude: 75.7873,
  },
];

export const loadCSVData = async (): Promise<CSVRow[]> => {
  try {
    // Try to load the CSV file from assets
    const asset = Asset.fromModule(
      require("/Users/admin/Developer/sihapp/app/frontend/assets/data/DWLR_Dataset_2023.csv")
    );
    await asset.downloadAsync();

    const csvContent = await FileSystem.readAsStringAsync(asset.localUri!);

    // Parse CSV content
    const lines = csvContent.trim().split("\n");
    const headers = lines[0].split(",");
    const data: CSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",");
      if (values.length === headers.length) {
        data.push({
          Date: values[0],
          Water_Level_m: parseFloat(values[1]),
          Temperature_C: parseFloat(values[2]),
          Rainfall_mm: parseFloat(values[3]),
          pH: parseFloat(values[4]),
          Dissolved_Oxygen_mg_L: parseFloat(values[5]),
        });
      }
    }

    return data;
  } catch (error) {
    console.error("Error loading CSV data:", error);
    // Return fallback data if CSV loading fails
    return generateFallbackData();
  }
};

const generateFallbackData = (): CSVRow[] => {
  const data: CSVRow[] = [];
  const startDate = new Date("2023-01-01");

  for (let i = 0; i < 365; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    data.push({
      Date: date.toISOString().split("T")[0],
      Water_Level_m: 2.0 + Math.random() * 0.5 - 0.25,
      Temperature_C: 15 + Math.random() * 20,
      Rainfall_mm: Math.random() * 50,
      pH: 6.5 + Math.random() * 1.5,
      Dissolved_Oxygen_mg_L: 6 + Math.random() * 3,
    });
  }

  return data;
};

export const processDataIntoStations = (csvData: CSVRow[]): Station[] => {
  const stations: Station[] = [];
  const dataPerStation = Math.ceil(csvData.length / STATION_LOCATIONS.length);

  STATION_LOCATIONS.forEach((location, index) => {
    const startIndex = index * dataPerStation;
    const endIndex = Math.min(startIndex + dataPerStation, csvData.length);
    const stationData = csvData.slice(startIndex, endIndex);

    if (stationData.length === 0) return;

    // Calculate trend
    const recentData = stationData.slice(-5);
    let trend = "stable";
    if (recentData.length > 1) {
      const firstLevel = recentData[0].Water_Level_m;
      const lastLevel = recentData[recentData.length - 1].Water_Level_m;
      if (lastLevel > firstLevel * 1.05) trend = "rising";
      else if (lastLevel < firstLevel * 0.95) trend = "falling";
    }

    const latestData = stationData[stationData.length - 1];

    // Calculate water quality
    const qualityIndex = calculateQualityIndex(
      latestData.pH,
      latestData.Dissolved_Oxygen_mg_L
    );
    const qualityStatus = getQualityStatus(qualityIndex);

    stations.push({
      ...location,
      current_level: latestData.Water_Level_m,
      trend,
      last_updated: latestData.Date,
      historical_data: stationData,
      water_quality: {
        pH: latestData.pH,
        dissolved_oxygen: latestData.Dissolved_Oxygen_mg_L,
        quality_index: qualityIndex,
        status: qualityStatus,
      },
    });
  });

  return stations;
};

const calculateQualityIndex = (pH: number, dissolvedOxygen: number): number => {
  // pH factor (0-100): best at 7.0, worse as it deviates
  const pHFactor = Math.max(0, 100 - Math.abs(pH - 7.0) * 20);

  // Dissolved oxygen factor (0-100): higher is better up to 10 mg/L
  const doFactor = Math.min(100, dissolvedOxygen * 10);

  // Average the factors for overall index
  return (pHFactor + doFactor) / 2;
};

const getQualityStatus = (qualityIndex: number): string => {
  if (qualityIndex >= 80) return "excellent";
  if (qualityIndex >= 60) return "good";
  if (qualityIndex >= 40) return "fair";
  return "poor";
};

export const generatePredictions = (
  historicalData: CSVRow[],
  days: number = 30
) => {
  const levels = historicalData.map((d) => d.Water_Level_m);
  const lastLevel = levels[levels.length - 1];
  const trend = calculateTrendFromData(levels);

  const predictions = [];
  const lastDate = new Date(historicalData[historicalData.length - 1].Date);

  for (let i = 1; i <= days; i++) {
    const predDate = new Date(lastDate);
    predDate.setDate(predDate.getDate() + i);

    // Simple linear prediction with some randomness
    const trendFactor = trend * i * 0.01;
    const seasonalFactor = 0.1 * Math.sin((2 * Math.PI * i) / 365);
    const randomFactor = (Math.random() - 0.5) * 0.05;

    const predictedLevel = Math.max(
      0,
      lastLevel + trendFactor + seasonalFactor + randomFactor
    );

    predictions.push({
      date: predDate.toISOString().split("T")[0],
      predicted_level: parseFloat(predictedLevel.toFixed(3)),
      confidence: Math.max(0.5, 1 - i * 0.01),
    });
  }

  return predictions;
};

const calculateTrendFromData = (levels: number[]): number => {
  if (levels.length < 2) return 0;

  const n = levels.length;
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumXX = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += levels[i];
    sumXY += i * levels[i];
    sumXX += i * i;
  }

  return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
};
