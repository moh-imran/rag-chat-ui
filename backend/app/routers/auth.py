from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from typing import Optional
from jose import JWTError, jwt

from ..models import User
from ..services.auth import (
    verify_password, 
    get_password_hash, 
    create_access_token, 
    SECRET_KEY, 
    ALGORITHM,
    get_current_user,
    oauth2_scheme
)

router = APIRouter(prefix="/auth", tags=["auth"])

from ..services.authorization import require_admin

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    role: str = "user"

class UserResponse(BaseModel):
    email: str
    full_name: Optional[str] = None
    id: str
    role: str

class Token(BaseModel):
    access_token: str
    token_type: str

@router.post("/register", response_model=UserResponse)
async def register(user_in: UserRegister, current_user: User = Depends(require_admin)):
    email = user_in.email.lower()
    existing_user = await User.find_one(User.email == email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check if this is the first user (bootstrap admin) - OPTIONAL safeguard, but better handled by script
    # However, since we now require admin to call this, bootstrapping must happen via script.
    
    user = User(
        email=email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
        is_admin=(user_in.role in ["admin", "superadmin"])
    )
    await user.insert()
    return UserResponse(
        email=user.email,
        full_name=user.full_name,
        id=str(user.id),
        role=user.role
    )

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

@router.post("/login", response_model=Token)
async def login(request: LoginRequest):
    email = request.email.lower()
    user = await User.find_one(User.email == email)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        email=current_user.email,
        full_name=current_user.full_name,
        id=str(current_user.id),
        role=current_user.role
    )

class UserUpdate(BaseModel):
    full_name: Optional[str] = None

@router.put("/profile", response_model=UserResponse)
async def update_profile(user_update: UserUpdate, current_user: User = Depends(get_current_user)):
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    
    await current_user.save()
    return UserResponse(
        email=current_user.email,
        full_name=current_user.full_name,
        id=str(current_user.id),
        role=current_user.role
    )

class PasswordReset(BaseModel):
    old_password: str
    new_password: str

@router.post("/reset-password")
async def reset_password(pw_reset: PasswordReset, current_user: User = Depends(get_current_user)):
    if not verify_password(pw_reset.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect old password"
        )
    
    current_user.hashed_password = get_password_hash(pw_reset.new_password)
    await current_user.save()
    return {"message": "Password updated successfully"}
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    # In a real app, this would send an email
    # For now, we simulation success to allow frontend development
    # Rate limiting would also apply here
    return {"message": "If an account exists with this email, a password reset link has been sent."}
