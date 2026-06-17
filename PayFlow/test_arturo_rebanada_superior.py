"""
Suite de Arturo: rebanada de capa inferior.

Objetivo:
- Probar la lógica matemática real.
- Usar mocks para aislar la capa superior cuando se valida la integración
  desde abajo hacia el centro del sandwich.
"""

from unittest.mock import patch
import pytest

import modulos.inversiones.inversiones as inv


def test_r1_calcula_interes_compuesto_bajo_riesgo_12_meses():
    resultado = inv.calcular_monto_final(
        capital=1000,
        perfil=inv.BAJO_RIESGO,
        plazo_meses=12,
    )

    assert resultado == pytest.approx(1050.00)


def test_r2_calcula_interes_compuesto_alto_riesgo_12_meses():
    resultado = inv.calcular_monto_final(
        capital=1000,
        perfil=inv.ALTO_RIESGO,
        plazo_meses=12,
    )

    assert resultado == pytest.approx(1120.00)


def test_r3_rechaza_capital_negativo():
    with pytest.raises(ValueError):
        inv.calcular_monto_final(
            capital=-100,
            perfil=inv.BAJO_RIESGO,
            plazo_meses=12,
        )


def test_r3_rechaza_plazo_menor_a_12_meses():
    with pytest.raises(ValueError):
        inv.calcular_monto_final(
            capital=1000,
            perfil=inv.BAJO_RIESGO,
            plazo_meses=6,
        )


def test_rebanada_arturo_bottom_up_con_capa_superior_mockeada():
    """
    Evidencia Sandwich Bottom-Up:
    Arturo usa la capa inferior real y mockea una decisión de capa superior.
    Así se valida que el cálculo matemático puede integrarse aunque
    la gestión de estados sea una dependencia externa simulada.
    """
    with patch("modulos.inversiones.inversiones.definir_estado_inversion", return_value=inv.INVERSION_ESTABLE):
        resultado = inv.autorizar_inversion(
            capital=1000,
            saldo=5000,
            perfil=inv.BAJO_RIESGO,
            antiguedad_meses=6,
            plazo_meses=12,
        )

    assert resultado.monto_final == pytest.approx(1050.00)
    assert resultado.nuevo_estado == inv.INVERSION_ESTABLE
    assert resultado.folio_aprobacion == "B-E-1050"
