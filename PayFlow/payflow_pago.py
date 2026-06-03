from datetime import datetime


COMISION = 15
CONCEPTOS_VALIDOS = ["Renta", "Internet", "Luz"]


# ==========================
# CAPA SUPERIOR (Validación)
# ==========================

def validar_concepto(concepto):
    return concepto in CONCEPTOS_VALIDOS


def validar_fondos(saldo, monto):
    return saldo >= (monto + COMISION)


# ==========================
# CAPA INFERIOR (Balance)
# ==========================

def calcular_nuevo_saldo(saldo, monto):
    return saldo - monto - COMISION


# ==========================
# CAPA MEDIA (Comprobante)
# ==========================

def generar_folio(concepto):
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    return f"PAGO-{concepto.upper()}{timestamp}"


def procesar_pago(cuenta_usuario, concepto, monto):

    if not validar_concepto(concepto):
        return {
            "estado": "RECHAZADO",
            "mensaje": "Concepto inválido"
        }

    saldo_actual = cuenta_usuario["saldo"]

    if not validar_fondos(saldo_actual, monto):
        return {
            "estado": "RECHAZADO",
            "mensaje": "Fondos insuficientes"
        }

    nuevo_saldo = calcular_nuevo_saldo(
        saldo_actual,
        monto
    )

    cuenta_usuario["saldo"] = nuevo_saldo

    return {
        "estado": "APROBADO",
        "nuevo_saldo": nuevo_saldo,
        "folio": generar_folio(concepto)
    }