def registrar_gasto(categoria: str, monto: float, saldo_actual: float, max_historico: float) -> float:
    """
    Registra un gasto validando reglas de negocio.
    Retorna el nuevo saldo si es válido.
    Lanza ValueError si incumple alguna regla.
    """
    if monto <= 0:
        raise ValueError("El monto del gasto no puede ser negativo ni cero")

    if saldo_actual < monto:
        raise ValueError("Saldo insuficiente para registrar el gasto")

    limite_razonable = max_historico * 1.5
    if monto > limite_razonable:
        raise ValueError(f"El monto excede el limite razonable historico para {categoria}")

    return saldo_actual - monto
