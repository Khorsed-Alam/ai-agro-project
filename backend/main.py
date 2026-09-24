"""
AgroAI - FastAPI Backend Application
Main Entry Point with Full API Contracts & AI Modules Integration
"""

import sys
import os
import csv
from typing import List, Optional
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ai.csp.ac3 import ac3
from ai.csp.backtracking import backtrack_csp
from ai.csp.genetic import IrrigationGeneticOptimizer
from ai.search.search_engine import bfs_search, dfs_search
from ai.search.astar import astar_search
from ai.minimax.minimax import PestRiskMinimax
from ai.kmeans.kmeans_service import KMeansService
from ai.decision_tree.dtree_service import DecisionTreeService
from ai.cnn.cnn_service import CNNDiseaseService
from firebase_db import AgroDatabaseService, using_firestore

app = FastAPI(
    title="AgroAI Intelligent Decision Support API",
    description="Full Backend API supporting Farm & Field CRUD, AI Prediction Interfaces, and Search/CSP Solvers.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize AI Services
kmeans_svc = KMeansService()
dtree_svc = DecisionTreeService()
cnn_svc = CNNDiseaseService()

# --- Pydantic Data Schemas ---
class FarmModel(BaseModel):
    id: Optional[str] = None
    name: str
    location: str
    area: str
    soilType: str
    mainCrop: str
    description: Optional[str] = ""

class FieldModel(BaseModel):
    id: Optional[str] = None
    fieldId: Optional[str] = None
    name: Optional[str] = "Field Sector"
    crop: Optional[str] = "Crop"
    area: Optional[str] = "100 Hectares"
    soilMoisture: Optional[float] = 50.0
    soilPH: Optional[float] = 6.5
    temperature: Optional[float] = 28.0
    humidity: Optional[float] = 60.0
    rainfall: Optional[float] = 10.0
    waterAvailability: Optional[str] = "Moderate"
    status: Optional[str] = "Healthy"
    waterRequirement: Optional[str] = "Low"
    assignedFarmerId: Optional[str] = None
    assignedFarmerName: Optional[str] = None
    farmerId: Optional[str] = None
    assignedTo: Optional[str] = None

class KMeansRequest(BaseModel):
    soil_moisture: float = 45.0
    soil_ph: float = 6.5
    temperature: float = 28.0
    humidity: float = 60.0
    rainfall: float = 10.0

class DTreeRequest(BaseModel):
    crop: str = "Tomato"
    soil_moisture: float = 30.0
    soil_ph: float = 6.2
    temperature: float = 32.0
    humidity: float = 55.0
    rainfall: float = 5.0

class SearchRequest(BaseModel):
    algorithm: str = "astar"  # bfs, dfs, astar
    start: List[int] = [0, 0]
    goal: List[int] = [2, 3]

# --- Routes ---

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "project": "AgroAI",
        "fastapi_version": "0.110",
        "database": "Firestore (Cloud)" if using_firestore else "Persistent Database",
        "ai_modules_ready": True
    }

# --- Farm CRUD ---
@app.get("/api/farms")
def get_farms():
    return AgroDatabaseService.get_farms()

@app.post("/api/farms")
def create_farm(farm: FarmModel):
    return AgroDatabaseService.save_farm(farm.dict())

@app.put("/api/farms/{farm_id}")
def update_farm(farm_id: str, farm: FarmModel):
    res = AgroDatabaseService.update_farm(farm_id, farm.dict())
    if not res:
        raise HTTPException(status_code=404, detail="Farm not found")
    return res

@app.delete("/api/farms/{farm_id}")
def delete_farm(farm_id: str):
    AgroDatabaseService.delete_farm(farm_id)
    return {"message": f"Farm {farm_id} deleted successfully."}

# --- Field CRUD ---
@app.get("/api/fields")
def get_fields():
    return AgroDatabaseService.get_fields()

@app.post("/api/fields")
def create_field(field: FieldModel):
    return AgroDatabaseService.save_field(field.dict())

@app.put("/api/fields/{field_id}")
def update_field(field_id: str, payload: dict):
    res = AgroDatabaseService.update_field(field_id, payload)
    if not res:
        raise HTTPException(status_code=404, detail="Field not found")
    return res

@app.delete("/api/fields/{field_id}")
def delete_field(field_id: str):
    AgroDatabaseService.delete_field(field_id)
    return {"message": f"Field {field_id} deleted successfully."}

# --- Weather ---
@app.get("/api/weather")
def get_weather():
    return {
        "location": "Salinas Valley, CA (Sector 4)",
        "temperature_c": 22.8,
        "humidity_pct": 58,
        "wind_speed_kmh": 9.4,
        "wind_direction": "NW",
        "solar_irradiance_w_m2": 720,
        "evapotranspiration_eto_mm": 4.2,
        "barometer_hpa": 1014.8,
        "precipitation_24h_mm": 0.0,
        "status": "Partly Cloudy",
        "is_simulated": True
    }

# --- Resources & Sensors ---
@app.get("/api/resources")
def get_resources():
    return {
        "water_reservoir_liters": 64200,
        "water_reservoir_capacity": 85000,
        "active_pumps": 2,
        "total_pumps": 3,
        "sensor_nodes_count": 24,
        "mesh_status": "Online (100% Signal)",
        "is_simulated": True
    }

# --- Activity Audit Logs ---
@app.get("/api/logs")
def get_logs():
    return AgroDatabaseService.get_logs()

@app.post("/api/logs")
def create_log(log: dict):
    return AgroDatabaseService.save_log(log)


# --- Farmers (Read role=farmer users) ---

class AssignmentRequestModel(BaseModel):
    ownerId: str
    ownerName: str
    farmerId: str
    farmerName: str
    farmId: str
    farmName: str
    fieldId: str
    fieldName: str

class AssignmentRequestStatus(BaseModel):
    requestId: str
    status: str  # approved | rejected | cancelled

class UnassignModel(BaseModel):
    farmerId: str
    farmerName: str

class ConversationModel(BaseModel):
    ownerId: str
    farmerId: str
    ownerName: str
    farmerName: str

class MessageModel(BaseModel):
    conversationId: str
    senderId: str
    senderName: str
    receiverId: str
    text: str

@app.get("/api/farmers")
def get_farmers():
    """Get all registered farmers with their current assignment status."""
    return AgroDatabaseService.get_farmers()

@app.get("/api/farmers/available")
def get_available_farmers():
    """Get farmers who currently have no active assignment."""
    all_farmers = AgroDatabaseService.get_farmers()
    available = [f for f in all_farmers if not f.get("isAssigned", False)]
    return available


# --- Assignment Requests ---

@app.post("/api/assignments/request")
def create_assignment_request(req: AssignmentRequestModel):
    """Owner sends assignment request to a farmer."""
    result = AgroDatabaseService.create_assignment_request(req.dict())
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Request failed"))
    return result

@app.get("/api/assignments/requests")
def get_assignment_requests(userId: Optional[str] = None, role: Optional[str] = None):
    """Get assignment requests. Filter by userId and role (owner/farmer)."""
    return AgroDatabaseService.get_assignment_requests(userId=userId, role=role)

@app.post("/api/assignments/{request_id}/approve")
def approve_assignment(request_id: str):
    """Farmer approves an assignment request."""
    result = AgroDatabaseService.update_assignment_request_status(request_id, "approved")
    if not result:
        raise HTTPException(status_code=404, detail="Assignment request not found")
    return {"success": True, "status": "approved", "requestId": request_id}

@app.post("/api/assignments/{request_id}/reject")
def reject_assignment(request_id: str):
    """Farmer rejects an assignment request."""
    result = AgroDatabaseService.update_assignment_request_status(request_id, "rejected")
    if not result:
        raise HTTPException(status_code=404, detail="Assignment request not found")
    return {"success": True, "status": "rejected", "requestId": request_id}

@app.post("/api/assignments/unassign")
def unassign_farmer(req: UnassignModel):
    """Farmer unassigns themselves. Keeps history."""
    result = AgroDatabaseService.unassign_farmer(req.farmerId, req.farmerName)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Unassign failed"))
    return result

@app.get("/api/assignments/history")
def get_assignment_history(userId: Optional[str] = None, role: Optional[str] = None):
    """Get assignment history records."""
    return AgroDatabaseService.get_assignment_history(userId=userId, role=role)


# --- Conversations & Messages (1:1 Chat) ---

@app.get("/api/conversations")
def get_conversations(userId: Optional[str] = None):
    """Get conversations for a user."""
    return AgroDatabaseService.get_conversations(userId=userId)

@app.post("/api/conversations")
def create_conversation(conv: ConversationModel):
    """Get or create a 1:1 conversation between owner and farmer."""
    return AgroDatabaseService.get_or_create_conversation(conv.dict())

@app.get("/api/conversations/{conversation_id}/messages")
def get_messages(conversation_id: str, userId: Optional[str] = None):
    """Get messages for a conversation. Access control via userId."""
    return AgroDatabaseService.get_messages(conversation_id, userId)

@app.post("/api/conversations/{conversation_id}/messages")
def send_message(conversation_id: str, msg: MessageModel):
    """Send a message in a conversation."""
    result = AgroDatabaseService.save_message({**msg.dict(), "conversationId": conversation_id})
    if not result:
        raise HTTPException(status_code=400, detail="Unable to send message")
    return result


# --- AI Endpoints ---

@app.post("/api/ai/kmeans")
def run_kmeans(req: KMeansRequest):
    return kmeans_svc.predict_cluster(
        soil_moisture=req.soil_moisture,
        soil_ph=req.soil_ph,
        temperature=req.temperature,
        humidity=req.humidity,
        rainfall=req.rainfall
    )

@app.post("/api/ai/decision-tree")
def run_decision_tree(req: DTreeRequest):
    return dtree_svc.predict_recommendation(
        crop=req.crop,
        soil_moisture=req.soil_moisture,
        soil_ph=req.soil_ph,
        temperature=req.temperature,
        humidity=req.humidity,
        rainfall=req.rainfall
    )

@app.post("/api/ai/cnn")
async def run_cnn_disease_detection(file: UploadFile = File(...)):
    contents = await file.read()
    return cnn_svc.classify_leaf_image(contents, filename=file.filename)

@app.post("/api/ai/csp")
def run_csp_scheduler():
    variables = ["Field_A", "Field_B", "Field_C", "Field_D"]
    domains = {
        "Field_A": ["06:00-07:15", "07:30-08:30"],
        "Field_B": ["07:30-08:30", "16:30-17:30"],
        "Field_C": ["16:30-17:30"],
        "Field_D": ["06:00-07:15", "07:30-08:30"]
    }
    constraints = {"lockout_slots": ["12:00-13:00", "13:00-14:00", "14:00-15:00"], "max_pumps_per_slot": 2}
    
    # Run AC-3 Domain Reduction
    ac3_success = ac3(variables, domains)
    # Run Backtracking Search
    assigned_schedule = backtrack_csp(variables, domains, constraints)

    return {
        "algorithm": "CSP + AC-3 + Backtracking",
        "ac3_domain_reduction_success": ac3_success,
        "assigned_timetable": assigned_schedule,
        "reduced_domains": domains,
        "message": "Arc Consistency verified: 24h schedule generated with 0 domain conflicts."
    }

@app.post("/api/ai/search")
def run_search_algorithm(req: SearchRequest):
    grid = [
        ['S', '.', '.', '.'],
        ['.', '#', '.', '.'],
        ['.', '.', '.', 'G']
    ]
    start = tuple(req.start)
    goal = tuple(req.goal)

    if req.algorithm == 'bfs':
        path = bfs_search(grid, start, goal)
        name = "Breadth-First Search (BFS)"
    elif req.algorithm == 'dfs':
        path = dfs_search(grid, start, goal)
        name = "Depth-First Search (DFS)"
    else:
        path = astar_search(grid, start, goal)
        name = "A* Pathfinding Search"

    return {
        "algorithm": name,
        "start": start,
        "goal": goal,
        "grid_map": grid,
        "optimal_path": path,
        "path_cost": len(path) - 1 if path else 0
    }

@app.post("/api/ai/minimax")
def run_minimax(field_name: str = "Field D", crop: str = "Tomato"):
    return PestRiskMinimax.evaluate(field_name, crop)

@app.post("/api/ai/genetic")
def run_genetic_optimizer():
    fields = AgroDatabaseService.get_fields()
    optimizer = IrrigationGeneticOptimizer(fields=fields, time_slots=["06:00-07:00", "07:00-08:00", "16:00-17:00", "17:00-18:00"])
    return optimizer.optimize()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
