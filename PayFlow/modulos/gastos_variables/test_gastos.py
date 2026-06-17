import pytest
from modulos.gastos_variables.gastos import registrar_gasto

def test_registrar_gasto_valido_servicios():
    nuevo_saldo = registrar_gasto(categoria="Servicios", monto=100.0, saldo_actual=500.0, max_historico=100.0)
    assert nuevo_saldo == 400.0

def test_registrar_gasto_valido_ocio():
    nuevo_saldo = registrar_gasto(categoria="Ocio", monto=50.0, saldo_actual=200.0, max_historico=40.0)
    # max = 40.0 * 1.5 = 60.0. Como 50.0 <= 60.0, pasa.
    assert nuevo_saldo == 150.0

def test_rechazar_monto_negativo():
    with pytest.raises(ValueError, match="El monto del gasto no puede ser negativo ni cero"):
        registrar_gasto(categoria="Ocio", monto=-10.0, saldo_actual=500.0, max_historico=100.0)

def test_rechazar_monto_cero():
    with pytest.raises(ValueError, match="El monto del gasto no puede ser negativo ni cero"):
        registrar_gasto(categoria="Servicios", monto=0.0, saldo_actual=500.0, max_historico=100.0)

def test_validar_limite_maximo_historico():
    # max = 100 * 1.5 = 150.
    # Monto de 151 debería ser rechazado.
    with pytest.raises(ValueError, match="El monto excede el limite razonable"):
        registrar_gasto(categoria="Ocio", monto=151.0, saldo_actual=500.0, max_historico=100.0)

def test_rechazar_si_saldo_es_insuficiente():
    with pytest.raises(ValueError, match="Saldo insuficiente para registrar el gasto"):
        registrar_gasto(categoria="Servicios", monto=100.0, saldo_actual=50.0, max_historico=100.0)
