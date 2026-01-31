from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from pydantic import BaseModel, EmailStr
from beanie.operators import In
from ..models import User, Conversation, Message
from ..services.authorization import require_admin
from ..services.auth import get_password_hash, get_current_user
from ..services.api_client import RagApiClient
import httpx
import os

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


# ============================================================================
# Pydantic Models for Request/Response
# ============================================================================

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: Optional[str]
    is_active: bool
    is_admin: bool
    role: str
    last_login: Optional[datetime]
    created_at: datetime

class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None
    role: Optional[str] = None

class PasswordResetRequest(BaseModel):
    new_password: str

class StatsResponse(BaseModel):
    users: Dict[str, Any]
    conversations: Dict[str, Any]
    messages: Dict[str, Any]
    system: Dict[str, Any]
    etl: Dict[str, Any]


# ============================================================================
# User Management Endpoints
# ============================================================================

@router.get("/users", response_model=Dict[str, Any])
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = None
):
    """
    List all users with pagination and filtering.
    Returns user list with total count.
    """
    # Build query
    query = {}
    if search:
        query["$or"] = [
            {"email": {"$regex": search, "$options": "i"}},
            {"full_name": {"$regex": search, "$options": "i"}}
        ]
    if role:
        query["role"] = role
    if is_active is not None:
        query["is_active"] = is_active

    # Get total count
    total = await User.find(query).count()

    # Get paginated users
    users = await User.find(query).skip(skip).limit(limit).to_list()

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "users": [
            UserResponse(
                id=str(user.id),
                email=user.email,
                full_name=user.full_name,
                is_active=user.is_active,
                is_admin=user.is_admin,
                role=user.role,
                last_login=user.last_login,
                created_at=user.created_at
            ) for user in users
        ]
    }


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str):
    """Get detailed information about a specific user."""
    user = await User.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        is_admin=user.is_admin,
        role=user.role,
        last_login=user.last_login,
        created_at=user.created_at
    )


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, update_data: UserUpdateRequest):
    """Update user information (role, status, etc.)."""
    user = await User.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Update fields if provided
    if update_data.full_name is not None:
        user.full_name = update_data.full_name
    if update_data.is_active is not None:
        user.is_active = update_data.is_active
    if update_data.is_admin is not None:
        user.is_admin = update_data.is_admin
        # Sync role with is_admin if needed
        if update_data.is_admin and user.role == "user":
            user.role = "admin"
    if update_data.role is not None:
        user.role = update_data.role
        # Sync is_admin with role
        user.is_admin = update_data.role in ["admin", "superadmin"]

    await user.save()

    return UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        is_admin=user.is_admin,
        role=user.role,
        last_login=user.last_login,
        created_at=user.created_at
    )


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: User = Depends(get_current_user)):
    """Permanently delete a user and their associated data."""
    # Prevent self-deletion
    if user_id == str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="You cannot delete your own administrative account."
        )

    user = await User.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent deleting the last superadmin if this is one
    if user.role == "superadmin":
        superadmin_count = await User.find({"role": "superadmin", "is_active": True}).count()
        if superadmin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete the last active superadmin."
            )

    # 1. Find all conversations for this user
    conversations = await Conversation.find(Conversation.user.id == user.id).to_list()
    conv_ids = [c.id for c in conversations]

    # 2. Delete all messages in those conversations
    if conv_ids:
        await Message.find(In(Message.conversation.id, conv_ids)).delete()

    # 3. Delete the conversations
    await Conversation.find(Conversation.user.id == user.id).delete()

    # 4. Finally delete the user
    await user.delete()

    return {"message": f"User {user.email} and all associated data deleted permanently"}


@router.post("/users/{user_id}/reset-password")
async def admin_reset_password(user_id: str, reset_data: PasswordResetRequest):
    """Admin-initiated password reset for a user."""
    user = await User.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Hash and update password
    user.hashed_password = get_password_hash(reset_data.new_password)
    await user.save()

    return {"message": "Password reset successfully"}


# ============================================================================
# Statistics Endpoints
# ============================================================================

@router.get("/stats", response_model=StatsResponse)
async def get_dashboard_stats():
    """Get comprehensive dashboard statistics."""
    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)
    week_start = now - timedelta(days=7)

    # User statistics
    total_users = await User.find().count()
    active_users = await User.find({"is_active": True}).count()
    new_users_today = await User.find({"created_at": {"$gte": today_start}}).count()
    new_users_week = await User.find({"created_at": {"$gte": week_start}}).count()

    # Conversation statistics
    total_conversations = await Conversation.find().count()
    conversations_today = await Conversation.find({"created_at": {"$gte": today_start}}).count()
    conversations_week = await Conversation.find({"created_at": {"$gte": week_start}}).count()
    avg_conversations_per_user = total_conversations / total_users if total_users > 0 else 0

    # Message statistics
    total_messages = await Message.find().count()
    messages_today = await Message.find({"timestamp": {"$gte": today_start}}).count()
    messages_week = await Message.find({"timestamp": {"$gte": week_start}}).count()
    avg_messages_per_conversation = total_messages / total_conversations if total_conversations > 0 else 0

    # System health (check RAG API, MongoDB is implicitly working if we got here)
    rag_api_status = "online"
    try:
        rag_api_url = os.getenv("RAG_API_URL", "http://localhost:8000")
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{rag_api_url}/health")
            if response.status_code != 200:
                rag_api_status = "degraded"
    except Exception:
        rag_api_status = "offline"

    # ETL statistics (from rag-qa-api)
    etl_stats = {
        "total_jobs": 0,
        "pending": 0,
        "running": 0,
        "completed": 0,
        "failed": 0
    }
    try:
        rag_api_url = os.getenv("RAG_API_URL", "http://localhost:8000")
        client = RagApiClient(base_url=rag_api_url)
        jobs = await client.list_ingest_jobs()
        etl_stats["total_jobs"] = len(jobs)
        for job in jobs:
            status_lower = job.get("status", "").lower()
            if status_lower in ["pending", "queued"]:
                etl_stats["pending"] += 1
            elif status_lower in ["running", "processing"]:
                etl_stats["running"] += 1
            elif status_lower in ["completed", "success"]:
                etl_stats["completed"] += 1
            elif status_lower in ["failed", "error"]:
                etl_stats["failed"] += 1
    except Exception as e:
        # ETL API unavailable, return zeros
        pass

    return StatsResponse(
        users={
            "total": total_users,
            "active": active_users,
            "new_today": new_users_today,
            "new_this_week": new_users_week
        },
        conversations={
            "total": total_conversations,
            "today": conversations_today,
            "this_week": conversations_week,
            "avg_per_user": round(avg_conversations_per_user, 2)
        },
        messages={
            "total": total_messages,
            "today": messages_today,
            "this_week": messages_week,
            "avg_per_conversation": round(avg_messages_per_conversation, 2)
        },
        system={
            "rag_api_status": rag_api_status,
            "mongodb_status": "online",
            "uptime": "N/A"  # Would need process tracking
        },
        etl=etl_stats
    )


@router.get("/stats/users")
async def get_user_stats():
    """Get detailed user analytics (growth, activity)."""
    now = datetime.utcnow()

    # Get user growth over last 30 days
    growth_data = []
    for i in range(30, -1, -1):
        date = now - timedelta(days=i)
        date_start = datetime(date.year, date.month, date.day)
        date_end = date_start + timedelta(days=1)

        count = await User.find({
            "created_at": {"$gte": date_start, "$lt": date_end}
        }).count()

        growth_data.append({
            "date": date_start.isoformat(),
            "count": count
        })

    # Active users (logged in last 7 days)
    week_ago = now - timedelta(days=7)
    active_users = await User.find({
        "last_login": {"$gte": week_ago}
    }).count()

    return {
        "growth_data": growth_data,
        "active_users_last_7_days": active_users,
        "total_users": await User.find().count()
    }


@router.get("/stats/conversations")
async def get_conversation_stats():
    """Get conversation metrics and trends."""
    now = datetime.utcnow()

    # Conversations over last 30 days
    conversation_data = []
    for i in range(30, -1, -1):
        date = now - timedelta(days=i)
        date_start = datetime(date.year, date.month, date.day)
        date_end = date_start + timedelta(days=1)

        count = await Conversation.find({
            "created_at": {"$gte": date_start, "$lt": date_end}
        }).count()

        conversation_data.append({
            "date": date_start.isoformat(),
            "count": count
        })

    return {
        "conversation_data": conversation_data,
        "total_conversations": await Conversation.find().count()
    }


@router.get("/stats/messages")
async def get_message_stats():
    """Get message volume trends."""
    now = datetime.utcnow()

    # Messages over last 30 days
    message_data = []
    for i in range(30, -1, -1):
        date = now - timedelta(days=i)
        date_start = datetime(date.year, date.month, date.day)
        date_end = date_start + timedelta(days=1)

        count = await Message.find({
            "timestamp": {"$gte": date_start, "$lt": date_end}
        }).count()

        message_data.append({
            "date": date_start.isoformat(),
            "count": count
        })

    return {
        "message_data": message_data,
        "total_messages": await Message.find().count()
    }


# ============================================================================
# System Monitoring Endpoints
# ============================================================================

@router.get("/system/health")
async def get_system_health():
    """Get detailed system health status."""
    health_status = {
        "mongodb": {"status": "online", "message": "Connected"},
        "rag_api": {"status": "unknown", "message": "Not checked"},
        "qdrant": {"status": "unknown", "message": "Not checked"}
    }

    # Check RAG API
    try:
        rag_api_url = os.getenv("RAG_API_URL", "http://localhost:8000")
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{rag_api_url}/health")
            if response.status_code == 200:
                health_status["rag_api"] = {"status": "online", "message": "Healthy"}
            else:
                health_status["rag_api"] = {"status": "degraded", "message": f"Status code: {response.status_code}"}
    except Exception as e:
        health_status["rag_api"] = {"status": "offline", "message": str(e)}

    # Check Qdrant (via RAG API)
    try:
        rag_api_url = os.getenv("RAG_API_URL", "http://localhost:8000")
        async with httpx.AsyncClient(timeout=5.0) as client:
            # Assume RAG API has a qdrant health endpoint
            response = await client.get(f"{rag_api_url}/qdrant/health")
            if response.status_code == 200:
                health_status["qdrant"] = {"status": "online", "message": "Healthy"}
            else:
                health_status["qdrant"] = {"status": "degraded", "message": "Unable to verify"}
    except Exception as e:
        health_status["qdrant"] = {"status": "unknown", "message": "Endpoint not available"}

    return health_status


@router.get("/integrations")
async def get_all_integrations():
    """Get all integrations across all users (admin view)."""
    try:
        rag_api_url = os.getenv("RAG_API_URL", "http://localhost:8000")
        client = RagApiClient(base_url=rag_api_url)
        integrations = await client.list_integrations()
        return {"integrations": integrations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch integrations: {str(e)}")


@router.get("/etl-jobs")
async def get_all_etl_jobs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status_filter: Optional[str] = None
):
    """Get all ETL jobs with filtering and pagination."""
    try:
        rag_api_url = os.getenv("RAG_API_URL", "http://localhost:8000")
        client = RagApiClient(base_url=rag_api_url)
        all_jobs = await client.list_ingest_jobs()

        # Filter by status if provided
        if status_filter:
            all_jobs = [job for job in all_jobs if job.get("status", "").lower() == status_filter.lower()]

        # Pagination
        total = len(all_jobs)
        jobs = all_jobs[skip:skip+limit]

        return {
            "total": total,
            "skip": skip,
            "limit": limit,
            "jobs": jobs
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch ETL jobs: {str(e)}")


@router.get("/activity")
async def get_recent_activity(limit: int = Query(50, ge=1, le=100)):
    """Get recent user activity across the system."""
    # Get recent user registrations
    recent_users = await User.find().sort(-User.created_at).limit(limit).to_list()

    # Get recent conversations
    recent_conversations = await Conversation.find().sort(-Conversation.created_at).limit(limit).to_list()

    # Combine and sort by timestamp
    activity = []

    for user in recent_users:
        activity.append({
            "type": "user_registered",
            "timestamp": user.created_at,
            "data": {
                "user_id": str(user.id),
                "email": user.email,
                "full_name": user.full_name
            }
        })

    for conv in recent_conversations:
        await conv.fetch_link(Conversation.user)
        activity.append({
            "type": "conversation_created",
            "timestamp": conv.created_at,
            "data": {
                "conversation_id": str(conv.id),
                "title": conv.title,
                "user_email": conv.user.email if conv.user else "Unknown"
            }
        })

    # Sort by timestamp descending
    activity.sort(key=lambda x: x["timestamp"], reverse=True)

    return {"activity": activity[:limit]}


@router.get("/conversations", response_model=Dict[str, Any])
async def list_all_conversations(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None
):
    """List all conversations with user details for admin view."""
    import logging
    logger = logging.getLogger(__name__)
    
    query = {}
    if search:
        query["title"] = {"$regex": search, "$options": "i"}

    try:
        # Get total count for pagination
        total = await Conversation.find(query).count()
        
        # Get paginated data
        conversations = await Conversation.find(query).sort(-Conversation.updated_at).skip(skip).limit(limit).to_list()
        
        result = []
        for conv in conversations:
            try:
                # Basic info
                conv_data = {
                    "id": str(conv.id),
                    "title": conv.title or "Untitled Conversation",
                    "created_at": conv.created_at.isoformat() if conv.created_at else None,
                    "updated_at": conv.updated_at.isoformat() if conv.updated_at else None,
                    "message_count": 0,
                    "user_id": "unknown",
                    "user_email": "Unknown"
                }
                
                # Fetch user link safely
                try:
                    await conv.fetch_link("user")
                    if conv.user and hasattr(conv.user, 'email'):
                         conv_data["user_email"] = conv.user.email
                         conv_data["user_id"] = str(conv.user.id)
                except Exception:
                    pass
                
                # Fetch message count (Beanie style)
                try:
                    conv_data["message_count"] = await Message.find(Message.conversation.id == conv.id).count()
                except Exception:
                    # Fallback to direct mongo link format
                    conv_data["message_count"] = await Message.find({"conversation.$id": conv.id}).count()
                
                result.append(conv_data)
                
            except Exception as e:
                logger.error(f"Error processing individual conversation {conv.id}: {e}")
                continue

        return {
            "total": total,
            "items": result,
            "skip": skip,
            "limit": limit
        }
    except Exception as e:
        logger.error(f"Critical error in list_all_conversations: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversations/{conv_id}/messages", response_model=List[Dict[str, Any]])
async def get_conversation_messages(conv_id: str):
    """Get all messages for a specific conversation (Admin view)."""
    conversation = await Conversation.get(conv_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = await Message.find(Message.conversation.id == conversation.id).sort(Message.timestamp).to_list()
    return [
        {
            "role": m.role,
            "content": m.content,
            "timestamp": m.timestamp.isoformat()
        } for m in messages
    ]


@router.get("/feedback")
async def get_all_feedback():
    """Get all user feedback from rag-qa-api."""
    try:
        rag_api_url = os.getenv("RAG_API_URL", "http://localhost:8000")
        client = RagApiClient(base_url=rag_api_url)
        return await client.get_all_feedback()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch feedback: {str(e)}")
