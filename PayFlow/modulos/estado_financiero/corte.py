from typing import List, Dict, Any
from modulos.pagos.suscripciones import Suscripcion

def ejecutar_corte_de_caja(suscripciones: List[Suscripcion]) -> List[Suscripcion]:
    """
    Reinicia todas las suscripciones a Pendiente para el nuevo periodo.
    """
    for suscripcion in suscripciones:
        suscripcion.estado = "Pendiente"
    return suscripciones

def generar_reporte_variabilidad(gastos_proyectados: Dict[str, float], gastos_reales: Dict[str, float]) -> Dict[str, Dict[str, Any]]:
    """
    Calcula la variación absoluta y porcentual.
    """
    reporte = {}
    
    for categoria, proyectado in gastos_proyectados.items():
        real = gastos_reales.get(categoria, 0.0)
        diferencia = real - proyectado
        
        # Variacion porcentual: si proyecte 100 y gaste 110, variacion es +10%
        # Si proyecte 100 y gaste 50, variacion es -50%
        variacion_pct = 0.0
        if proyectado > 0:
            variacion_pct = (diferencia / proyectado) * 100.0
            
        reporte[categoria] = {
            "proyectado": proyectado,
            "real": real,
            "diferencia_absoluta": diferencia,
            "variacion_porcentual": variacion_pct
        }
        
    return reporte
