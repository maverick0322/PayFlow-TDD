from dataclasses import dataclass
from datetime import date

@dataclass
class Suscripcion:
    monto: float
    fecha_cobro: date
    estado: str  # "Pendiente", "Pagada", "Vencida", "Suspendida"

def evaluar_suscripcion(suscripcion: Suscripcion, fecha_actual: date, saldo_disponible: float, en_corte: bool = False):
    """
    Retorna: (nuevo_estado, nuevo_saldo_disponible)
    """
    
    if fecha_actual < suscripcion.fecha_cobro:
        return suscripcion.estado, saldo_disponible

    # Si ya se pagó o suspendió, no hay cambio por evaluación normal
    if suscripcion.estado in ["Pagada", "Suspendida"]:
        return suscripcion.estado, saldo_disponible
        
    if en_corte and suscripcion.estado == "Vencida":
        return "Suspendida", saldo_disponible

    if saldo_disponible >= suscripcion.monto:
        return "Pagada", saldo_disponible - suscripcion.monto
    else:
        return "Vencida", saldo_disponible
