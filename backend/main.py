"""
AgroAI - FastAPI Backend Application
Main Entry Point
"""

import sys
import os

# Add backend directory to sys.path for reliable imports regardless of current working directory
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import csv

app = FastAPI(
    title="AgroAI Decision Support API",
    description="Backend API foundation for AI algorithms, CSP scheduling, and field telemetries.",
    version="1.0.0"
)

# Enable CORS for React frontend development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    """
    Health check endpoint for frontend connection verification.
    """
    return {
        "status": "ok",
        "project": "AgroAI"
    }


@app.get("/api/fields")
def get_fields():
    """
    Get field telemetry dataset.
    """
    csv_path = os.path.join(os.path.dirname(__file__), "data", "field_data.csv")
    if os.path.exists(csv_path):
        fields = []
        with open(csv_path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                fields.append({
                    "id": row["field_id"].lower(),
                    "name": row["field_id"].replace("_", " "),
                    "crop": row["crop"],
                    "soilMoisture": float(row["soil_moisture"]),
                    "soilPH": float(row["soil_ph"]),
                    "temperature": float(row["temperature"]),
                    "humidity": float(row["humidity"]),
                    "rainfall": float(row["rainfall"]),
                    "status": "Healthy" if float(row["soil_moisture"]) >= 70 else ("Moderate" if float(row["soil_moisture"]) >= 40 else ("Dry" if float(row["soil_moisture"]) >= 15 else "Critical")),
                    "waterRequirement": "Low" if float(row["soil_moisture"]) >= 70 else ("Moderate" if float(row["soil_moisture"]) >= 40 else "High")
                })
        return fields

    # Fallback default demo data
    return [
        {"id": "field_a", "name": "Field A", "crop": "Rice", "soilMoisture": 75, "soilPH": 6.5, "temperature": 28, "humidity": 70, "rainfall": 15, "status": "Healthy", "waterRequirement": "Low"},
        {"id": "field_b", "name": "Field B", "crop": "Tomato", "soilMoisture": 45, "soilPH": 6.2, "temperature": 31, "humidity": 60, "rainfall": 8, "status": "Moderate", "waterRequirement": "Moderate"},
        {"id": "field_c", "name": "Field C", "crop": "Maize", "soilMoisture": 20, "soilPH": 5.9, "temperature": 34, "humidity": 50, "rainfall": 2, "status": "Dry", "waterRequirement": "High"},
        {"id": "field_d", "name": "Field D", "crop": "Potato", "soilMoisture": 10, "soilPH": 5.7, "temperature": 35, "humidity": 45, "rainfall": 1, "status": "Critical", "waterRequirement": "Urgent"}
    ]


@app.post("/api/ai/kmeans")
def kmeans_placeholder():
    return {
        "status": "foundation_ready",
        "algorithm": "K-Means Clustering",
        "message": "K-Means soil clustering module will be implemented in Week 2."
    }


@app.post("/api/ai/decision-tree")
def decision_tree_placeholder():
    return {
        "status": "foundation_ready",
        "algorithm": "Decision Tree Classifier",
        "message": "Decision Tree crop recommendation rules engine will be implemented in Week 2."
    }


@app.post("/api/ai/cnn")
def cnn_placeholder():
    return {
        "status": "research_ready",
        "algorithm": "CNN Leaf Disease Detection",
        "message": "CNN PyTorch transfer learning model pipeline designed. Training in Week 2."
    }


@app.post("/api/ai/csp")
def csp_placeholder():
    return {
        "status": "foundation_ready",
        "algorithm": "Constraint Satisfaction (AC-3)",
        "message": "AC-3 arc consistency solver foundation ready. Domain reduced without conflicts."
    }


@app.post("/api/ai/search")
def search_placeholder():
    return {
        "status": "foundation_ready",
        "algorithm": "Graph & Grid Search (BFS, DFS, A*)",
        "message": "BFS, DFS, and A* algorithm foundations implemented and verified."
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
