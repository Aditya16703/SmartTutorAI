
from fastapi import FastAPI
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from src.api.routes.workflow import router as workflow_router
from src.services.supabase_service import supabase_service
import logging
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI()

# Get logger instance
logger = logging.getLogger(__name__)

origins = [
    "*",
    "http://localhost:3000",
]

# Basic logging configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(workflow_router, prefix='/api/workflows', tags=['workflows'])

# ✅ CORRECTED ENDPOINTS:
@app.get("/api/learning-spaces")
def get_learning_spaces(user_id: str):
    """Get all learning spaces for a user"""
    try:
        logger.info(f"Getting learning spaces for user: {user_id}")
        
        if not supabase_service or not supabase_service.client:
            logger.error("Supabase service not initialized")
            return []
        
        response = supabase_service.client.table("learning_space") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("created_at", desc=True) \
            .execute()
        
        logger.info(f"Found {len(response.data)} learning spaces")
        return response.data if response.data else []
        
    except Exception as e:
        logger.error(f"Failed to get learning spaces for {user_id}: {str(e)}")
        return []

@app.get("/api/learning-spaces/{space_id}")
def get_learning_space(space_id: str):
    """Get a specific learning space by ID"""
    try:
        logger.info(f"Getting learning space: {space_id}")
        
        if not supabase_service or not supabase_service.client:
            logger.error("Supabase service not initialized")
            return {"error": "Database service unavailable"}
        
        response = supabase_service.client.table("learning_space") \
            .select("*") \
            .eq("id", space_id) \
            .execute()
        
        if response.data and len(response.data) > 0:
            logger.info(f"Found learning space: {space_id}")
            return response.data[0]
        else:
            logger.warning(f"Learning space not found: {space_id}")
            return {"error": "Learning space not found"}
            
    except Exception as e:
        logger.error(f"Failed to get learning space {space_id}: {str(e)}")
        return {"error": f"Failed to fetch learning space: {str(e)}"}

@app.delete("/api/learning-spaces/{space_id}")
def delete_learning_space(space_id: str, user_id: str):
    """Delete a specific learning space by ID"""
    try:
        logger.info(f"Deleting learning space: {space_id} for user: {user_id}")
        
        if not supabase_service or not supabase_service.client:
            logger.error("Supabase service not initialized")
            return {"error": "Database service unavailable"}
        
        # Verify the space belongs to the user before deleting
        verify = supabase_service.client.table("learning_space") \
            .select("id") \
            .eq("id", space_id) \
            .eq("user_id", user_id) \
            .execute()
        
        if not verify.data or len(verify.data) == 0:
            logger.warning(f"Learning space not found or not owned by user: {space_id}")
            return {"error": "Learning space not found or access denied"}
        
        # Delete the learning space
        response = supabase_service.client.table("learning_space") \
            .delete() \
            .eq("id", space_id) \
            .eq("user_id", user_id) \
            .execute()
        
        logger.info(f"Successfully deleted learning space: {space_id}")
        return {"success": True, "message": "Learning space deleted successfully"}
        
    except Exception as e:
        logger.error(f"Failed to delete learning space {space_id}: {str(e)}")
        return {"error": f"Failed to delete learning space: {str(e)}"}

@app.get("/")
def read_root():
    return {"status": "Okay", "message": "Server is Running."}

def main():
    print("Hello from leave-application-agent!")
    port = os.getenv("PORT")
    uvicorn.run(app, host="0.0.0.0", port=int(port))

if __name__ == "__main__":
    main()