import pytest

from modulos.presupuesto.presupuesto import _asegurar_numero_no_negativo, configurar_presupuesto


@pytest.mark.parametrize(
    "pmt,ahorro_meta,pct_suscripciones,pct_servicios,pct_ocio,estado_esperado,saldos_esperados",
    [
        # Test 1: PMT no cubre el Ahorro, estado = EJERCICIO_DEFICIT. No hay distribución.
        (999, 1000, 30, 40, 30, "EJERCICIO_DEFICIT", {}),
        # Test 2: PMT cubre ahorro, se distribuye el sobrante según porcentajes.
        # Sobrante: 2000 - 1000 = 1000.
        # 30% = 300, 40% = 400, 30% = 300
        (2000, 1000, 30, 40, 30, "EJERCICIO", {
            "suscripciones": 300,
            "servicios": 400,
            "ocio": 300
        }),
    ],
)
def test_configurar_y_distribuir_presupuesto(
    pmt,
    ahorro_meta,
    pct_suscripciones,
    pct_servicios,
    pct_ocio,
    estado_esperado,
    saldos_esperados,
):
    estado, saldos, alertas = configurar_presupuesto(pmt, ahorro_meta, pct_suscripciones, pct_servicios, pct_ocio)
    assert estado == estado_esperado
    assert saldos == saldos_esperados
    if estado == "EJERCICIO_DEFICIT":
        assert "Deficit detectado en Ahorro" in alertas


def test_distribucion_rechaza_porcentajes_que_no_suman_100():
    # 30 + 40 + 40 = 110
    with pytest.raises(ValueError, match="La suma de porcentajes de distribucion debe ser exactamente 100"):
        configurar_presupuesto(2000, 1000, 30, 40, 40)

def test_distribucion_rechaza_porcentajes_negativos():
    with pytest.raises(ValueError, match="no puede ser negativo"):
        configurar_presupuesto(2000, 1000, -10, 60, 50)

@pytest.mark.parametrize(
    "kwargs,mensaje",
    [
        (dict(pmt=0, ahorro_meta=1, pct_suscripciones=30, pct_servicios=40, pct_ocio=30), "PMT debe ser mayor que cero"),
        (dict(pmt=-1, ahorro_meta=1, pct_suscripciones=30, pct_servicios=40, pct_ocio=30), "PMT no puede ser negativo"),
        (dict(pmt=1, ahorro_meta=-1, pct_suscripciones=30, pct_servicios=40, pct_ocio=30), "Ahorro no puede ser negativo"),
    ],
)
def test_validaciones_de_valores_requeridos(kwargs, mensaje):
    with pytest.raises(ValueError, match=mensaje):
        configurar_presupuesto(**kwargs)

def test_validacion_negativo_generica_para_nombre_desconocido():
    with pytest.raises(ValueError, match="Algo no puede ser negativo"):
        _asegurar_numero_no_negativo("Algo", -1)


def test_configurar_presupuesto_rechaza_pmt_absurdamente_alto():
    with pytest.raises(ValueError, match='El PMT excede el limite tecnico permitido de 1,000,000'):
        configurar_presupuesto(1000001, 1000, 30, 40, 30)
