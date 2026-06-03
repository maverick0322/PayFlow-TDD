import pytest

from transferencia import validar_transferencia


def test_transferencia_misma_es_aprobada():

    resultado = validar_transferencia(
        tipo_cuenta="Misma",
        hora=12,
        monto=1000,
        token=False
    )

    assert resultado["estado_final"] == "APROBADA"


def test_transferencia_misma_transiciona_de_pendiente_a_aprobada():

    resultado = validar_transferencia(
        tipo_cuenta="Misma",
        hora=12,
        monto=1000,
        token=False
    )

    assert resultado["estado_inicial"] == "PENDIENTE"
    assert resultado["estado_final"] == "APROBADA"


def test_transferencia_credito_fuera_de_horario_es_rechazada():

    resultado = validar_transferencia(
        tipo_cuenta="Crédito",
        hora=20,
        monto=1000,
        token=False
    )

    assert resultado["estado_inicial"] == "PENDIENTE"
    assert resultado["estado_final"] == "RECHAZADA_POR_POLITICA"


def test_transferencia_debito_mayor_a_5000_sin_token_es_rechazada():

    resultado = validar_transferencia(
        tipo_cuenta="Débito",
        hora=12,
        monto=7000,
        token=False
    )

    assert resultado["estado_inicial"] == "PENDIENTE"
    assert resultado["estado_final"] == "RECHAZADA_POR_POLITICA"


@pytest.mark.parametrize(
    "hora,estado_esperado",
    [
        (8, "RECHAZADA_POR_POLITICA"),
        (9, "APROBADA"),
        (18, "APROBADA"),
        (19, "RECHAZADA_POR_POLITICA"),
    ]
)
def test_fronteras_credito(hora, estado_esperado):

    resultado = validar_transferencia(
        tipo_cuenta="Crédito",
        hora=hora,
        monto=1000,
        token=False
    )

    assert resultado["estado_final"] == estado_esperado


@pytest.mark.parametrize(
    "monto,token,estado_esperado",
    [
        (5000, False, "APROBADA"),
        (5001, False, "RECHAZADA_POR_POLITICA"),
        (5001, True, "APROBADA"),
    ]
)
def test_fronteras_debito(
    monto,
    token,
    estado_esperado
):

    resultado = validar_transferencia(
        tipo_cuenta="Débito",
        hora=12,
        monto=monto,
        token=token
    )

    assert resultado["estado_final"] == estado_esperado