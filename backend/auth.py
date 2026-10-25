import os
import jwt
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from database import get_db
from models import User

JWT_SECRET = os.environ.get("JWT_SECRET", "aicte-casesync-jwt-token-key-sih-2026")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 72


def create_access_token(user_id: str, username: str, role: str, bureau: str, region: Optional[str] = None) -> str:
    payload = {
        "sub": user_id,
        "username": username,
        "role": role,
        "bureau": bureau,
        "region": region,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRE_HOURS),
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Extracts authenticated user from Bearer token if provided."""
    if not authorization:
        return None

    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            return None
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            return None
        user = db.query(User).filter(User.id == user_id).first()
        return user
    except Exception:
        return None


def require_user(user: Optional[User] = Depends(get_current_user)) -> User:
    """Dependency that strictly enforces authentication."""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
