import os
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, Request
from jose import JWTError, jwt


JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALG = os.getenv("JWT_ALG")
ACCESS_TOKEN_MINUTES = 60


def get_jwt_settings():
    if not JWT_SECRET or not JWT_ALG:
        raise HTTPException(
            status_code=500,
            detail="JWT_SECRET and JWT_ALG must be set before using auth endpoints",
        )

    return JWT_SECRET, JWT_ALG


def build_access_token(*, subject: str, teacher_id: str, name: str) -> str:
    jwt_secret, jwt_alg = get_jwt_settings()
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "teacher_id": teacher_id,
        "name": name,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=ACCESS_TOKEN_MINUTES)).timestamp()),
    }
    return jwt.encode(payload, jwt_secret, algorithm=jwt_alg)


def get_teacher_payload(request: Request):
    auth = request.headers.get("Authorization")

    if not auth or not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")

    jwt_secret, jwt_alg = get_jwt_settings()
    token = auth.split(" ")[1]
    try:
        payload = jwt.decode(token, jwt_secret, algorithms=[jwt_alg])
    except JWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired token") from exc

    teacher_id = payload.get("teacher_id")
    if not teacher_id:
        raise HTTPException(status_code=401, detail="teacher id missing from token")

    return payload


def get_teacher_id_from_request(request: Request) -> str:
    payload = get_teacher_payload(request)
    teacher_id_value = payload.get("teacher_id")
    if not isinstance(teacher_id_value, str):
        raise HTTPException(status_code=401, detail="teacher id missing from token")
    return teacher_id_value
