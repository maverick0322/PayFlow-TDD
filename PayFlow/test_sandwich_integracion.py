"""
Suite de integración Sandwich Testing.

Objetivo:
- Validar que las tres capas ya integradas trabajan juntas.
- Aquí no se usan mocks porque esta suite comprueba el encuentro real
  entre capa superior, capa media y capa inferior.
"""

import pytest

import inversiones as inv


def test_sandwich_integracion_bajo_riesgo_estable():
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


def test_sandwich_integracion_alto_riesgo_riesgosa():
    resultado = inv.autorizar_inversion(
        capital=3000,
        saldo=5000,
        perfil=inv.ALTO_RIESGO,
        antiguedad_meses=6,
        plazo_meses=12,
    )

    assert resultado.monto_final == pytest.approx(3360.00)
    assert resultado.nuevo_estado == inv.INVERSION_RIESGOSA
    assert resultado.folio_aprobacion == "A-R-3360"


def test_sandwich_integracion_rechazo_por_cuenta_nueva_alto_riesgo():
    resultado = inv.autorizar_inversion(
        capital=1000,
        saldo=5000,
        perfil=inv.ALTO_RIESGO,
        antiguedad_meses=2,
        plazo_meses=12,
    )

    assert resultado.monto_final is None
    assert resultado.nuevo_estado == inv.RECHAZADA
    assert resultado.folio_aprobacion is None


def test_sandwich_integracion_rechazo_por_plazo_invalido():
    resultado = inv.autorizar_inversion(
        capital=1000,
        saldo=5000,
        perfil=inv.BAJO_RIESGO,
        antiguedad_meses=6,
        plazo_meses=6,
    )

    assert resultado.monto_final is None
    assert resultado.nuevo_estado == inv.RECHAZADA
    assert resultado.folio_aprobacion is None
