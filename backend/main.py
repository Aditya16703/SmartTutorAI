import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

from src.api.routes.workflow import router as workflow_router
from src.api.routes.doubt import router as doubt_router
from src.api.routes.orchestrator import router as orchestrator_router

app = FastAPI(
    title="Educational AI Agent Backend",
    description="Backend API for the Educational AI Agent",
    version="0.1.0",
)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins, adjust in production
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Include the workflow router from the src directory
app.include_router(workflow_router, prefix="/api/workflows", tags=["workflow"])
app.include_router(doubt_router, prefix="/api/doubt", tags=["doubt"])
app.include_router(orchestrator_router, prefix="/api/orchestrator", tags=["orchestrator"])

@app.get("/")
async def root():
    return {"message": "Welcome to the Educational AI Agent Backend API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
