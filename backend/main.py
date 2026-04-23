from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

try:
    from .database.connection import connect_to_mongo, close_mongo_connection
    from .config.settings import settings
    from .services.category_predictor import initialize_predictor
    from .routes.insights import _insights_analysis_source_data
except ImportError:
    from database.connection import connect_to_mongo, close_mongo_connection
    from config.settings import settings
    from services.category_predictor import initialize_predictor
    from routes.insights import _insights_analysis_source_data

# Define the lifespan of the FastAPI app to manage startup and shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # What happens on startup
    await connect_to_mongo()
    # Initialize complaint category predictor with existing complaint data
    try:
        complaints_data = _insights_analysis_source_data()
        initialize_predictor(complaints_data)
    except Exception as e:
        print(f"Warning: Failed to initialize category predictor: {e}")
    yield
    # What happens on shutdown
    await close_mongo_connection()

# Initialize the FastAPI App
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend for Argus: Municipal Grievance Analytics System",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173","https://s84-oracle.netlify.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"status": "error", "message": "An unexpected error occurred.", "details": str(exc)},
    )

# Import and include routers
try:
    from .routes.insights import router as insights_router
    from .routes.auth import router as auth_router
except ImportError:
    from routes.insights import router as insights_router
    from routes.auth import router as auth_router
app.include_router(insights_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")

# Test route to verify server is running
@app.get("/")
async def root():
    return {
        "status": "success",
        "message": f"Welcome to the {settings.PROJECT_NAME}",
        "database": settings.DATABASE_NAME
    }

