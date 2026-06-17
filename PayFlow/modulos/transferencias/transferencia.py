ESTADO_PENDIENTE = "PENDIENTE"
ESTADO_APROBADA = "APROBADA"
ESTADO_RECHAZADA = "RECHAZADA_POR_POLITICA"


def crear_resultado(estado_inicial, estado_final):

    return {
        "estado_inicial": estado_inicial,
        "estado_final": estado_final
    }


def aprobar(estado_inicial):

    return crear_resultado(
        estado_inicial,
        ESTADO_APROBADA
    )


def rechazar(estado_inicial):

    return crear_resultado(
        estado_inicial,
        ESTADO_RECHAZADA
    )


def validar_credito(hora):

    return 9 <= hora <= 18


def validar_debito(monto, token):

    if monto <= 5000:
        return True

    return token


def validar_transferencia(tipo_cuenta, hora, monto, token):

    estado_inicial = ESTADO_PENDIENTE

    if tipo_cuenta == "Misma":

        return aprobar(estado_inicial)

    if tipo_cuenta == "Crédito":

        if validar_credito(hora):

            return aprobar(estado_inicial)

        return rechazar(estado_inicial)

    if tipo_cuenta == "Débito":

        if validar_debito(monto, token):

            return aprobar(estado_inicial)

        return rechazar(estado_inicial)