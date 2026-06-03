"""
Módulo de inversiones PayFlow.

Este archivo concentra las tres capas usadas en la práctica de Sandwich Testing:

1. Capa inferior:
   - cálculo de tasas
   - cálculo de interés compuesto
   - validaciones matemáticas

2. Capa superior:
   - estado inicial
   - reglas de perfil por antigüedad
   - clasificación de inversión estable o riesgosa

3. Capa media:
   - autorización
   - integración entre cálculo y estado
   - generación de folio

El diseño permite probar cada rebanada por separado usando mocks para las capas ajenas.
"""

from dataclasses import dataclass
from typing import Optional


# =========================
# Constantes de perfil
# =========================

BAJO_RIESGO = "BAJO"
ALTO_RIESGO = "ALTO"

TASAS_ANUALES = {
    BAJO_RIESGO: 0.05,
    ALTO_RIESGO: 0.12,
}


# =========================
# Constantes de estado
# =========================

DISPONIBLE = "DISPONIBLE"
EN_EVALUACION = "EN_EVALUACION"
RECHAZADA = "RECHAZADA"
INVERSION_ESTABLE = "INVERSION_ESTABLE"
INVERSION_RIESGOSA = "INVERSION_RIESGOSA"


@dataclass
class ResultadoInversion:
    """Objeto de salida solicitado por la capa media."""
    monto_final: Optional[float]
    nuevo_estado: str
    folio_aprobacion: Optional[str]


# ============================================================
# Capa inferior: lógica matemática
# ============================================================

def obtener_tasa_anual(perfil: str) -> float:
    """Devuelve la tasa anual asociada al perfil de riesgo."""
    if perfil not in TASAS_ANUALES:
        raise ValueError("Perfil de riesgo no válido")

    return TASAS_ANUALES[perfil]


def validar_datos_calculo(capital: float, plazo_meses: int) -> None:
    """Valida que el capital y el plazo cumplan las reglas matemáticas."""
    if capital < 0:
        raise ValueError("El capital no puede ser negativo")

    if plazo_meses < 12:
        raise ValueError("El plazo mínimo es de 12 meses")


def calcular_monto_final(capital: float, perfil: str, plazo_meses: int) -> float:
    """
    Calcula el monto final usando interés compuesto.

    Decisión técnica documentada:
    - La tasa proporcionada es anual.
    - El plazo recibido está en meses.
    - Por eso se convierte el plazo de meses a años.
    """
    validar_datos_calculo(capital, plazo_meses)

    tasa_anual = obtener_tasa_anual(perfil)
    anios = plazo_meses / 12

    return capital * ((1 + tasa_anual) ** anios)


# ============================================================
# Capa superior: gestión de estados y reglas de perfil
# ============================================================

def obtener_estado_inicial() -> str:
    """Devuelve el estado inicial del módulo de inversión."""
    return DISPONIBLE


def es_cuenta_nueva(antiguedad_meses: int) -> bool:
    """Determina si la cuenta tiene menos de 3 meses."""
    return antiguedad_meses < 3


def perfil_es_compatible(perfil: str, antiguedad_meses: int) -> bool:
    """
    Valida si el perfil de inversión es compatible con la antigüedad.

    Una cuenta nueva no puede seleccionar alto riesgo.
    """
    if es_cuenta_nueva(antiguedad_meses) and perfil == ALTO_RIESGO:
        return False

    return True


def definir_estado_inversion(capital: float, saldo: float) -> str:
    """
    Define si la inversión autorizada es estable o riesgosa.

    Si invierte más del 50% del saldo, es riesgosa.
    Si invierte 50% o menos, es estable.
    """
    if capital > saldo * 0.5:
        return INVERSION_RIESGOSA

    return INVERSION_ESTABLE


# ============================================================
# Capa media: autorización e integración
# ============================================================

def saldo_es_suficiente(capital: float, saldo: float) -> bool:
    """Valida si el saldo alcanza para cubrir el capital solicitado."""
    return saldo >= capital


def generar_folio(perfil: str, estado: str, monto_final: float) -> str:
    """
    Genera el folio de aprobación.

    Formato:
    <PERFIL>-<ESTADO>-<MONTO_FINAL_REDONDEADO>

    Ejemplo:
    B-E-1251
    """
    codigo_perfil = {
        BAJO_RIESGO: "B",
        ALTO_RIESGO: "A",
    }[perfil]

    codigo_estado = {
        INVERSION_ESTABLE: "E",
        INVERSION_RIESGOSA: "R",
    }[estado]

    monto_redondeado = round(monto_final)

    return f"{codigo_perfil}-{codigo_estado}-{monto_redondeado}"


def rechazar_inversion() -> ResultadoInversion:
    """Regresa el resultado estándar para una inversión rechazada."""
    return ResultadoInversion(
        monto_final=None,
        nuevo_estado=RECHAZADA,
        folio_aprobacion=None,
    )


def autorizar_inversion(
    capital: float,
    saldo: float,
    perfil: str,
    antiguedad_meses: int,
    plazo_meses: int,
) -> ResultadoInversion:
    """
    Autoriza o rechaza una inversión.

    Esta función representa la rebanada central del método Sandwich:
    - recibe datos desde la capa superior,
    - llama a la capa inferior para calcular,
    - llama a la capa superior para determinar el estado,
    - empaqueta el resultado final.
    """
    try:
        validar_datos_calculo(capital, plazo_meses)
    except ValueError:
        return rechazar_inversion()

    if not saldo_es_suficiente(capital, saldo):
        return rechazar_inversion()

    if not perfil_es_compatible(perfil, antiguedad_meses):
        return rechazar_inversion()

    monto_final = calcular_monto_final(capital, perfil, plazo_meses)
    nuevo_estado = definir_estado_inversion(capital, saldo)
    folio_aprobacion = generar_folio(perfil, nuevo_estado, monto_final)

    return ResultadoInversion(
        monto_final=monto_final,
        nuevo_estado=nuevo_estado,
        folio_aprobacion=folio_aprobacion,
    )
