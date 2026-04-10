from motor.motor_asyncio import AsyncIOMotorClient
from config.settings import settings

class Database:
    client: AsyncIOMotorClient = None
    db = None

db_instance = Database()

async def connect_to_mongo():
    print("Connecting to MongoDB...")
    # Initialize the MongoDB client using the URL from settings
    db_instance.client = AsyncIOMotorClient(settings.MONGODB_URL)
    db_instance.db = db_instance.client[settings.DATABASE_NAME]
    print(f"Connected to MongoDB database: {settings.DATABASE_NAME}")

async def close_mongo_connection():
    print("Closing MongoDB connection...")
    if db_instance.client:
        db_instance.client.close()
        print("MongoDB connection closed.")

def get_database():
    """Dependency intended to be used by FastAPI routes to access the DB."""
    return db_instance.db
