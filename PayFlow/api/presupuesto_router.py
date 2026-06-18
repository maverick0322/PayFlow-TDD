from fastapi import APIRouter, Depends, HTTPException, status
from api.dependencies import get_current_user
from api.schemas import FundsConfigRequest, FundsConfigResponse
from core.infrastructure.db import get_connection

router = APIRouter(prefix="/funds", tags=["funds"])

# Priority labels matching frontend BudgetCategory.label values.
_PRIORITY_ORDER = [
    ("Ahorro / Metas",    "savingsAmount"),
    ("Servicios / Hogar", "servicesAmount"),
    ("Suscripciones",     "subscriptionsAmount"),
    ("Ocio / Consumo",    "leisureAmount"),
]


def _compute_estado(config: FundsConfigRequest) -> str:
    """
    Replicates the priority-based deficit check from presupuesto.py.
    Returns 'EJERCICIO' or 'EJERCICIO_DEFICIT'.
    """
    remaining = config.monthlyBudget
    amounts = {
        "savingsAmount":       config.savingsAmount,
        "servicesAmount":      config.servicesAmount,
        "subscriptionsAmount": config.subscriptionsAmount,
        "leisureAmount":       config.leisureAmount,
    }
    for _label, key in _PRIORITY_ORDER:
        if remaining < amounts[key]:
            return "EJERCICIO_DEFICIT"
        remaining -= amounts[key]
    return "EJERCICIO"


@router.get("/config", response_model=FundsConfigResponse)
def get_funds_config(current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    try:
        row = conn.execute(
            """SELECT pmt, ahorro_meta, servicios_monto, suscripciones_monto, ocio_monto
               FROM presupuesto WHERE usuario_id = ?""",
            (current_user["id"],)
        ).fetchone()

        if row is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Configuración de presupuesto no encontrada"
            )

        return FundsConfigResponse(
            monthlyBudget=row["pmt"],
            savingsAmount=row["ahorro_meta"],
            servicesAmount=row["servicios_monto"],
            subscriptionsAmount=row["suscripciones_monto"],
            leisureAmount=row["ocio_monto"],
        )
    finally:
        conn.close()


@router.put("/config", response_model=FundsConfigResponse)
def save_funds_config(
    body: FundsConfigRequest,
    current_user: dict = Depends(get_current_user)
):
    if body.monthlyBudget <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="El PMT debe ser mayor que cero"
        )

    estado = _compute_estado(body)

    conn = get_connection()
    try:
        # Sync subscriptionsAmount from the actual sum of active subscriptions in DB.
        sub_total = conn.execute(
            """SELECT COALESCE(SUM(monto), 0.0) FROM suscripciones
               WHERE usuario_id = ? AND estado != 'Suspendida'""",
            (current_user["id"],)
        ).fetchone()[0]

        conn.execute(
            """UPDATE presupuesto
               SET pmt = ?, ahorro_meta = ?, servicios_monto = ?,
                   suscripciones_monto = ?, ocio_monto = ?, estado = ?
               WHERE usuario_id = ?""",
            (
                body.monthlyBudget,
                body.savingsAmount,
                body.servicesAmount,
                sub_total,          # use real subscription total, not frontend value
                body.leisureAmount,
                estado,
                current_user["id"],
            )
        )
        conn.commit()

        return FundsConfigResponse(
            monthlyBudget=body.monthlyBudget,
            savingsAmount=body.savingsAmount,
            servicesAmount=body.servicesAmount,
            subscriptionsAmount=sub_total,
            leisureAmount=body.leisureAmount,
        )
    finally:
        conn.close()
