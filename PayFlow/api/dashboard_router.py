from datetime import date, timedelta
from fastapi import APIRouter, Depends
from api.dependencies import get_current_user
from api.schemas import DashboardSummaryResponse, ExpenseCardSchema
from core.infrastructure.db import get_connection
from modulos.pagos.suscripciones import Suscripcion
from modulos.estado_financiero.estado import evaluar_salud_financiera

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

_STATUS_MAP = {
    "Saludable": "healthy",
    "En Riesgo":  "at_risk",
    "Critico":    "critical",
}


@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    try:
        cuenta = conn.execute(
            "SELECT saldo FROM cuenta WHERE usuario_id = ?",
            (current_user["id"],)
        ).fetchone()
        saldo = cuenta["saldo"] if cuenta else 0.0

        pres = conn.execute(
            """SELECT pmt, ahorro_meta, suscripciones_monto, servicios_monto,
                      ocio_monto, estado
               FROM presupuesto WHERE usuario_id = ?""",
            (current_user["id"],)
        ).fetchone()

        pmt = pres["pmt"] if pres else 0.0
        budget_state = pres["estado"] if pres else "CONFIGURACION"
        deficit_activo = budget_state == "EJERCICIO_DEFICIT"

        # Build Suscripcion objects for domain evaluation.
        sub_rows = conn.execute(
            "SELECT monto, fecha_cobro, estado FROM suscripciones WHERE usuario_id = ?",
            (current_user["id"],)
        ).fetchall()
        suscripciones = [
            Suscripcion(
                monto=r["monto"],
                fecha_cobro=date.fromisoformat(r["fecha_cobro"]) if r["fecha_cobro"] else date.today(),
                estado=r["estado"],
            )
            for r in sub_rows
        ]

        salud_raw = evaluar_salud_financiera(saldo, pmt, deficit_activo, suscripciones)
        system_status = _STATUS_MAP.get(salud_raw, "healthy")

        # Monthly change: compare this month's total gastos vs last month's.
        today = date.today()
        first_this_month = today.replace(day=1).isoformat()
        first_last_month = (today.replace(day=1) - timedelta(days=1)).replace(day=1).isoformat()
        last_last_month  = today.replace(day=1).isoformat()

        gastos_este_mes = conn.execute(
            "SELECT COALESCE(SUM(monto), 0.0) FROM gastos WHERE usuario_id = ? AND fecha >= ?",
            (current_user["id"], first_this_month)
        ).fetchone()[0]

        gastos_mes_anterior = conn.execute(
            "SELECT COALESCE(SUM(monto), 0.0) FROM gastos WHERE usuario_id = ? AND fecha >= ? AND fecha < ?",
            (current_user["id"], first_last_month, last_last_month)
        ).fetchone()[0]

        if gastos_mes_anterior > 0:
            change_pct = ((gastos_este_mes - gastos_mes_anterior) / gastos_mes_anterior) * 100
        else:
            change_pct = 0.0

        # Expense summary cards.
        subs_activas_total = conn.execute(
            """SELECT COALESCE(SUM(monto), 0.0) FROM suscripciones
               WHERE usuario_id = ? AND estado != 'Suspendida'""",
            (current_user["id"],)
        ).fetchone()[0]

        gastos_vars_total = conn.execute(
            "SELECT COALESCE(SUM(monto), 0.0) FROM gastos WHERE usuario_id = ? AND fecha >= ?",
            (current_user["id"], first_this_month)
        ).fetchone()[0]

        expense_cards = [
            ExpenseCardSchema(id="1", label="Suscripciones Activas", amount=round(subs_activas_total, 2), icon="subscriptions"),
            ExpenseCardSchema(id="2", label="Gastos Variables (mes)", amount=round(gastos_vars_total, 2), icon="shopping_cart"),
        ]

        deficit_alerts: list[str] = []
        if deficit_activo:
            deficit_alerts.append("Presupuesto en déficit — revisa la configuración de fondos")

        return DashboardSummaryResponse(
            availableBalance=round(saldo, 2),
            totalBudget=round(pmt, 2),
            monthlyChangePercent=round(change_pct, 2),
            systemStatus=system_status,
            budgetState=budget_state,
            deficitAlerts=deficit_alerts,
            expenseCards=expense_cards,
        )
    finally:
        conn.close()
