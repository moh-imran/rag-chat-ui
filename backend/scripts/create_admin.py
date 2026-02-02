import asyncio
import os
import sys
from urllib.parse import quote_plus
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

# Add the parent directory to sys.path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models import User, Conversation, Message
from app.services.auth import get_password_hash

async def create_admin():
    load_dotenv()
    
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://mongodb:27017/rag_chat")
    
    # Process MONGODB_URL to escape username and password if present
    if "://" in mongodb_url and "@" in mongodb_url:
        try:
            scheme, rest = mongodb_url.split("://", 1)
            userinfo, host_rest = rest.rsplit("@", 1)
            if ":" in userinfo:
                username, password = userinfo.split(":", 1)
                mongodb_url = f"{scheme}://{quote_plus(username)}:{quote_plus(password)}@{host_rest}"
            else:
                mongodb_url = f"{scheme}://{quote_plus(userinfo)}@{host_rest}"
        except Exception as e:
            print(f"Warning: Failed to parse MONGODB_URL for escaping: {e}")

    print(f"Connecting to {mongodb_url}...")
    
    client = AsyncIOMotorClient(mongodb_url)
    await init_beanie(
        database=client.get_default_database(),
        document_models=[User, Conversation, Message]
    )
    
    email = input("Enter admin email: ").lower().strip()
    password = input("Enter admin password: ").strip()
    full_name = input("Enter full name (optional): ").strip() or "System Admin"
    
    existing_user = await User.find_one(User.email == email)
    if existing_user:
        print(f"User {email} already exists. Updating to admin...")
        existing_user.role = "admin"
        existing_user.is_admin = True
        existing_user.hashed_password = get_password_hash(password)
        await existing_user.save()
        print("User updated successfully.")
    else:
        print(f"Creating new admin user {email}...")
        new_user = User(
            email=email,
            hashed_password=get_password_hash(password),
            full_name=full_name,
            role="admin",
            is_admin=True,
            is_active=True
        )
        await new_user.insert()
        print("Admin user created successfully.")

if __name__ == "__main__":
    asyncio.run(create_admin())
