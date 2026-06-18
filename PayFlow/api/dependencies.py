"""
Shared FastAPI dependency: resolves the current authenticated user from the Bearer token.
All protected routers inject `current_user: dict = Depends(get_current_user)`.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from core.infrastructure.auth import decode_token
from core.infrastructure.db import get_connection

_bearer = HTTPBearer()


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(_bearer)) -> dict:
    payload = decode_token(credentials.credentials)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = int(payload["sub"])
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT id, email, nombre FROM usuarios WHERE id = ?", (user_id,)
        ).fetchone()
    finally:
        conn.close()

    if row is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no encontrado")

    return {"id": row["id"], "email": row["email"], "nombre": row["nombre"]}
