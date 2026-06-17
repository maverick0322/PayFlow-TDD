LIMITE_TECNICO_PMT = 1_000_000

def _asegurar_numero_no_negativo(nombre, valor):
    if not isinstance(valor, (int, float)):
        raise TypeError(f"{nombre} debe ser un numero")
    if valor < 0:
        if nombre == "PMT":
            raise ValueError("PMT no puede ser negativo")
        if nombre == "Ahorro":
            raise ValueError("Ahorro no puede ser negativo")
        raise ValueError(f"{nombre} no puede ser negativo")


def configurar_presupuesto(pmt, ahorro_meta, pct_suscripciones, pct_servicios, pct_ocio):
    """
    Retorna: (nuevo_estado, saldos_distribuidos, alertas_lista)
    Estados: "EJERCICIO", "EJERCICIO_DEFICIT"
    """
    _asegurar_numero_no_negativo("PMT", pmt)
    _asegurar_numero_no_negativo("Ahorro", ahorro_meta)
    _asegurar_numero_no_negativo("Porcentaje Suscripciones", pct_suscripciones)
    _asegurar_numero_no_negativo("Porcentaje Servicios", pct_servicios)
    _asegurar_numero_no_negativo("Porcentaje Ocio", pct_ocio)

    if pmt == 0:
        raise ValueError("PMT debe ser mayor que cero")

    if pmt > LIMITE_TECNICO_PMT:
        raise ValueError(f"El PMT excede el limite tecnico permitido de {LIMITE_TECNICO_PMT:,}")

    if pct_suscripciones + pct_servicios + pct_ocio != 100:
        raise ValueError("La suma de porcentajes de distribucion debe ser exactamente 100")

    saldos = {}
    alertas = []

    if pmt < ahorro_meta:
        alertas.append("Deficit detectado en Ahorro")
        return "EJERCICIO_DEFICIT", saldos, alertas

    saldo_restante = pmt - ahorro_meta

    saldos["suscripciones"] = saldo_restante * (pct_suscripciones / 100.0)
    saldos["servicios"] = saldo_restante * (pct_servicios / 100.0)
    saldos["ocio"] = saldo_restante * (pct_ocio / 100.0)

    return "EJERCICIO", saldos, alertas
