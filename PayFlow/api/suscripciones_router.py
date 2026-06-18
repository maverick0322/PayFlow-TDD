import uuid
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from api.dependencies import get_current_user
from api.schemas import (
    SubscriptionResponse, CreateSubscriptionRequest,
    ConfirmPaymentRequest, ConfirmPaymentResponse,
)
from core.infrastructure.db import get_connection
from modulos.pagos.procesador_pagos import SolicitudPago, procesar_suscripcion, ResultadoPago
from modulos.pagos.suscripciones import Suscripcion, evaluar_suscripcion

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])

# Status translation maps (DB stores Spanish, API returns English).
_ES_TO_EN: dict[str, str] = {
    "Pagada":     "paid",
    "Pendiente":  "pending",
    "Vencida":    "overdue",
    "Suspendida": "suspended",
}
_EN_TO_ES: dict[str, str] = {v: k for k, v in _ES_TO_EN.items()}


def _row_to_response(row) -> SubscriptionResponse:
    return SubscriptionResponse(
        id=row["id"],
        name=row["nombre"],
        icon=row["icono"] or "subscriptions",
        iconColor=row["color_icono"] or "#3525cd",
        billingDate=row["fecha_cobro"],
        amount=row["monto"],
        status=_ES_TO_EN.get(row["estado"], "pending"),
        billingCycle=row["ciclo"],
        category=row["categoria"],
    )


@router.get("", response_model=list[SubscriptionResponse])
def list_subscriptions(current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM suscripciones WHERE usuario_id = ? ORDER BY fecha_cobro ASC",
            (current_user["id"],)
        ).fetchall()
        return [_row_to_response(r) for r in rows]
    finally:
        conn.close()


@router.post("", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
def create_subscription(
    body: CreateSubscriptionRequest,
    current_user: dict = Depends(get_current_user)
):
    new_id = str(uuid.uuid4())
    conn = get_connection()
    try:
        conn.execute(
            """INSERT INTO suscripciones
               (id, usuario_id, nombre, monto, fecha_cobro, estado, ciclo, categoria, icono, color_icono)
               VALUES (?, ?, ?, ?, ?, 'Pendiente', ?, ?, 'subscriptions', '#3525cd')""",
            (new_id, current_user["id"], body.name, body.amount,
             body.billingDate, body.billingCycle, body.category)
        )
        # Refresh subscriptionsAmount in presupuesto.
        _sync_suscripciones_monto(current_user["id"], conn)
        conn.commit()

        row = conn.execute(
            "SELECT * FROM suscripciones WHERE id = ?", (new_id,)
        ).fetchone()
        return _row_to_response(row)
    finally:
        conn.close()


@router.post("/{sub_id}/confirm", response_model=ConfirmPaymentResponse)
def confirm_payment(
    sub_id: str,
    body: ConfirmPaymentRequest,
    current_user: dict = Depends(get_current_user)
):
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT * FROM suscripciones WHERE id = ? AND usuario_id = ?",
            (sub_id, current_user["id"])
        ).fetchone()
        if row is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Suscripción no encontrada")

        cuenta = conn.execute(
            "SELECT saldo FROM cuenta WHERE usuario_id = ?",
            (current_user["id"],)
        ).fetchone()
        saldo_actual = cuenta["saldo"] if cuenta else body.currentBalance

        solicitud = SolicitudPago(
            saldo=saldo_actual,
            costo=row["monto"],
            cuenta_activa=True,
            tarjeta_vencida=body.tarjetaVencida,
            es_vip=body.esVip,
        )
        resultado = procesar_suscripcion(solicitud)

        if resultado == ResultadoPago.RECHAZADO:
            new_status_es = "Vencida"
            new_status_en = "overdue"
            new_balance = saldo_actual
        else:
            # EXITOSO or CON_ADVERTENCIA — deduct amount.
            new_status_es = "Pagada"
            new_status_en = "paid"
            new_balance = saldo_actual - row["monto"]
            conn.execute(
                "UPDATE cuenta SET saldo = ? WHERE usuario_id = ?",
                (new_balance, current_user["id"])
            )

        conn.execute(
            "UPDATE suscripciones SET estado = ? WHERE id = ?",
            (new_status_es, sub_id)
        )
        conn.commit()

        return ConfirmPaymentResponse(
            result=resultado.value,       # 'PAGO_EXITOSO' | 'PAGO_RECHAZADO' | 'PAGO_CON_ADVERTENCIA'
            newStatus=new_status_en,
            newBalance=new_balance,
        )
    finally:
        conn.close()


@router.delete("/{sub_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subscription(sub_id: str, current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    try:
        result = conn.execute(
            "DELETE FROM suscripciones WHERE id = ? AND usuario_id = ?",
            (sub_id, current_user["id"])
        )
        if result.rowcount == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Suscripción no encontrada")
        _sync_suscripciones_monto(current_user["id"], conn)
        conn.commit()
    finally:
        conn.close()


def _sync_suscripciones_monto(usuario_id: int, conn) -> None:
    """Keeps presupuesto.suscripciones_monto in sync with the real subscription total."""
    total = conn.execute(
        "SELECT COALESCE(SUM(monto), 0.0) FROM suscripciones WHERE usuario_id = ? AND estado != 'Suspendida'",
        (usuario_id,)
    ).fetchone()[0]
    conn.execute(
        "UPDATE presupuesto SET suscripciones_monto = ? WHERE usuario_id = ?",
        (total, usuario_id)
    )
