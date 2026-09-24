"""
AgroAI - Firebase Firestore Database Service
Connects directly to Google Cloud Firestore using Firebase Admin SDK when credentials are present,
or via Firestore REST API with Firebase Auth session when operating without service account key.
Serves real records from live Firestore for Farms, Fields, and Audit Logs.
"""

import os
import json
import logging
import urllib.request
import urllib.error
from typing import List, Dict, Any, Optional
from fastapi import HTTPException

logger = logging.getLogger("AgroAI.Firebase")

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)

# Potential key paths for Firebase Service Account Key JSON
POSSIBLE_KEY_PATHS = [
    os.environ.get("FIREBASE_SERVICE_ACCOUNT"),
    os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"),
    os.path.join(BACKEND_DIR, "serviceAccountKey.json"),
    os.path.join(BACKEND_DIR, "firebase-credentials.json"),
    os.path.join(PROJECT_ROOT, "serviceAccountKey.json"),
    os.path.join(PROJECT_ROOT, "firebase-credentials.json"),
]

# Firebase Project Configuration
FIREBASE_PROJECT_ID = os.environ.get("FIREBASE_PROJECT_ID") or "agroai-b72ec"
FIREBASE_API_KEY = (
    os.environ.get("FIREBASE_API_KEY")
    or os.environ.get("VITE_FIREBASE_API_KEY")
    or "AIzaSyC3wiPdZQ3NTocZp6cqjzQb14EIHwzAE9E"
)

firestore_client = None
using_admin_sdk = False
using_firestore = False

# Helper for REST authentication
_cached_auth_token = None
_cached_uid = None


def _init_firestore_admin():
    global firestore_client, using_admin_sdk, using_firestore
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore

        if firebase_admin._apps:
            try:
                firestore_client = firestore.client()
                using_admin_sdk = True
                using_firestore = True
                print("[AgroAI Firebase] Connected to existing Firebase Admin SDK instance.")
                return True
            except Exception as e:
                logger.warning(f"Existing Firebase app client error: {e}")

        key_file = None
        for p in POSSIBLE_KEY_PATHS:
            if p and os.path.exists(p):
                key_file = p
                break

        if key_file:
            try:
                cred = credentials.Certificate(key_file)
                firebase_admin.initialize_app(cred)
                firestore_client = firestore.client()
                using_admin_sdk = True
                using_firestore = True
                print(f"[AgroAI Firebase] Connected to live Firestore DB using key file: {key_file}")
                return True
            except Exception as e:
                logger.warning(f"Key file initialization failed ({key_file}): {e}")

        # Environment JSON string
        env_json = (
            os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
            or os.environ.get("GOOGLE_APPLICATION_CREDENTIALS_JSON")
            or (os.environ.get("FIREBASE_SERVICE_ACCOUNT") if os.environ.get("FIREBASE_SERVICE_ACCOUNT", "").startswith("{") else None)
        )
        if env_json:
            try:
                cert_dict = json.loads(env_json)
                cred = credentials.Certificate(cert_dict)
                firebase_admin.initialize_app(cred)
                firestore_client = firestore.client()
                using_admin_sdk = True
                using_firestore = True
                print("[AgroAI Firebase] Connected to live Firestore DB using environment JSON credentials.")
                return True
            except Exception as e:
                logger.warning(f"Environment JSON initialization failed: {e}")

        # Individual env vars: FIREBASE_CLIENT_EMAIL & FIREBASE_PRIVATE_KEY
        client_email = os.environ.get("FIREBASE_CLIENT_EMAIL")
        private_key = os.environ.get("FIREBASE_PRIVATE_KEY")
        if client_email and private_key:
            try:
                pk_clean = private_key.replace("\\n", "\n")
                cert_dict = {
                    "type": "service_account",
                    "project_id": FIREBASE_PROJECT_ID,
                    "private_key_id": os.environ.get("FIREBASE_PRIVATE_KEY_ID", "default_key_id"),
                    "private_key": pk_clean,
                    "client_email": client_email,
                    "client_id": os.environ.get("FIREBASE_CLIENT_ID", "default_client_id"),
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                }
                cred = credentials.Certificate(cert_dict)
                firebase_admin.initialize_app(cred)
                firestore_client = firestore.client()
                using_admin_sdk = True
                using_firestore = True
                print("[AgroAI Firebase] Connected to live Firestore DB using client_email & private_key env vars.")
                return True
            except Exception as e:
                logger.warning(f"Individual env vars initialization failed: {e}")

    except Exception as e:
        logger.info(f"Firebase Admin SDK notice: {e}")

    using_admin_sdk = False
    using_firestore = True  # Fallback to REST Client
    return False


# Attempt Admin SDK initialization first
_init_firestore_admin()


# REST API Fallback Helpers
def _get_rest_auth():
    global _cached_auth_token, _cached_uid
    if _cached_auth_token and _cached_uid:
        return _cached_auth_token, _cached_uid

    url_signup = f"https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={FIREBASE_API_KEY}"
    payload = json.dumps(
        {
            "email": "system_backend_service@agroai.edu",
            "password": "BackendPassword123!",
            "returnSecureToken": True,
        }
    ).encode("utf-8")
    req = urllib.request.Request(
        url_signup, data=payload, headers={"Content-Type": "application/json"}
    )
    try:
        res = urllib.request.urlopen(req)
        d = json.loads(res.read().decode("utf-8"))
        _cached_auth_token = d["idToken"]
        _cached_uid = d["localId"]
        return _cached_auth_token, _cached_uid
    except Exception:
        url_login = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={FIREBASE_API_KEY}"
        req_login = urllib.request.Request(
            url_login, data=payload, headers={"Content-Type": "application/json"}
        )
        res_login = urllib.request.urlopen(req_login)
        d = json.loads(res_login.read().decode("utf-8"))
        _cached_auth_token = d["idToken"]
        _cached_uid = d["localId"]
        return _cached_auth_token, _cached_uid


def _parse_rest_value(val: dict):
    if "stringValue" in val:
        return val["stringValue"]
    if "integerValue" in val:
        v = val["integerValue"]
        return (
            int(v)
            if str(v).isdigit() or (str(v).startswith("-") and str(v)[1:].isdigit())
            else float(v)
        )
    if "doubleValue" in val:
        return float(val["doubleValue"])
    if "booleanValue" in val:
        return bool(val["booleanValue"])
    if "mapValue" in val:
        return {k: _parse_rest_value(v) for k, v in val["mapValue"].get("fields", {}).items()}
    if "arrayValue" in val:
        return [_parse_rest_value(v) for v in val["arrayValue"].get("values", [])]
    return None


def _encode_rest_value(val: Any) -> dict:
    if val is None:
        return {"nullValue": None}
    if isinstance(val, bool):
        return {"booleanValue": val}
    if isinstance(val, int):
        return {"integerValue": str(val)}
    if isinstance(val, float):
        return {"doubleValue": val}
    if isinstance(val, str):
        return {"stringValue": val}
    if isinstance(val, dict):
        return {"mapValue": {"fields": {k: _encode_rest_value(v) for k, v in val.items()}}}
    if isinstance(val, list):
        return {"arrayValue": {"values": [_encode_rest_value(v) for v in val]}}
    return {"stringValue": str(val)}


def _rest_get_collection(collection_name: str) -> List[Dict[str, Any]]:
    token, _ = _get_rest_auth()
    url = f"https://firestore.googleapis.com/v1/projects/{FIREBASE_PROJECT_ID}/databases/(default)/documents/{collection_name}"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    try:
        res = urllib.request.urlopen(req)
        raw = json.loads(res.read().decode("utf-8"))
        items = []
        for doc in raw.get("documents", []):
            doc_name = doc.get("name", "")
            doc_id = doc_name.split("/")[-1] if doc_name else ""
            parsed = {k: _parse_rest_value(v) for k, v in doc.get("fields", {}).items()}
            f_id = parsed.get("fieldId") or parsed.get("farmId") or parsed.get("id") or doc_id
            parsed["id"] = f_id
            if collection_name == "fields":
                parsed["fieldId"] = f_id
            elif collection_name == "farms":
                parsed["farmId"] = f_id
            items.append(parsed)
        return items
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return []
        raise e


def _rest_save_document(collection_name: str, doc_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    token, uid = _get_rest_auth()
    if "ownerId" not in data and "userId" not in data:
        data["ownerId"] = uid
        data["userId"] = uid
    payload = {"fields": {k: _encode_rest_value(v) for k, v in data.items()}}
    url = f"https://firestore.googleapis.com/v1/projects/{FIREBASE_PROJECT_ID}/databases/(default)/documents/{collection_name}?documentId={doc_id}"
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        urllib.request.urlopen(req)
        return data
    except urllib.error.HTTPError as e:
        if e.code == 409 or e.code == 400:  # Already exists, patch instead
            url_patch = f"https://firestore.googleapis.com/v1/projects/{FIREBASE_PROJECT_ID}/databases/(default)/documents/{collection_name}/{doc_id}"
            req_patch = urllib.request.Request(
                url_patch,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                method="PATCH",
            )
            urllib.request.urlopen(req_patch)
            return data
        raise e


def _rest_update_document(collection_name: str, doc_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
    """Partial update: only patches the keys provided in `updates`, preserving all other fields.
    Uses Firestore REST updateMask.fieldPaths to avoid full document replacement.
    """
    token, _ = _get_rest_auth()
    # Build payload containing ONLY the fields being updated
    payload = {"fields": {k: _encode_rest_value(v) for k, v in updates.items()}}
    # updateMask ensures Firestore patches only these keys; existing keys are untouched
    field_mask = "&".join(f"updateMask.fieldPaths={k}" for k in updates.keys())
    url = (
        f"https://firestore.googleapis.com/v1/projects/{FIREBASE_PROJECT_ID}"
        f"/databases/(default)/documents/{collection_name}/{doc_id}?{field_mask}"
    )
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        method="PATCH",
    )
    try:
        res = urllib.request.urlopen(req)
        raw = json.loads(res.read().decode("utf-8"))
        parsed = {k: _parse_rest_value(v) for k, v in raw.get("fields", {}).items()}
        parsed["id"] = doc_id
        return parsed
    except urllib.error.HTTPError as e:
        if e.code == 404:
            raise HTTPException(
                status_code=404, detail=f"{collection_name[:-1].capitalize()} not found"
            )
        raise e


def _rest_delete_document(collection_name: str, doc_id: str) -> Dict[str, str]:
    token, _ = _get_rest_auth()
    url = f"https://firestore.googleapis.com/v1/projects/{FIREBASE_PROJECT_ID}/databases/(default)/documents/{collection_name}/{doc_id}"
    req = urllib.request.Request(
        url, headers={"Authorization": f"Bearer {token}"}, method="DELETE"
    )
    try:
        urllib.request.urlopen(req)
        return {"message": f"{collection_name[:-1].capitalize()} {doc_id} deleted successfully."}
    except urllib.error.HTTPError as e:
        if e.code == 404:
            raise HTTPException(
                status_code=404, detail=f"{collection_name[:-1].capitalize()} not found"
            )
        raise e


class AgroDatabaseService:
    @staticmethod
    def get_farms() -> List[Dict[str, Any]]:
        if using_admin_sdk and firestore_client:
            try:
                docs = firestore_client.collection("farms").stream()
                farms = []
                for d in docs:
                    item = d.to_dict()
                    f_id = item.get("farmId") or item.get("id") or d.id
                    item["id"] = f_id
                    item["farmId"] = f_id
                    farms.append(item)
                return farms
            except Exception as e:
                logger.error(f"Firestore Admin get_farms error: {e}")

        # REST API Fallback
        try:
            return _rest_get_collection("farms")
        except Exception as e:
            logger.error(f"Firestore REST get_farms error: {e}")
            raise HTTPException(
                status_code=500, detail="Unable to read data from Firebase Firestore."
            )

    @staticmethod
    def save_farm(farm_data: Dict[str, Any]) -> Dict[str, Any]:
        farm_id = (
            farm_data.get("id")
            or farm_data.get("farmId")
            or f"farm-{int(os.urandom(4).hex(), 16)}"
        )
        farm_data["id"] = farm_id
        farm_data["farmId"] = farm_id

        if using_admin_sdk and firestore_client:
            try:
                firestore_client.collection("farms").document(farm_id).set(farm_data, merge=True)
                return farm_data
            except Exception as e:
                logger.error(f"Firestore Admin save_farm error: {e}")

        try:
            return _rest_save_document("farms", farm_id, farm_data)
        except Exception as e:
            logger.error(f"Firestore REST save_farm error: {e}")
            raise HTTPException(
                status_code=500, detail="Unable to write data to Firebase Firestore."
            )

    @staticmethod
    def update_farm(farm_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        updates["id"] = farm_id
        updates["farmId"] = farm_id

        if using_admin_sdk and firestore_client:
            try:
                doc_ref = firestore_client.collection("farms").document(farm_id)
                doc_snap = doc_ref.get()
                if not doc_snap.exists:
                    raise HTTPException(status_code=404, detail="Farm not found")

                doc_ref.set(updates, merge=True)
                existing = doc_snap.to_dict() or {}
                existing.update(updates)
                return existing
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Firestore Admin update_farm error: {e}")

        try:
            return _rest_update_document("farms", farm_id, updates)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Firestore REST update_farm error: {e}")
            raise HTTPException(
                status_code=500, detail="Unable to update data in Firebase Firestore."
            )

    @staticmethod
    def delete_farm(farm_id: str) -> Dict[str, str]:
        if using_admin_sdk and firestore_client:
            try:
                doc_ref = firestore_client.collection("farms").document(farm_id)
                doc_snap = doc_ref.get()
                if not doc_snap.exists:
                    raise HTTPException(status_code=404, detail="Farm not found")

                doc_ref.delete()
                return {"message": f"Farm {farm_id} deleted successfully."}
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Firestore Admin delete_farm error: {e}")

        try:
            return _rest_delete_document("farms", farm_id)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Firestore REST delete_farm error: {e}")
            raise HTTPException(
                status_code=500, detail="Unable to delete data from Firebase Firestore."
            )

    @staticmethod
    def get_fields() -> List[Dict[str, Any]]:
        if using_admin_sdk and firestore_client:
            try:
                docs = firestore_client.collection("fields").stream()
                fields = []
                for d in docs:
                    item = d.to_dict()
                    f_id = item.get("fieldId") or item.get("id") or d.id
                    item["id"] = f_id
                    item["fieldId"] = f_id
                    fields.append(item)
                return fields
            except Exception as e:
                logger.error(f"Firestore Admin get_fields error: {e}")

        try:
            return _rest_get_collection("fields")
        except Exception as e:
            logger.error(f"Firestore REST get_fields error: {e}")
            raise HTTPException(
                status_code=500, detail="Unable to read data from Firebase Firestore."
            )

    @staticmethod
    def save_field(field_data: Dict[str, Any]) -> Dict[str, Any]:
        field_id = (
            field_data.get("id")
            or field_data.get("fieldId")
            or f"field_{int(os.urandom(4).hex(), 16)}"
        )
        field_data["id"] = field_id
        field_data["fieldId"] = field_id

        if using_admin_sdk and firestore_client:
            try:
                firestore_client.collection("fields").document(field_id).set(field_data, merge=True)
                return field_data
            except Exception as e:
                logger.error(f"Firestore Admin save_field error: {e}")

        try:
            return _rest_save_document("fields", field_id, field_data)
        except Exception as e:
            logger.error(f"Firestore REST save_field error: {e}")
            raise HTTPException(
                status_code=500, detail="Unable to write data to Firebase Firestore."
            )

    @staticmethod
    def update_field(field_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        updates["id"] = field_id
        updates["fieldId"] = field_id

        if using_admin_sdk and firestore_client:
            try:
                doc_ref = firestore_client.collection("fields").document(field_id)
                doc_snap = doc_ref.get()
                if not doc_snap.exists:
                    raise HTTPException(status_code=404, detail="Field not found")

                doc_ref.set(updates, merge=True)
                existing = doc_snap.to_dict() or {}
                existing.update(updates)
                return existing
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Firestore Admin update_field error: {e}")

        try:
            return _rest_update_document("fields", field_id, updates)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Firestore REST update_field error: {e}")
            raise HTTPException(
                status_code=500, detail="Unable to update data in Firebase Firestore."
            )

    @staticmethod
    def delete_field(field_id: str) -> Dict[str, str]:
        if using_admin_sdk and firestore_client:
            try:
                doc_ref = firestore_client.collection("fields").document(field_id)
                doc_snap = doc_ref.get()
                if not doc_snap.exists:
                    raise HTTPException(status_code=404, detail="Field not found")

                doc_ref.delete()
                return {"message": f"Field {field_id} deleted successfully."}
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Firestore Admin delete_field error: {e}")

        try:
            return _rest_delete_document("fields", field_id)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Firestore REST delete_field error: {e}")
            raise HTTPException(
                status_code=500, detail="Unable to delete data from Firebase Firestore."
            )

    @staticmethod
    def get_logs() -> List[Dict[str, Any]]:
        if using_admin_sdk and firestore_client:
            try:
                docs = firestore_client.collection("activity_logs").stream()
                logs = []
                for d in docs:
                    item = d.to_dict()
                    item["id"] = d.id
                    logs.append(item)
                return logs
            except Exception as e:
                logger.error(f"Firestore Admin get_logs error: {e}")

        try:
            return _rest_get_collection("activity_logs")
        except Exception:
            return []

    @staticmethod
    def save_log(log_data: Dict[str, Any]) -> Dict[str, Any]:
        log_id = log_data.get("id") or f"rec-{int(os.urandom(4).hex(), 16)}"
        log_data["id"] = log_id

        if using_admin_sdk and firestore_client:
            try:
                firestore_client.collection("activity_logs").document(log_id).set(log_data, merge=True)
                return log_data
            except Exception as e:
                logger.error(f"Firestore Admin save_log error: {e}")

        try:
            return _rest_save_document("activity_logs", log_id, log_data)
        except Exception:
            return log_data

    # ─── Farmers ─────────────────────────────────────────────────────────────────

    @staticmethod
    def get_farmers() -> List[Dict[str, Any]]:
        """Get all users with role='farmer', enriched with assignment status."""
        farmers = []
        # Get all users with role=farmer
        if using_admin_sdk and firestore_client:
            try:
                docs = firestore_client.collection("users").where("role", "==", "farmer").stream()
                for d in docs:
                    item = d.to_dict()
                    item["uid"] = d.id
                    farmers.append(item)
            except Exception as e:
                logger.error(f"Firestore Admin get_farmers error: {e}")
        
        if not farmers:
            try:
                all_users = _rest_get_collection("users")
                farmers = [u for u in all_users if u.get("role") == "farmer"]
            except Exception:
                pass

        # Enrich with assignment status
        if farmers:
            try:
                active_assignments = {}
                if using_admin_sdk and firestore_client:
                    try:
                        assign_docs = firestore_client.collection("assignments").where("status", "==", "active").stream()
                        for d in assign_docs:
                            item = d.to_dict()
                            active_assignments[item.get("farmerId")] = item
                    except Exception:
                        pass
                else:
                    try:
                        all_assigns = _rest_get_collection("assignments")
                        for a in all_assigns:
                            if a.get("status") == "active":
                                active_assignments[a.get("farmerId")] = a
                    except Exception:
                        pass

                for f in farmers:
                    uid = f.get("uid") or f.get("id")
                    if uid in active_assignments:
                        a = active_assignments[uid]
                        f["isAssigned"] = True
                        f["assignedFieldId"] = a.get("fieldId")
                        f["assignedFieldName"] = a.get("fieldName")
                        f["assignedFarmName"] = a.get("farmName")
                    else:
                        f["isAssigned"] = False
            except Exception as e:
                logger.warning(f"Could not enrich farmers with assignment status: {e}")

        return farmers

    # ─── Assignment Requests ──────────────────────────────────────────────────────

    @staticmethod
    def create_assignment_request(data: Dict[str, Any]) -> Dict[str, Any]:
        import time
        request_id = f"areq_{int(time.time() * 1000)}"
        data["id"] = request_id
        data["status"] = "pending"

        if using_admin_sdk and firestore_client:
            try:
                from google.cloud import firestore as fs
                data["createdAt"] = fs.SERVER_TIMESTAMP
                firestore_client.collection("assignment_requests").document(request_id).set(data)
                return {"success": True, "requestId": request_id}
            except Exception as e:
                logger.error(f"Firestore Admin create_assignment_request error: {e}")
        
        try:
            _rest_save_document("assignment_requests", request_id, data)
            return {"success": True, "requestId": request_id}
        except Exception as e:
            logger.error(f"REST create_assignment_request error: {e}")
            return {"success": False, "error": str(e)}

    @staticmethod
    def get_assignment_requests(userId: Optional[str] = None, role: Optional[str] = None) -> List[Dict[str, Any]]:
        requests = []
        if using_admin_sdk and firestore_client:
            try:
                if role == "farmer" and userId:
                    docs = firestore_client.collection("assignment_requests").where("farmerId", "==", userId).stream()
                elif role == "owner" and userId:
                    docs = firestore_client.collection("assignment_requests").where("ownerId", "==", userId).stream()
                else:
                    docs = firestore_client.collection("assignment_requests").stream()
                for d in docs:
                    item = d.to_dict()
                    item["id"] = d.id
                    requests.append(item)
                return requests
            except Exception as e:
                logger.error(f"Firestore Admin get_assignment_requests error: {e}")

        try:
            all_reqs = _rest_get_collection("assignment_requests")
            if role == "farmer" and userId:
                return [r for r in all_reqs if r.get("farmerId") == userId]
            elif role == "owner" and userId:
                return [r for r in all_reqs if r.get("ownerId") == userId]
            return all_reqs
        except Exception:
            return []

    @staticmethod
    def update_assignment_request_status(request_id: str, new_status: str) -> bool:
        import time
        update_data = {"status": new_status, "updatedAt": str(time.time())}

        if using_admin_sdk and firestore_client:
            try:
                doc_ref = firestore_client.collection("assignment_requests").document(request_id)
                if not doc_ref.get().exists:
                    return False
                doc_ref.update(update_data)

                # If approved: update field and create assignment record
                if new_status == "approved":
                    req_data = doc_ref.get().to_dict()
                    if req_data:
                        assign_id = f"assign_{int(time.time() * 1000)}"
                        assign_data = {
                            "id": assign_id,
                            "ownerId": req_data.get("ownerId"),
                            "farmerId": req_data.get("farmerId"),
                            "farmerName": req_data.get("farmerName"),
                            "farmId": req_data.get("farmId"),
                            "farmName": req_data.get("farmName"),
                            "fieldId": req_data.get("fieldId"),
                            "fieldName": req_data.get("fieldName"),
                            "status": "active",
                            "assignedAt": str(time.time()),
                        }
                        firestore_client.collection("assignments").document(assign_id).set(assign_data)
                        # Update field
                        field_id = req_data.get("fieldId")
                        if field_id:
                            AgroDatabaseService.update_field(field_id, {
                                "assignedFarmerId": req_data.get("farmerId"),
                                "assignedFarmerName": req_data.get("farmerName"),
                                "farmerId": req_data.get("farmerId"),
                            })
                return True
            except Exception as e:
                logger.error(f"Firestore Admin update_assignment_request_status error: {e}")
                return False
        
        try:
            _rest_save_document("assignment_requests", request_id, update_data)
            return True
        except Exception:
            return False

    @staticmethod
    def unassign_farmer(farmer_id: str, farmer_name: str) -> Dict[str, Any]:
        """Mark farmer's active assignment as inactive and clear field."""
        if using_admin_sdk and firestore_client:
            try:
                import time
                # Find active assignment
                docs = list(firestore_client.collection("assignments").where("farmerId", "==", farmer_id).where("status", "==", "active").stream())
                if not docs:
                    return {"success": False, "error": "No active assignment found."}
                
                assign_doc = docs[0]
                assign_data = assign_doc.to_dict()
                
                # Mark inactive (keep for history)
                assign_doc.reference.update({"status": "inactive", "unassignedAt": str(time.time())})
                
                # Clear field assignment
                field_id = assign_data.get("fieldId")
                if field_id:
                    AgroDatabaseService.update_field(field_id, {
                        "assignedFarmerId": None,
                        "assignedFarmerName": None,
                        "farmerId": None,
                        "assignedTo": None,
                    })
                
                return {"success": True, "fieldId": field_id}
            except Exception as e:
                logger.error(f"Firestore Admin unassign_farmer error: {e}")
                return {"success": False, "error": str(e)}
        
        return {"success": True}  # Memory-mode fallback

    @staticmethod
    def get_assignment_history(userId: Optional[str] = None, role: Optional[str] = None) -> List[Dict[str, Any]]:
        if using_admin_sdk and firestore_client:
            try:
                if role == "farmer" and userId:
                    docs = firestore_client.collection("assignments").where("farmerId", "==", userId).stream()
                elif role == "owner" and userId:
                    docs = firestore_client.collection("assignments").where("ownerId", "==", userId).stream()
                else:
                    docs = firestore_client.collection("assignments").stream()
                history = []
                for d in docs:
                    item = d.to_dict()
                    item["id"] = d.id
                    history.append(item)
                return history
            except Exception as e:
                logger.error(f"Firestore Admin get_assignment_history error: {e}")
        
        try:
            return _rest_get_collection("assignments")
        except Exception:
            return []

    # ─── Conversations & Messages ─────────────────────────────────────────────────

    @staticmethod
    def get_conversations(userId: Optional[str] = None) -> List[Dict[str, Any]]:
        if using_admin_sdk and firestore_client:
            try:
                if userId:
                    docs = firestore_client.collection("conversations").where("participants", "array_contains", userId).stream()
                else:
                    docs = firestore_client.collection("conversations").stream()
                convs = []
                for d in docs:
                    item = d.to_dict()
                    item["id"] = d.id
                    convs.append(item)
                return convs
            except Exception as e:
                logger.error(f"Firestore Admin get_conversations error: {e}")
        
        try:
            all_convs = _rest_get_collection("conversations")
            if userId:
                return [c for c in all_convs if userId in (c.get("participants") or [])]
            return all_convs
        except Exception:
            return []

    @staticmethod
    def get_or_create_conversation(data: Dict[str, Any]) -> Dict[str, Any]:
        import time
        owner_id = data.get("ownerId")
        farmer_id = data.get("farmerId")

        if using_admin_sdk and firestore_client:
            try:
                docs = list(firestore_client.collection("conversations")
                    .where("ownerId", "==", owner_id)
                    .where("farmerId", "==", farmer_id)
                    .stream())
                if docs:
                    item = docs[0].to_dict()
                    item["id"] = docs[0].id
                    return item
                
                conv_id = f"conv_{owner_id}_{farmer_id}_{int(time.time()*1000)}"
                conv_data = {
                    **data,
                    "id": conv_id,
                    "participants": [owner_id, farmer_id],
                }
                firestore_client.collection("conversations").document(conv_id).set(conv_data)
                return conv_data
            except Exception as e:
                logger.error(f"Firestore Admin get_or_create_conversation error: {e}")
        
        conv_id = f"conv_{owner_id}_{farmer_id}"
        return {**data, "id": conv_id, "participants": [owner_id, farmer_id]}

    @staticmethod
    def get_messages(conversation_id: str, userId: Optional[str] = None) -> List[Dict[str, Any]]:
        if using_admin_sdk and firestore_client:
            try:
                # Access control check
                if userId:
                    conv_doc = firestore_client.collection("conversations").document(conversation_id).get()
                    if conv_doc.exists:
                        conv_data = conv_doc.to_dict()
                        participants = conv_data.get("participants") or []
                        if userId not in participants:
                            return []
                
                docs = firestore_client.collection("messages").where("conversationId", "==", conversation_id).stream()
                messages = []
                for d in docs:
                    item = d.to_dict()
                    item["id"] = d.id
                    messages.append(item)
                return sorted(messages, key=lambda m: str(m.get("createdAt", "")))
            except Exception as e:
                logger.error(f"Firestore Admin get_messages error: {e}")
        
        try:
            all_msgs = _rest_get_collection("messages")
            return [m for m in all_msgs if m.get("conversationId") == conversation_id]
        except Exception:
            return []

    @staticmethod
    def save_message(msg_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        import time, random, string
        msg_id = f"msg_{int(time.time()*1000)}_{''.join(random.choices(string.ascii_lowercase, k=5))}"
        msg_data["id"] = msg_id

        if using_admin_sdk and firestore_client:
            try:
                from google.cloud import firestore as fs
                msg_data_to_save = {**msg_data, "createdAt": fs.SERVER_TIMESTAMP}
                firestore_client.collection("messages").document(msg_id).set(msg_data_to_save)
                
                # Update conversation last message
                conv_id = msg_data.get("conversationId")
                if conv_id:
                    firestore_client.collection("conversations").document(conv_id).update({
                        "lastMessage": msg_data.get("text", "")[:100],
                        "lastMessageAt": fs.SERVER_TIMESTAMP,
                        "updatedAt": fs.SERVER_TIMESTAMP,
                    })
                
                return msg_data
            except Exception as e:
                logger.error(f"Firestore Admin save_message error: {e}")
        
        try:
            return _rest_save_document("messages", msg_id, msg_data)
        except Exception:
            return msg_data




