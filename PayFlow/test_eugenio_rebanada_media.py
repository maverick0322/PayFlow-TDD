"""
Suite de Eugenio: rebanada de capa media.

Objetivo:
- Probar autorización, rechazo, empaquetado y folio.
- Mockear capa inferior y capa superior para aislar la orquestación.
"""

from unittest.mock import patch
import pytest

import modulos.inversiones.inversiones as inv


def test_r7_autoriza_si_saldo_suficiente_y_perfil_compatible():
    resultado = inv.autorizar_inversion(
        capital=1000,
        saldo=5000,
        perfil=inv.BAJO_RIESGO,
        antiguedad_meses=6,
        plazo_meses=12,
    )

    assert resultado.nuevo_estado == inv.INVERSION_ESTABLE
    assert resultado.folio_aprobacion is not None


def test_r7_rechaza_por_saldo_insuficiente():
    resultado = inv.autorizar_inversion(
        capital=6000,
        saldo=5000,
        perfil=inv.BAJO_RIESGO,
        antiguedad_meses=6,
        plazo_meses=12,
    )

    assert resultado.monto_final is None
    assert resultado.nuevo_estado == inv.RECHAZADA
    assert resultado.folio_aprobacion is None


def test_r8_resultado_incluye_monto_estado_y_folio():
    with patch("modulos.inversiones.inversiones.calcular_monto_final", return_value=1250.75):
        with patch("modulos.inversiones.inversiones.definir_estado_inversion", return_value=inv.INVERSION_ESTABLE):
            resultado = inv.autorizar_inversion(
                capital=1000,
                saldo=5000,
                perfil=inv.BAJO_RIESGO,
                antiguedad_meses=6,
                plazo_meses=12,
            )

    assert resultado.monto_final == 1250.75
    assert resultado.nuevo_estado == inv.INVERSION_ESTABLE
    assert resultado.folio_aprobacion == "B-E-1251"


def test_r9_genera_folio_solo_si_autorizada():
    folio = inv.generar_folio(
        perfil=inv.ALTO_RIESGO,
        estado=inv.INVERSION_RIESGOSA,
        monto_final=1120.20,
    )

    assert folio == "A-R-1120"


def test_r9_no_genera_folio_si_rechazada_por_perfil_incompatible():
    resultado = inv.autorizar_inversion(
        capital=1000,
        saldo=5000,
        perfil=inv.ALTO_RIESGO,
        antiguedad_meses=2,
        plazo_meses=12,
    )

    assert resultado.nuevo_estado == inv.RECHAZADA
    assert resultado.folio_aprobacion is None


def test_rebanada_eugenio_media_con_capas_ajenas_mockeadas():
    """
    Evidencia de la rebanada central:
    Eugenio prueba la capa media aislando las dos capas externas.
    """
    with patch("modulos.inversiones.inversiones.perfil_es_compatible", return_value=True):
        with patch("modulos.inversiones.inversiones.calcular_monto_final", return_value=1500.40):
            with patch("modulos.inversiones.inversiones.definir_estado_inversion", return_value=inv.INVERSION_RIESGOSA):
                resultado = inv.autorizar_inversion(
                    capital=3000,
                    saldo=5000,
                    perfil=inv.ALTO_RIESGO,
                    antiguedad_meses=10,
                    plazo_meses=12,
                )

    assert resultado.monto_final == 1500.40
    assert resultado.nuevo_estado == inv.INVERSION_RIESGOSA
    assert resultado.folio_aprobacion == "A-R-1500"
