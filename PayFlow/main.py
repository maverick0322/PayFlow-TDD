import sys
import os

# Ensure the PayFlow package root is on sys.path when running from any CWD.
sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from core.infrastructure.db import init_db
from api.auth_router import router as auth_router
from api.presupuesto_router import router as presupuesto_router
from api.suscripciones_router import router as suscripciones_router
from api.dashboard_router import router as dashboard_router
from api.reportes_router import router as reportes_router
from api.gastos_router import router as gastos_router

_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:4173",
    "http://127.0.0.1:5173",
]

app = FastAPI(
    title="PayFlow API",
    description="Backend hexagonal para gestión financiera personal.",
    version="1.0.0",
)

# CORS must be registered BEFORE any exception handlers so that all error
# responses — including Pydantic 422s — include the Allow-Origin header.
app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Custom 422 handler that:
    1. Always includes CORS headers.
    2. Translates technical schema field names to user-friendly domain terms in Spanish.
    3. Normalizes Pydantic error messages.
    """
    origin = request.headers.get("origin", "")
    cors_origin = origin if origin in _ALLOWED_ORIGINS else _ALLOWED_ORIGINS[0]

    FIELD_NAMES_ES = {
        "email": "correo electrónico",
        "nombre": "nombre completo",
        "password": "contraseña",
        "saldo_inicial": "saldo inicial",
        "monthlyBudget": "presupuesto mensual",
        "savingsAmount": "ahorro",
        "servicesAmount": "servicios",
        "subscriptionsAmount": "suscripciones",
        "leisureAmount": "ocio",
        "name": "nombre del servicio",
        "amount": "monto",
        "billingDate": "fecha de cobro",
        "billingCycle": "frecuencia",
        "category": "categoría",
        "date": "fecha",
        "description": "descripción",
        "currentBalance": "saldo actual",
    }

    errors = exc.errors()
    messages = []
    for err in errors:
        loc_parts = [str(p) for p in err["loc"] if p not in ("body", "query")]
        field_key = loc_parts[-1] if loc_parts else ""
        field_label = FIELD_NAMES_ES.get(field_key, field_key)

        msg = err["msg"].replace("Value error, ", "")

        # Normalize typical validation messages to friendly Spanish
        if msg == "Field required":
            msg = f"El campo {field_label} es obligatorio" if field_label else "Campo obligatorio"
        elif "value is not a valid email" in msg.lower() or "an email address must have" in msg.lower():
            msg = "El formato del correo electrónico no es válido (ejemplo: usuario@correo.com)"
        elif msg == "Input should be a valid number":
            msg = f"El campo {field_label} debe ser un número válido" if field_label else "Debe ser un número válido"
        elif msg == "Input should be a valid integer":
            msg = f"El campo {field_label} debe ser un número entero" if field_label else "Debe ser un número entero"
        else:
            # If it is a custom validator error (already in Spanish)
            if field_label and not (field_label.lower() in msg.lower() or field_key.lower() in msg.lower()):
                msg = f"{field_label.capitalize()}: {msg}"

        messages.append(msg)

    detail = "; ".join(messages) if messages else "Datos de entrada inválidos"

    return JSONResponse(
        status_code=422,
        content={"detail": detail},
        headers={
            "Access-Control-Allow-Origin":      cors_origin,
            "Access-Control-Allow-Credentials": "true",
        },
    )


# Register all routers under the /api prefix.
_PREFIX = "/api"
app.include_router(auth_router,          prefix=_PREFIX)
app.include_router(presupuesto_router,   prefix=_PREFIX)
app.include_router(suscripciones_router, prefix=_PREFIX)
app.include_router(dashboard_router,     prefix=_PREFIX)
app.include_router(reportes_router,      prefix=_PREFIX)
app.include_router(gastos_router,        prefix=_PREFIX)


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok"}
