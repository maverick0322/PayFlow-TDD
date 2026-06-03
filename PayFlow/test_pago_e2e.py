import pytest
from payflow_pago import procesar_pago


def test_pago_exitoso_renta():
    cuenta_usuario = {
        "id_usuario": 1,
        "saldo": 5000
    }

    resultado = procesar_pago(
        cuenta_usuario,
        concepto="Renta",
        monto=3500
    )

    assert resultado["estado"] == "APROBADO"
    assert resultado["nuevo_saldo"] == 1485
    assert resultado["folio"].startswith("PAGO-RENTA")


def test_saldo_insuficiente_por_comision():
    cuenta_usuario = {
        "id_usuario": 1,
        "saldo": 1010
    }

    resultado = procesar_pago(
        cuenta_usuario,
        concepto="Internet",
        monto=1000
    )

    assert resultado["estado"] == "RECHAZADO"
    assert resultado["mensaje"] == "Fondos insuficientes"

    assert cuenta_usuario["saldo"] == 1010


def test_concepto_invalido():
    cuenta_usuario = {
        "id_usuario": 1,
        "saldo": 5000
    }

    resultado = procesar_pago(
        cuenta_usuario,
        concepto="Netflix",
        monto=500
    )

    assert resultado["estado"] == "RECHAZADO"
    assert resultado["mensaje"] == "Concepto inválido"

    assert cuenta_usuario["saldo"] == 5000