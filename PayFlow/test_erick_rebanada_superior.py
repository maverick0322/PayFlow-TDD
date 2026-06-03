"""
Suite de Erick: rebanada de capa superior.

Objetivo:
- Probar los estados y reglas de perfil reales.
- Usar mocks para aislar la capa inferior cuando se valida integración
  desde arriba hacia el centro del sandwich.
"""

from unittest.mock import patch
import pytest

import inversiones as inv


def test_r4_estado_inicial_es_disponible():
    assert inv.obtener_estado_inicial() == inv.DISPONIBLE


def test_r5_inversion_estable_si_capital_es_50_por_ciento_o_menos():
    estado = inv.definir_estado_inversion(
        capital=2500,
        saldo=5000,
    )

    assert estado == inv.INVERSION_ESTABLE


def test_r5_inversion_riesgosa_si_capital_es_mayor_al_50_por_ciento():
    estado = inv.definir_estado_inversion(
        capital=3000,
        saldo=5000,
    )

    assert estado == inv.INVERSION_RIESGOSA


def test_r6_cuenta_nueva_no_puede_alto_riesgo():
    permitido = inv.perfil_es_compatible(
        perfil=inv.ALTO_RIESGO,
        antiguedad_meses=2,
    )

    assert permitido is False


def test_r6_cuenta_nueva_si_puede_bajo_riesgo():
    permitido = inv.perfil_es_compatible(
        perfil=inv.BAJO_RIESGO,
        antiguedad_meses=2,
    )

    assert permitido is True


def test_rebanada_erick_top_down_con_capa_inferior_mockeada():
    """
    Evidencia Sandwich Top-Down:
    Erick prueba la capa superior real y mockea el cálculo matemático.
    Así se valida que la clasificación de estado funciona aunque
    la capa inferior todavía no estuviera terminada.
    """
    with patch("inversiones.calcular_monto_final", return_value=1250.75):
        resultado = inv.autorizar_inversion(
            capital=3000,
            saldo=5000,
            perfil=inv.BAJO_RIESGO,
            antiguedad_meses=6,
            plazo_meses=12,
        )

    assert resultado.monto_final == 1250.75
    assert resultado.nuevo_estado == inv.INVERSION_RIESGOSA
    assert resultado.folio_aprobacion == "B-R-1251"
