import asyncio
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie, Document
from pydantic import Field
from datetime import datetime
from typing import Optional

# Minimal User model definition for the script
class User(Document):
    email: str
    hashed_password: str
    full_name: Optional[str] = None
    is_active: bool = True
    is_admin: bool = False
    role: str = "user"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None

    class Settings:
        name = "users"

async def promote_to_admin(email: str):
    # Connect to MongoDB
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017/rag_chat")
    print(f"Connecting to MongoDB at {mongodb_url}...")
    
    client = AsyncIOMotorClient(mongodb_url)
    await init_beanie(database=client.get_default_database(), document_models=[User])
    
    # Find user
    print(f"Finding user {email}...")
    user = await User.find_one(User.email == email)
    
    if not user:
        print(f"Error: User with email {email} not found.")
        return
    
    # Update user
    print(f"Promoting {email} to Admin...")
    user.is_admin = True
    user.role = "admin"
    await user.save()
    
    print("Success! User is now an admin.")
    print("Please log out and log back in for changes to take effect.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python create_admin.py <email>")
        sys.exit(1)
        
    email = sys.argv[1]
    asyncio.run(promote_to_admin(email))
