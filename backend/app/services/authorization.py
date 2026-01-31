from fastapi import HTTPException, Depends, status
from ..services.auth import get_current_user
from ..models import User

async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency that requires the user to be an admin.
    Raises 403 Forbidden if the user is not an admin.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

def require_role(required_role: str):
    """
    Dependency factory that requires the user to have a specific role.
    Returns an async dependency function that checks the user's role.

    Usage:
        @router.get("/admin-only", dependencies=[Depends(require_role("admin"))])
    """
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role != required_role and not current_user.is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{required_role}' required"
            )
        return current_user
    return role_checker

async def require_superadmin(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency that requires the user to be a superadmin.
    Raises 403 Forbidden if the user is not a superadmin.
    """
    if current_user.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superadmin access required"
        )
    return current_user
