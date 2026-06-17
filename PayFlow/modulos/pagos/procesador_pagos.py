from dataclasses import dataclass
from enum import Enum

class ResultadoPago(Enum):
    EXITOSO = "PAGO_EXITOSO"
    RECHAZADO = "PAGO_RECHAZADO"
    CON_ADVERTENCIA = "PAGO_CON_ADVERTENCIA"

@dataclass
class SolicitudPago:
    saldo: float
    costo: float
    cuenta_activa: bool
    tarjeta_vencida: bool
    es_vip: bool

def procesar_suscripcion(solicitud: SolicitudPago) -> ResultadoPago:
    
    # R1: La cuenta no debe estar bloqueada por seguridad.
    if not solicitud.cuenta_activa:
        return ResultadoPago.RECHAZADO
        
    # R2: El usuario debe tener saldo suficiente para cubrir el costo.
    if solicitud.saldo < solicitud.costo:
        return ResultadoPago.RECHAZADO
        
    # Validación de vigencia de tarjeta.
    if solicitud.tarjeta_vencida:
        # R5: Regla especial VIP - se procesa con aviso.
        if solicitud.es_vip:
            return ResultadoPago.CON_ADVERTENCIA
        # R4: Usuario estándar con tarjeta vencida se rechaza.
        else:
            return ResultadoPago.RECHAZADO
            
    # R3: Caso de éxito estándar.
    return ResultadoPago.EXITOSO