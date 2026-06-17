import pytest
from datetime import date
from modulos.pagos.suscripciones import Suscripcion
from modulos.gastos_variables.riesgo import evaluar_riesgo, registrar_gasto_con_riesgo

def test_calculo_saldo_posterior_sin_riesgo():
    suscripciones = [Suscripcion(monto=100.0, fecha_cobro=date(2023, 10, 20), estado="Pendiente")]
    hay_riesgo, mensaje = evaluar_riesgo(monto_gasto=50.0, saldo_actual=200.0, proximas_suscripciones=suscripciones)
    # saldo_post = 150.0. Suscripcion = 100.0. No hay riesgo.
    assert hay_riesgo is False
    assert mensaje == ""

def test_detectar_riesgo_contra_proxima_suscripcion():
    suscripciones = [Suscripcion(monto=100.0, fecha_cobro=date(2023, 10, 20), estado="Pendiente")]
    hay_riesgo, mensaje = evaluar_riesgo(monto_gasto=150.0, saldo_actual=200.0, proximas_suscripciones=suscripciones)
    # saldo_post = 50.0. Suscripcion = 100.0. Riesgo detectado.
    assert hay_riesgo is True
    assert "Riesgo detectado" in mensaje

def test_advertencia_usuario_cancela_operacion():
    suscripciones = [Suscripcion(monto=100.0, fecha_cobro=date(2023, 10, 20), estado="Pendiente")]
    # Usuario decide no confirmar (confirma_riesgo = False)
    nuevo_saldo, exito, msj = registrar_gasto_con_riesgo(
        categoria="Ocio", 
        monto=150.0, 
        saldo_actual=200.0, 
        max_historico=200.0, 
        proximas_suscripciones=suscripciones,
        confirma_riesgo=False
    )
    assert exito is False
    assert "Operacion cancelada por el usuario" in msj
    assert nuevo_saldo == 200.0 # No cambió

def test_advertencia_usuario_confirma_operacion():
    suscripciones = [Suscripcion(monto=100.0, fecha_cobro=date(2023, 10, 20), estado="Pendiente")]
    # Usuario confirma (confirma_riesgo = True)
    nuevo_saldo, exito, msj = registrar_gasto_con_riesgo(
        categoria="Ocio", 
        monto=150.0, 
        saldo_actual=200.0, 
        max_historico=200.0, 
        proximas_suscripciones=suscripciones,
        confirma_riesgo=True
    )
    assert exito is True
    assert "Gasto registrado bajo riesgo" in msj
    assert nuevo_saldo == 50.0

def test_operacion_normal_sin_riesgo_registra_automaticamente():
    suscripciones = [Suscripcion(monto=100.0, fecha_cobro=date(2023, 10, 20), estado="Pendiente")]
    nuevo_saldo, exito, msj = registrar_gasto_con_riesgo(
        categoria="Ocio", 
        monto=50.0, 
        saldo_actual=200.0, 
        max_historico=200.0, 
        proximas_suscripciones=suscripciones,
        confirma_riesgo=False # No importa porque no hay riesgo
    )
    assert exito is True
    assert "Gasto registrado exitosamente" in msj
    assert nuevo_saldo == 150.0
