import pytest
from datetime import date
from modulos.pagos.suscripciones import evaluar_suscripcion, Suscripcion

def test_no_hacer_nada_si_fecha_no_alcanzada():
    susc = Suscripcion(monto=100.0, fecha_cobro=date(2023, 10, 15), estado="Pendiente")
    nuevo_estado, nuevo_saldo = evaluar_suscripcion(susc, fecha_actual=date(2023, 10, 10), saldo_disponible=500.0)
    assert nuevo_estado == "Pendiente"
    assert nuevo_saldo == 500.0

def test_marcar_pagada_con_saldo_suficiente():
    susc = Suscripcion(monto=100.0, fecha_cobro=date(2023, 10, 15), estado="Pendiente")
    nuevo_estado, nuevo_saldo = evaluar_suscripcion(susc, fecha_actual=date(2023, 10, 15), saldo_disponible=500.0)
    assert nuevo_estado == "Pagada"
    assert nuevo_saldo == 400.0

def test_marcar_vencida_sin_saldo_suficiente():
    susc = Suscripcion(monto=100.0, fecha_cobro=date(2023, 10, 15), estado="Pendiente")
    nuevo_estado, nuevo_saldo = evaluar_suscripcion(susc, fecha_actual=date(2023, 10, 15), saldo_disponible=50.0)
    assert nuevo_estado == "Vencida"
    assert nuevo_saldo == 50.0

def test_pago_exitoso_si_estaba_vencida_y_ahora_hay_saldo():
    susc = Suscripcion(monto=100.0, fecha_cobro=date(2023, 10, 15), estado="Vencida")
    nuevo_estado, nuevo_saldo = evaluar_suscripcion(susc, fecha_actual=date(2023, 10, 20), saldo_disponible=150.0)
    assert nuevo_estado == "Pagada"
    assert nuevo_saldo == 50.0

def test_transicionar_a_suspendida_en_corte_si_esta_vencida():
    susc = Suscripcion(monto=100.0, fecha_cobro=date(2023, 10, 15), estado="Vencida")
    nuevo_estado, nuevo_saldo = evaluar_suscripcion(susc, fecha_actual=date(2023, 10, 31), saldo_disponible=50.0, en_corte=True)
    assert nuevo_estado == "Suspendida"
    assert nuevo_saldo == 50.0

def test_mantener_pagada_en_corte_no_hace_nada():
    # El reinicio a Pendiente se hace en otra función según RF11, evaluar_suscripcion solo evalúa pagos/vencimientos
    susc = Suscripcion(monto=100.0, fecha_cobro=date(2023, 10, 15), estado="Pagada")
    nuevo_estado, nuevo_saldo = evaluar_suscripcion(susc, fecha_actual=date(2023, 10, 31), saldo_disponible=500.0, en_corte=True)
    assert nuevo_estado == "Pagada"
    assert nuevo_saldo == 500.0

def test_impedir_pago_sin_saldo_suficiente_estado_original_no_pagada():
    susc = Suscripcion(monto=100.0, fecha_cobro=date(2023, 10, 15), estado="Vencida")
    nuevo_estado, nuevo_saldo = evaluar_suscripcion(susc, fecha_actual=date(2023, 10, 15), saldo_disponible=20.0)
    assert nuevo_estado == "Vencida"
    assert nuevo_saldo == 20.0
