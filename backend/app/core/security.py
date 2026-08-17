import bcrypt
if not hasattr(bcrypt, "__about__"):
    bcrypt.__about__ = type("About", (), {"__version__": getattr(bcrypt, "__version__", "4.1.0")})()

from datetime import datetime, timedelta, timezone
from typing import Any, Union, Optional
import jwt
from passlib.context import CryptContext
from app.core.config import settings


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

MAX_BCRYPT_PASSWORD_BYTES = 72


def validate_password_length(password: str) -> None:
    """Validates that a password is non-empty and does not exceed bcrypt's 72-byte limit."""
    if not password:
        raise ValueError("Password cannot be empty.")
    encoded_len = len(password.encode("utf-8"))
    if encoded_len > MAX_BCRYPT_PASSWORD_BYTES:
        raise ValueError(
            f"Password cannot be longer than {MAX_BCRYPT_PASSWORD_BYTES} bytes (received {encoded_len} UTF-8 bytes). "
            "Please configure a password with at most 72 UTF-8 bytes."
        )


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against a stored bcrypt hash safely."""
    if not plain_password or not hashed_password:
        return False
    # Bcrypt only supports passwords up to 72 bytes; anything longer cannot match
    if len(plain_password.encode("utf-8")) > MAX_BCRYPT_PASSWORD_BYTES:
        return False
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """Generates a secure bcrypt hash for passwords up to 72 bytes."""
    validate_password_length(password)
    return pwd_context.hash(password)


def create_access_token(
    subject: Union[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.JWT_ACCESS_EXPIRE_MINUTES
        )
    to_encode = {"exp": expire, "sub": str(subject), "type": "access"}
    encoded_jwt = jwt.encode(
        to_encode, settings.effective_jwt_secret, algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


def create_refresh_token(
    subject: Union[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            days=settings.JWT_REFRESH_EXPIRE_DAYS
        )
    to_encode = {"exp": expire, "sub": str(subject), "type": "refresh"}
    encoded_jwt = jwt.encode(
        to_encode, settings.effective_jwt_secret, algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(
            token, settings.effective_jwt_secret, algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except jwt.ExpiredSignatureError:
        try:
            payload = jwt.decode(
                token, settings.effective_jwt_secret, algorithms=[settings.JWT_ALGORITHM], options={"verify_exp": False}
            )
            return payload
        except jwt.PyJWTError:
            return None
    except jwt.PyJWTError:
        return None

