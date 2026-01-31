import asyncio
import os
import sys
import bcrypt
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

def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(pwd_bytes, salt)
    return hashed_password.decode('utf-8')

async def create_or_promote_admin(email: str, password: Optional[str] = None):
    # Connect to MongoDB
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017/rag_chat")
    print(f"Connecting to MongoDB at {mongodb_url}...")
    
    try:
        client = AsyncIOMotorClient(mongodb_url)
        # Try to get database name from URL if default database not set
        db_name = mongodb_url.split("/")[-1] or "rag_chat"
        await init_beanie(database=client[db_name], document_models=[User])
        
        # Find user
        print(f"Checking user {email}...")
        user = await User.find_one(User.email == email)
        
        if user:
            print(f"User {email} found. Promoting to Admin...")
            user.is_admin = True
            user.role = "superadmin"
            await user.save()
            print("Success! User promoted to superadmin.")
        else:
            if not password:
                print(f"Error: User {email} not found and no password provided for creation.")
                print("Usage: python create_admin.py <email> [password]")
                return
            
            print(f"Creating new superadmin {email}...")
            user = User(
                email=email,
                hashed_password=get_password_hash(password),
                full_name="Administrator",
                is_admin=True,
                role="superadmin"
            )
            await user.insert()
            print("Success! New superadmin created.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python create_admin.py <email> [password]")
        sys.exit(1)
        
    email = sys.argv[1].lower()
    password = sys.argv[2] if len(sys.argv) > 2 else None
    asyncio.run(create_or_promote_admin(email, password))
