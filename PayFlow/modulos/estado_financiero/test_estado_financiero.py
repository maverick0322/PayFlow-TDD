import pytest
from datetime import date
from modulos.pagos.suscripciones import Suscripcion
from modulos.estado_financiero.estado import evaluar_salud_financiera
from modulos.estado_financiero.corte import ejecutar_corte_de_caja, generar_reporte_variabilidad

# --- CU07: Monitorear estado financiero ---

def test_estado_saludable():
    estado = evaluar_salud_financiera(saldo=150.0, pmt=1000.0, deficit_activo=False, suscripciones=[])
    # 150 es el 15% de 1000. >= 10% -> Saludable
    assert estado == "Saludable"

def test_estado_en_riesgo():
    estado = evaluar_salud_financiera(saldo=90.0, pmt=1000.0, deficit_activo=False, suscripciones=[])
    # 90 es el 9% de 1000. < 10% -> En Riesgo
    assert estado == "En Riesgo"

def test_estado_critico_por_saldo_cero():
    estado = evaluar_salud_financiera(saldo=0.0, pmt=1000.0, deficit_activo=False, suscripciones=[])
    assert estado == "Critico"

def test_estado_critico_por_deficit():
    estado = evaluar_salud_financiera(saldo=500.0, pmt=1000.0, deficit_activo=True, suscripciones=[])
    assert estado == "Critico"

def test_estado_critico_por_suscripcion_no_cubierta():
    suscripciones = [Suscripcion(monto=200.0, fecha_cobro=date(2023, 10, 20), estado="Pendiente")]
    # Saldo es > 10% (150 de 1000 = 15%), pero no cubre la suscripcion de 200 -> Critico
    estado = evaluar_salud_financiera(saldo=150.0, pmt=1000.0, deficit_activo=False, suscripciones=suscripciones)
    assert estado == "Critico"

# --- CU08: Ejecutar corte de caja ---

def test_corte_de_caja_reinicia_suscripciones():
    suscripciones = [
        Suscripcion(monto=100.0, fecha_cobro=date(2023, 10, 1), estado="Pagada"),
        Suscripcion(monto=50.0, fecha_cobro=date(2023, 10, 15), estado="Suspendida")
    ]
    suscripciones_reiniciadas = ejecutar_corte_de_caja(suscripciones)
    
    for s in suscripciones_reiniciadas:
        assert s.estado == "Pendiente"

# --- CU09: Generar reporte financiero ---

def test_reporte_financiero_variabilidad():
    gastos_proyectados = {"Servicios": 500.0, "Ocio": 300.0}
    gastos_reales = {"Servicios": 550.0, "Ocio": 150.0}
    
    reporte = generar_reporte_variabilidad(gastos_proyectados, gastos_reales)
    
    assert reporte["Servicios"]["proyectado"] == 500.0
    assert reporte["Servicios"]["real"] == 550.0
    assert reporte["Servicios"]["diferencia_absoluta"] == 50.0
    assert reporte["Servicios"]["variacion_porcentual"] == 10.0 # 10% excedido
    
    assert reporte["Ocio"]["proyectado"] == 300.0
    assert reporte["Ocio"]["real"] == 150.0
    assert reporte["Ocio"]["diferencia_absoluta"] == -150.0
    assert reporte["Ocio"]["variacion_porcentual"] == -50.0 # 50% ahorrado
