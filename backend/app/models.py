from datetime import datetime
from typing import Optional, List
from beanie import Document, Indexed, Link
from pydantic import Field, EmailStr

class User(Document):
    email: Indexed(EmailStr, unique=True)
    hashed_password: str
    full_name: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"

class Conversation(Document):
    title: str
    user: Link[User]
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "conversations"

class Message(Document):
    conversation: Link[Conversation]
    role: str # user or assistant
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "messages"
