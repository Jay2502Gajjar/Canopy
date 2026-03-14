import os
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Cookie, Depends, Header, HTTPException, status
from jose import JWTError, jwt
from pydantic import BaseModel

SECRET_KEY = os.getenv("JWT_SECRET", "canopy_hr_jwt_secret_key_change_in_production")
ALGORITHM = "HS256"

class UserObject(BaseModel):
    id: str
    email: str
    role: str
    name: str

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(
    token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
) -> UserObject:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Check cookie first, then Authorization header
    token_str = token
    if not token_str and authorization and authorization.startswith("Bearer "):
        token_str = authorization.split(" ")[1]
        
    if not token_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
        
    try:
        payload = jwt.decode(token_str, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("id")
        email: str = payload.get("email")
        role: str = payload.get("role")
        name: str = payload.get("name")
        if user_id is None or email is None:
            raise credentials_exception
        return UserObject(id=user_id, email=email, role=role, name=name)
    except JWTError:
        raise credentials_exception

def RoleChecker(allowed_roles: list[str]):
    def role_checker(user: UserObject = Depends(get_current_user)):
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return user
    return role_checker
