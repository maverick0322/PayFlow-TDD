from fastapi import APIRouter, Depends, HTTPException, status
from api.dependencies import get_current_user
from api.schemas import CreateTransactionRequest, CreateTransactionResponse
from core.infrastructure.db import get_connection, get_max_historico
from modulos.pagos.suscripciones import Suscripcion
from modulos.gastos_variables.riesgo import registrar_gasto_con_riesgo
from datetime import date as Date

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.post("", response_model=CreateTransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
    body: CreateTransactionRequest,
    current_user: dict = Depends(get_current_user)
):
    conn = get_connection()
    try:
        cuenta = conn.execute(
            "SELECT saldo FROM cuenta WHERE usuario_id = ?",
            (current_user["id"],)
        ).fetchone()
        if cuenta is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cuenta financiera no encontrada para el usuario"
            )
        saldo_actual = cuenta["saldo"]

        # max_historico: max single transaction for this category in the user's history.
        max_hist = get_max_historico(current_user["id"], body.category, conn)

        # Fetch pending subscriptions for risk evaluation.
        sub_rows = conn.execute(
            """SELECT monto, fecha_cobro, estado FROM suscripciones
               WHERE usuario_id = ? AND estado = 'Pendiente'""",
            (current_user["id"],)
        ).fetchall()
        pending_subs = [
            Suscripcion(
                monto=r["monto"],
                fecha_cobro=Date.fromisoformat(r["fecha_cobro"]) if r["fecha_cobro"] else Date.today(),
                estado=r["estado"],
            )
            for r in sub_rows
        ]

        nuevo_saldo, ok, mensaje = registrar_gasto_con_riesgo(
            categoria=body.category,
            monto=body.amount,
            saldo_actual=saldo_actual,
            max_historico=max_hist,
            proximas_suscripciones=pending_subs,
            confirma_riesgo=body.confirmaRiesgo,
        )

        if not ok:
            # Domain rejected the transaction — return 422 with the domain message.
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=mensaje
            )

        # Persist the approved transaction and update the balance.
        cursor = conn.execute(
            "INSERT INTO gastos (usuario_id, categoria, monto, fecha, descripcion) VALUES (?, ?, ?, ?, ?)",
            (current_user["id"], body.category, body.amount, body.date, body.description)
        )
        gasto_id = cursor.lastrowid

        conn.execute(
            "UPDATE cuenta SET saldo = ? WHERE usuario_id = ?",
            (nuevo_saldo, current_user["id"])
        )
        conn.commit()

        return CreateTransactionResponse(
            id=gasto_id,
            amount=body.amount,
            category=body.category,
            date=body.date,
            description=body.description,
            ok=True,
            mensaje=mensaje,
            newBalance=round(nuevo_saldo, 2),
        )
    finally:
        conn.close()
