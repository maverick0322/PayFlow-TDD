def _asegurar_numero_no_negativo(nombre, valor):
    if not isinstance(valor, (int, float)):
        raise TypeError(f"{nombre} debe ser un numero")
    if valor < 0:
        if nombre == "PMT":
            raise ValueError("PMT no puede ser negativo")
        if nombre == "Ahorro":
            raise ValueError("Ahorro no puede ser negativo")
        if nombre == "Servicios":
            raise ValueError("Servicios no puede ser negativo")
        if nombre == "Suscripciones":
            raise ValueError("Suscripciones no puede ser negativo")
        if nombre == "Ocio":
            raise ValueError("Ocio no puede ser negativo")
        raise ValueError(f"{nombre} no puede ser negativo")


def validar_presupuesto(pmt, ahorro_meta, serv_hist, susc_fijas, ocio_hist):
    """
    Retorna: (nuevo_estado, alertas_lista)
    Estados: "CONFIGURACION", "EJERCICIO", "EJERCICIO_DEFICIT"
    """
    _asegurar_numero_no_negativo("PMT", pmt)
    _asegurar_numero_no_negativo("Ahorro", ahorro_meta)
    _asegurar_numero_no_negativo("Servicios", serv_hist)
    _asegurar_numero_no_negativo("Suscripciones", susc_fijas)
    _asegurar_numero_no_negativo("Ocio", ocio_hist)

    if pmt == 0:
        raise ValueError("PMT debe ser mayor que cero")

    saldo_restante = pmt

    # Prioridad 1: Ahorro (reserva critica)
    if saldo_restante < ahorro_meta:
        return "EJERCICIO_DEFICIT", ["Deficit detectado en Ahorro"]
    saldo_restante -= ahorro_meta

    # Prioridad 2: Servicios (promedio anual por rubro)
    if saldo_restante < serv_hist:
        return "EJERCICIO_DEFICIT", ["Deficit detectado en Servicios"]
    saldo_restante -= serv_hist

    # Prioridad 3: Suscripciones (fijos digitales)
    if saldo_restante < susc_fijas:
        return "EJERCICIO_DEFICIT", ["Deficit detectado en Suscripciones"]
    saldo_restante -= susc_fijas

    # Prioridad 4: Ocio (promedio 6 meses)
    if saldo_restante < ocio_hist:
        return "EJERCICIO_DEFICIT", ["Deficit detectado en Ocio"]
    saldo_restante -= ocio_hist

    return "EJERCICIO", []
