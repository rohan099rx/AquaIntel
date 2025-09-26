from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
import requests
import json
import random
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Groundwater Monitoring API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Pydantic Models
class GroundwaterStation(BaseModel):
    station_id: str
    name: str
    state: str
    district: str
    current_level: float
    status: str = "active"
    trend: str  # rising, falling, stable
    last_updated: datetime
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    historical_data: Optional[List[Dict]] = []

class GroundwaterStationCreate(BaseModel):
    station_id: str
    name: str
    state: str
    district: str
    current_level: float
    status: str = "active"
    trend: str

class PredictionData(BaseModel):
    station_id: str
    predictions: List[Dict]
    forecast_period: int = 30  # days

class AlertThreshold(BaseModel):
    station_id: str
    min_level: float
    max_level: float
    alert_type: str = "critical"

# Geocoding helper function
async def get_coordinates(state: str, district: str):
    """Get coordinates using a free geocoding service"""
    try:
        # Using Nominatim (OpenStreetMap) geocoding service
        query = f"{district}, {state}, India"
        url = f"https://nominatim.openstreetmap.org/search?format=json&q={query}&limit=1"
        
        response = requests.get(url, headers={'User-Agent': 'GroundwaterApp/1.0'})
        if response.status_code == 200:
            data = response.json()
            if data:
                return float(data[0]['lat']), float(data[0]['lon'])
    except Exception as e:
        logging.error(f"Geocoding error for {state}, {district}: {e}")
    
    # Fallback: return approximate coordinates for major Indian states
    state_coords = {
        "rajasthan": (26.9124, 75.7873),
        "andhra pradesh": (14.7504, 78.5705),
        "karnataka": (15.3173, 75.7139),
        "bihar": (25.0961, 85.3131),
        "madhya pradesh": (23.4734, 77.9474),
        "chhattisgarh": (21.2787, 81.8661),
        "himachal pradesh": (31.1048, 77.1734),
        "meghalaya": (25.4670, 91.3662),
        "sikkim": (27.5330, 88.5122)
    }
    
    coords = state_coords.get(state.lower(), (20.5937, 78.9629))  # Default to center of India
    # Add some random offset for district-level variation
    lat_offset = random.uniform(-0.5, 0.5)
    lon_offset = random.uniform(-0.5, 0.5)
    return coords[0] + lat_offset, coords[1] + lon_offset

# Historical data generation for trend analysis
def generate_historical_data(current_level: float, trend: str, days_back: int = 90):
    """Generate synthetic historical data based on current level and trend"""
    historical = []
    base_date = datetime.utcnow() - timedelta(days=days_back)
    
    for i in range(days_back):
        date = base_date + timedelta(days=i)
        
        # Create realistic variations based on trend
        if trend == "falling":
            level = current_level + (days_back - i) * 0.1 + random.uniform(-0.5, 0.5)
        elif trend == "rising":
            level = current_level - (days_back - i) * 0.1 + random.uniform(-0.5, 0.5)
        else:  # stable
            level = current_level + random.uniform(-2, 2)
        
        level = max(0, level)  # Ensure positive water levels
        
        historical.append({
            "date": date.isoformat(),
            "level": round(level, 2),
            "temperature": round(random.uniform(15, 35), 1),
            "rainfall": round(random.uniform(0, 50), 1) if random.random() > 0.7 else 0
        })
    
    return historical

# SARIMA-like prediction algorithm
def generate_predictions(historical_data: List[Dict], days_ahead: int = 30):
    """Simple trend-based prediction algorithm (simulating SARIMA)"""
    if len(historical_data) < 7:
        return []
    
    # Extract levels from historical data
    levels = [point["level"] for point in historical_data[-30:]]  # Last 30 days
    
    # Calculate trend and seasonality
    trend = np.polyfit(range(len(levels)), levels, 1)[0]  # Linear trend
    mean_level = np.mean(levels)
    std_level = np.std(levels)
    
    predictions = []
    last_date = datetime.fromisoformat(historical_data[-1]["date"].replace('Z', '+00:00'))
    
    for i in range(1, days_ahead + 1):
        pred_date = last_date + timedelta(days=i)
        
        # Simple prediction: trend + seasonal variation + noise
        seasonal_factor = 0.1 * np.sin(2 * np.pi * i / 365)  # Annual cycle
        noise = random.uniform(-std_level * 0.1, std_level * 0.1)
        predicted_level = mean_level + trend * i + seasonal_factor + noise
        predicted_level = max(0, predicted_level)
        
        # Confidence intervals
        confidence = max(0.6, 1 - i * 0.01)  # Decreasing confidence over time
        
        predictions.append({
            "date": pred_date.isoformat(),
            "predicted_level": round(predicted_level, 2),
            "confidence": round(confidence, 2),
            "lower_bound": round(predicted_level - std_level * 0.5, 2),
            "upper_bound": round(predicted_level + std_level * 0.5, 2)
        })
    
    return predictions

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Groundwater Monitoring API", "version": "1.0.0"}

@api_router.post("/stations/initialize")
async def initialize_stations():
    """Initialize database with sample groundwater station data"""
    try:
        # Sample data based on your CSV structure
        sample_stations = [
            {"station_id": "DWLRV9B7RT67", "name": "Bus Terminal Monitor 1", "state": "Rajasthan", "district": "Lucknow", "current_level": 42.53, "trend": "falling"},
            {"station_id": "DWLRCSWZ8K3I", "name": "Shopping Mall Station 2", "state": "Andhra Pradesh", "district": "Ahmedabad", "current_level": 5.17, "trend": "falling"},
            {"station_id": "DWLRSSRFXK5R", "name": "Central Monitoring Station 3", "state": "Meghalaya", "district": "Ahmedabad", "current_level": 21.49, "trend": "falling"},
            {"station_id": "DWLRVQMXUU9O", "name": "Temple Complex Well 4", "state": "Karnataka", "district": "Patna", "current_level": 25.34, "trend": "rising"},
            {"station_id": "DWLRTX8Y3MAT", "name": "Railway Station Well 5", "state": "Bihar", "district": "Visakhapatnam", "current_level": 13.07, "trend": "rising"},
            {"station_id": "DWLRQ1UN6481", "name": "Railway Station Well 6", "state": "Sikkim", "district": "Vadodara", "current_level": 39.79, "trend": "falling"},
            {"station_id": "DWLRZ4SQSUZQ", "name": "Market District Monitor 7", "state": "Himachal Pradesh", "district": "Visakhapatnam", "current_level": 23.12, "trend": "falling"},
            {"station_id": "DWLRH4CGKDPR", "name": "Temple Complex Well 8", "state": "Chhattisgarh", "district": "Vadodara", "current_level": 18.5, "trend": "falling"},
            {"station_id": "DWLR1X8MAGEI", "name": "Housing Society Monitor 9", "state": "Rajasthan", "district": "Pimpri-Chinchwad", "current_level": 34.56, "trend": "falling"},
            {"station_id": "DWLRYCKGT1OE", "name": "Park Area Monitor 10", "state": "Madhya Pradesh", "district": "Vadodara", "current_level": 22.98, "trend": "falling"}
        ]
        
        stations_created = []
        
        for station_data in sample_stations:
            # Get coordinates for the station
            lat, lon = await get_coordinates(station_data["state"], station_data["district"])
            
            # Generate historical data
            historical_data = generate_historical_data(
                station_data["current_level"], 
                station_data["trend"]
            )
            
            station = {
                **station_data,
                "status": "active",
                "last_updated": datetime.utcnow(),
                "latitude": lat,
                "longitude": lon,
                "historical_data": historical_data
            }
            
            # Insert or update station
            await db.groundwater_stations.replace_one(
                {"station_id": station["station_id"]},
                station,
                upsert=True
            )
            
            stations_created.append(station["station_id"])
        
        return {
            "message": f"Initialized {len(stations_created)} groundwater stations",
            "stations": stations_created
        }
        
    except Exception as e:
        logging.error(f"Error initializing stations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/stations", response_model=List[GroundwaterStation])
async def get_all_stations(
    state: Optional[str] = Query(None, description="Filter by state"),
    district: Optional[str] = Query(None, description="Filter by district"),
    status: Optional[str] = Query(None, description="Filter by status"),
    trend: Optional[str] = Query(None, description="Filter by trend")
):
    """Get all groundwater stations with optional filters"""
    try:
        query = {}
        if state:
            query["state"] = {"$regex": state, "$options": "i"}
        if district:
            query["district"] = {"$regex": district, "$options": "i"}
        if status:
            query["status"] = status
        if trend:
            query["trend"] = trend
            
        stations = await db.groundwater_stations.find(query).to_list(1000)
        return [GroundwaterStation(**{k: v for k, v in station.items() if k != '_id'}) for station in stations]
        
    except Exception as e:
        logging.error(f"Error fetching stations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/stations/{station_id}", response_model=GroundwaterStation)
async def get_station(station_id: str):
    """Get specific groundwater station data"""
    try:
        station = await db.groundwater_stations.find_one({"station_id": station_id})
        if not station:
            raise HTTPException(status_code=404, detail="Station not found")
        
        return GroundwaterStation(**{k: v for k, v in station.items() if k != '_id'})
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching station {station_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/stations/{station_id}/predictions")
async def get_station_predictions(station_id: str, days: int = Query(30, ge=1, le=90)):
    """Get predictions for a specific station"""
    try:
        station = await db.groundwater_stations.find_one({"station_id": station_id})
        if not station:
            raise HTTPException(status_code=404, detail="Station not found")
        
        historical_data = station.get("historical_data", [])
        predictions = generate_predictions(historical_data, days)
        
        return {
            "station_id": station_id,
            "predictions": predictions,
            "forecast_period": days,
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error generating predictions for {station_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/stations/{station_id}/simulate-update")
async def simulate_real_time_update(station_id: str):
    """Simulate real-time data update for a station"""
    try:
        station = await db.groundwater_stations.find_one({"station_id": station_id})
        if not station:
            raise HTTPException(status_code=404, detail="Station not found")
        
        # Simulate realistic water level change
        current_level = station["current_level"]
        trend = station["trend"]
        
        if trend == "falling":
            change = random.uniform(-0.5, -0.1)
        elif trend == "rising":
            change = random.uniform(0.1, 0.5)
        else:  # stable
            change = random.uniform(-0.2, 0.2)
        
        new_level = max(0, current_level + change)
        
        # Update station data
        update_data = {
            "current_level": round(new_level, 2),
            "last_updated": datetime.utcnow(),
        }
        
        # Add new historical data point
        new_point = {
            "date": datetime.utcnow().isoformat(),
            "level": round(new_level, 2),
            "temperature": round(random.uniform(15, 35), 1),
            "rainfall": round(random.uniform(0, 50), 1) if random.random() > 0.7 else 0
        }
        
        await db.groundwater_stations.update_one(
            {"station_id": station_id},
            {
                "$set": update_data,
                "$push": {
                    "historical_data": {
                        "$each": [new_point],
                        "$slice": -90  # Keep only last 90 days
                    }
                }
            }
        )
        
        return {
            "station_id": station_id,
            "previous_level": current_level,
            "new_level": new_level,
            "change": round(change, 2),
            "updated_at": update_data["last_updated"].isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error simulating update for {station_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/analytics/summary")
async def get_analytics_summary():
    """Get overall analytics summary"""
    try:
        total_stations = await db.groundwater_stations.count_documents({})
        active_stations = await db.groundwater_stations.count_documents({"status": "active"})
        
        # Trend analysis
        falling_trend = await db.groundwater_stations.count_documents({"trend": "falling"})
        rising_trend = await db.groundwater_stations.count_documents({"trend": "rising"})
        stable_trend = await db.groundwater_stations.count_documents({"trend": "stable"})
        
        # Average levels by state
        pipeline = [
            {"$group": {
                "_id": "$state",
                "avg_level": {"$avg": "$current_level"},
                "station_count": {"$sum": 1}
            }},
            {"$sort": {"avg_level": -1}}
        ]
        
        state_stats = await db.groundwater_stations.aggregate(pipeline).to_list(50)
        
        return {
            "total_stations": total_stations,
            "active_stations": active_stations,
            "trend_distribution": {
                "falling": falling_trend,
                "rising": rising_trend,
                "stable": stable_trend
            },
            "state_statistics": [
                {
                    "state": stat["_id"],
                    "average_level": round(stat["avg_level"], 2),
                    "station_count": stat["station_count"]
                }
                for stat in state_stats
            ]
        }
        
    except Exception as e:
        logging.error(f"Error generating analytics summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()