from typing import List, Tuple
from modulos.pagos.suscripciones import Suscripcion
from modulos.gastos_variables.gastos import registrar_gasto

def evaluar_riesgo(monto_gasto: float, saldo_actual: float, proximas_suscripciones: List[Suscripcion]) -> Tuple[bool, str]:
    """
    Evalúa si un gasto compromete alguna suscripción futura (estado Pendiente).
    Retorna (hay_riesgo, mensaje).
    """
    saldo_post_gasto = saldo_actual - monto_gasto
    
    for suscripcion in proximas_suscripciones:
        if suscripcion.estado == "Pendiente" and saldo_post_gasto < suscripcion.monto:
            return True, f"Riesgo detectado: El saldo de {saldo_post_gasto} no cubrira la proxima suscripcion de {suscripcion.monto}."
            
    return False, ""

def registrar_gasto_con_riesgo(
    categoria: str, 
    monto: float, 
    saldo_actual: float, 
    max_historico: float, 
    proximas_suscripciones: List[Suscripcion],
    confirma_riesgo: bool = False
) -> Tuple[float, bool, str]:
    """
    Intenta registrar un gasto evaluando el riesgo primero.
    Si hay riesgo y el usuario no confirma, se cancela.
    Si hay riesgo y el usuario confirma, procede.
    """
    # 1. Evaluar reglas de negocio base (limites historicos, fondos)
    try:
        nuevo_saldo = registrar_gasto(categoria, monto, saldo_actual, max_historico)
    except ValueError as e:
        return saldo_actual, False, str(e)
        
    # 2. Evaluar Riesgo Futuro
    hay_riesgo, msj_riesgo = evaluar_riesgo(monto, saldo_actual, proximas_suscripciones)
    
    if hay_riesgo:
        if not confirma_riesgo:
            return saldo_actual, False, "Operacion cancelada por el usuario debido a advertencia de riesgo."
        else:
            return nuevo_saldo, True, "Gasto registrado bajo riesgo. " + msj_riesgo

    return nuevo_saldo, True, "Gasto registrado exitosamente."
