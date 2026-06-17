from typing import List
from modulos.pagos.suscripciones import Suscripcion

def evaluar_salud_financiera(saldo: float, pmt: float, deficit_activo: bool, suscripciones: List[Suscripcion]) -> str:
    """
    Retorna el estado de salud financiera: "Saludable", "En Riesgo", o "Critico".
    """
    if deficit_activo:
        return "Critico"
        
    if saldo == 0.0:
        return "Critico"
        
    for suscripcion in suscripciones:
        if suscripcion.estado == "Pendiente" and saldo < suscripcion.monto:
            return "Critico"
            
    if pmt > 0 and (saldo / pmt) < 0.10:
        return "En Riesgo"
        
    return "Saludable"
