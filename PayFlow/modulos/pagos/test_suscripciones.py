import pytest
from modulos.pagos.procesador_pagos import procesar_suscripcion, SolicitudPago, ResultadoPago

def test_R1_cuenta_bloqueada_rechaza():
    
    datos = SolicitudPago(saldo=1000, costo=50, cuenta_activa=False, tarjeta_vencida=False, es_vip=True)
    assert procesar_suscripcion(datos) == ResultadoPago.RECHAZADO

def test_R2_saldo_insuficiente_rechaza():
    datos = SolicitudPago(saldo=10, costo=50, cuenta_activa=True, tarjeta_vencida=False, es_vip=False)
    assert procesar_suscripcion(datos) == ResultadoPago.RECHAZADO

def test_R3_condiciones_ideales_pasa():
    datos = SolicitudPago(saldo=100, costo=50, cuenta_activa=True, tarjeta_vencida=False, es_vip=False)
    assert procesar_suscripcion(datos) == ResultadoPago.EXITOSO

def test_R4_tarjeta_vencida_estandar_rechaza():
    datos = SolicitudPago(saldo=100, costo=50, cuenta_activa=True, tarjeta_vencida=True, es_vip=False)
    assert procesar_suscripcion(datos) == ResultadoPago.RECHAZADO

def test_R5_tarjeta_vencida_vip_pasa_con_advertencia():

    datos = SolicitudPago(saldo=100, costo=50, cuenta_activa=True, tarjeta_vencida=True, es_vip=True)
    assert procesar_suscripcion(datos) == ResultadoPago.CON_ADVERTENCIA