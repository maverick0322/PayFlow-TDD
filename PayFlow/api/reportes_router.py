from datetime import date
from fastapi import APIRouter, Depends
from api.dependencies import get_current_user
from api.schemas import VariabilityReportResponse, ReportCategorySchema
from core.infrastructure.db import get_connection
from modulos.estado_financiero.corte import generar_reporte_variabilidad

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/variability", response_model=VariabilityReportResponse)
def get_variability_report(current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    try:
        pres = conn.execute(
            """SELECT pmt, ahorro_meta, servicios_monto, suscripciones_monto, ocio_monto
               FROM presupuesto WHERE usuario_id = ?""",
            (current_user["id"],)
        ).fetchone()

        # Proyectado: from stored presupuesto config.
        gastos_proyectados: dict[str, float] = {
            "Ahorro":         pres["ahorro_meta"] if pres else 0.0,
            "Hogar/Servicios":pres["servicios_monto"] if pres else 0.0,
            "Suscripciones":  pres["suscripciones_monto"] if pres else 0.0,
            "Ocio/Consumo":   pres["ocio_monto"] if pres else 0.0,
        }

        # Real: gastos this month grouped by category.
        today = date.today()
        first_this_month = today.replace(day=1).isoformat()

        gastos_rows = conn.execute(
            """SELECT categoria, COALESCE(SUM(monto), 0.0) as total
               FROM gastos WHERE usuario_id = ? AND fecha >= ?
               GROUP BY categoria""",
            (current_user["id"], first_this_month)
        ).fetchall()

        gastos_reales: dict[str, float] = {
            "Ahorro": 0.0,  # Ahorro is a withholding, not a spend — always 0 actual
        }
        for row in gastos_rows:
            label = "Hogar/Servicios" if row["categoria"] == "hogar" else "Ocio/Consumo"
            gastos_reales[label] = gastos_reales.get(label, 0.0) + row["total"]

        # Sum of paid subscriptions this month.
        subs_pagadas = conn.execute(
            """SELECT COALESCE(SUM(monto), 0.0) FROM suscripciones
               WHERE usuario_id = ? AND estado = 'Pagada'""",
            (current_user["id"],)
        ).fetchone()[0]
        gastos_reales["Suscripciones"] = subs_pagadas

        # Call domain function.
        reporte = generar_reporte_variabilidad(gastos_proyectados, gastos_reales)

        categories = [
            ReportCategorySchema(
                name=cat,
                budgeted=round(data["proyectado"], 2),
                actual=round(data["real"], 2),
                deviation=round(data["diferencia_absoluta"], 2),
            )
            for cat, data in reporte.items()
        ]

        total_deviation = sum(c.deviation for c in categories)
        deviation_direction = (
            "above"    if total_deviation > 0 else
            "below"    if total_deviation < 0 else
            "on_track"
        )

        month_label = today.strftime("%B %Y").capitalize()

        return VariabilityReportResponse(
            period=month_label,
            totalDeviation=round(total_deviation, 2),
            deviationDirection=deviation_direction,
            categories=categories,
        )
    finally:
        conn.close()
