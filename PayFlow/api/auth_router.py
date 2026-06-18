from fastapi import APIRouter, HTTPException, status
from core.infrastructure.db import get_connection
from core.infrastructure.auth import hash_password, verify_password, create_access_token
from api.schemas import RegisterRequest, LoginRequest, TokenResponse, UserInfo

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest):
    conn = get_connection()
    try:
        existing = conn.execute(
            "SELECT id FROM usuarios WHERE email = ?", (body.email,)
        ).fetchone()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ya existe una cuenta con ese correo electrónico"
            )

        hashed = hash_password(body.password)
        cursor = conn.execute(
            "INSERT INTO usuarios (email, nombre, hashed_password) VALUES (?, ?, ?)",
            (body.email, body.nombre, hashed)
        )
        user_id = cursor.lastrowid

        # Create the linked financial account with initial balance.
        conn.execute(
            "INSERT INTO cuenta (usuario_id, saldo, antiguedad_meses) VALUES (?, ?, 0)",
            (user_id, body.saldo_inicial)
        )
        # Create empty presupuesto record.
        conn.execute(
            """INSERT INTO presupuesto
               (usuario_id, pmt, ahorro_meta, servicios_monto, suscripciones_monto, ocio_monto, estado)
               VALUES (?, 0, 0, 0, 0, 0, 'CONFIGURACION')""",
            (user_id,)
        )
        conn.commit()

        token = create_access_token(user_id, body.email)
        return TokenResponse(
            access_token=token,
            user=UserInfo(id=user_id, email=body.email, nombre=body.nombre)
        )
    finally:
        conn.close()


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest):
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT id, email, nombre, hashed_password FROM usuarios WHERE email = ?",
            (body.email,)
        ).fetchone()

        if not row or not verify_password(body.password, row["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales incorrectas"
            )

        token = create_access_token(row["id"], row["email"])
        return TokenResponse(
            access_token=token,
            user=UserInfo(id=row["id"], email=row["email"], nombre=row["nombre"])
        )
    finally:
        conn.close()
