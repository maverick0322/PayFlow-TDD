import re
from datetime import date as Date
from pydantic import BaseModel, EmailStr, field_validator, model_validator
from typing import Optional

# ── Auth ──────────────────────────────────────────────────────────────────────

_PASSWORD_MIN = 8
_PASSWORD_MAX = 128
_NOMBRE_MAX   = 80

class RegisterRequest(BaseModel):
    email: EmailStr
    nombre: str
    password: str
    saldo_inicial: float = 0.0

    @field_validator('nombre')
    @classmethod
    def nombre_valido(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("El nombre es requerido")
        if len(v) < 2:
            raise ValueError("El nombre debe tener al menos 2 caracteres")
        if len(v) > _NOMBRE_MAX:
            raise ValueError(f"El nombre no puede exceder {_NOMBRE_MAX} caracteres")
        return v

    @field_validator('password')
    @classmethod
    def password_valido(cls, v: str) -> str:
        if len(v) < _PASSWORD_MIN:
            raise ValueError(f"La contraseña debe tener al menos {_PASSWORD_MIN} caracteres")
        if len(v) > _PASSWORD_MAX:
            raise ValueError(f"La contraseña no puede exceder {_PASSWORD_MAX} caracteres")
        if not re.search(r'[A-Za-z]', v):
            raise ValueError("La contraseña debe contener al menos una letra")
        if not re.search(r'\d', v):
            raise ValueError("La contraseña debe contener al menos un número")
        return v

    @field_validator('saldo_inicial')
    @classmethod
    def saldo_no_negativo(cls, v: float) -> float:
        if v < 0:
            raise ValueError("El saldo inicial no puede ser negativo")
        if v > 100_000_000:
            raise ValueError("El saldo inicial excede el límite permitido")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator('password')
    @classmethod
    def password_no_vacio(cls, v: str) -> str:
        if not v:
            raise ValueError("La contraseña es requerida")
        return v


class UserInfo(BaseModel):
    id: int
    email: str
    nombre: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserInfo


# ── Fondos / Presupuesto ──────────────────────────────────────────────────────

_PMT_MAX = 1_000_000   # mirrors LIMITE_TECNICO_PMT in presupuesto.py

class FundsConfigRequest(BaseModel):
    monthlyBudget:       float
    savingsAmount:       float
    servicesAmount:      float
    subscriptionsAmount: float
    leisureAmount:       float

    @field_validator('monthlyBudget', 'savingsAmount', 'servicesAmount',
                     'subscriptionsAmount', 'leisureAmount')
    @classmethod
    def non_negative(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Los montos no pueden ser negativos")
        return round(v, 2)

    @model_validator(mode='after')
    def pmt_reglas(self) -> 'FundsConfigRequest':
        if self.monthlyBudget == 0:
            raise ValueError("El presupuesto mensual debe ser mayor que cero")
        if self.monthlyBudget > _PMT_MAX:
            raise ValueError(f"El presupuesto mensual no puede superar los ${_PMT_MAX:,}")
        if self.savingsAmount > self.monthlyBudget:
            raise ValueError("El monto de ahorro no puede superar el presupuesto mensual")
        return self


class FundsConfigResponse(BaseModel):
    monthlyBudget:       float
    savingsAmount:       float
    servicesAmount:      float
    subscriptionsAmount: float
    leisureAmount:       float


# ── Suscripciones ─────────────────────────────────────────────────────────────

_VALID_CYCLES     = {"monthly", "annual", "quarterly"}
_VALID_CATEGORIES = {"digital", "services"}
_NAME_MAX         = 80
_AMOUNT_MAX       = 1_000_000

class SubscriptionResponse(BaseModel):
    id:          str
    name:        str
    icon:        str
    iconColor:   str
    billingDate: Optional[str]
    amount:      float
    status:      str
    billingCycle: str
    category:    str


class CreateSubscriptionRequest(BaseModel):
    name:        str
    amount:      float
    billingDate: str
    billingCycle: str
    category:    str

    @field_validator('name')
    @classmethod
    def name_valido(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("El nombre del servicio es requerido")
        if len(v) > _NAME_MAX:
            raise ValueError(f"El nombre no puede exceder {_NAME_MAX} caracteres")
        return v

    @field_validator('amount')
    @classmethod
    def amount_valido(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("El monto debe ser mayor a cero")
        if v > _AMOUNT_MAX:
            raise ValueError(f"El monto excede el límite permitido de ${_AMOUNT_MAX:,}")
        return round(v, 2)

    @field_validator('billingDate')
    @classmethod
    def fecha_valida(cls, v: str) -> str:
        try:
            Date.fromisoformat(v)
        except ValueError:
            raise ValueError("La fecha de cobro debe estar en formato YYYY-MM-DD")
        return v

    @field_validator('billingCycle')
    @classmethod
    def cycle_valido(cls, v: str) -> str:
        if v not in _VALID_CYCLES:
            raise ValueError(f"Frecuencia inválida. Opciones: {', '.join(_VALID_CYCLES)}")
        return v

    @field_validator('category')
    @classmethod
    def category_valida(cls, v: str) -> str:
        if v not in _VALID_CATEGORIES:
            raise ValueError(f"Categoría inválida. Opciones: {', '.join(_VALID_CATEGORIES)}")
        return v


class ConfirmPaymentRequest(BaseModel):
    currentBalance: float
    esVip:          bool = False
    tarjetaVencida: bool = False

    @field_validator('currentBalance')
    @classmethod
    def balance_valido(cls, v: float) -> float:
        if v < 0:
            raise ValueError("El saldo no puede ser negativo")
        return v


class ConfirmPaymentResponse(BaseModel):
    result:     str
    newStatus:  str
    newBalance: float


# ── Dashboard ─────────────────────────────────────────────────────────────────

class ExpenseCardSchema(BaseModel):
    id:    str
    label: str
    amount: float
    icon:  str


class DashboardSummaryResponse(BaseModel):
    availableBalance:     float
    totalBudget:          float
    monthlyChangePercent: float
    systemStatus:         str
    budgetState:          str
    deficitAlerts:        list[str]
    expenseCards:         list[ExpenseCardSchema]


# ── Reportes ──────────────────────────────────────────────────────────────────

class ReportCategorySchema(BaseModel):
    name:     str
    budgeted: float
    actual:   float
    deviation: float


class VariabilityReportResponse(BaseModel):
    period:             str
    totalDeviation:     float
    deviationDirection: str
    categories:         list[ReportCategorySchema]


# ── Gastos / Transacciones ────────────────────────────────────────────────────

_VALID_TRANSACTION_CATEGORIES = {"hogar", "ocio"}
_DESCRIPTION_MAX = 200

class CreateTransactionRequest(BaseModel):
    amount:        float
    category:      str
    date:          str
    description:   Optional[str] = None
    confirmaRiesgo: bool = False

    @field_validator('amount')
    @classmethod
    def amount_valido(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("El monto debe ser mayor a cero")
        if v > _AMOUNT_MAX:
            raise ValueError(f"El monto excede el límite permitido de ${_AMOUNT_MAX:,}")
        return round(v, 2)

    @field_validator('category')
    @classmethod
    def category_valida(cls, v: str) -> str:
        if v not in _VALID_TRANSACTION_CATEGORIES:
            raise ValueError(f"Categoría inválida. Opciones: {', '.join(_VALID_TRANSACTION_CATEGORIES)}")
        return v

    @field_validator('date')
    @classmethod
    def fecha_valida(cls, v: str) -> str:
        try:
            Date.fromisoformat(v)
        except ValueError:
            raise ValueError("La fecha debe estar en formato YYYY-MM-DD")
        return v

    @field_validator('description')
    @classmethod
    def description_valida(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v) > _DESCRIPTION_MAX:
            raise ValueError(f"La descripción no puede exceder {_DESCRIPTION_MAX} caracteres")
        return v


class CreateTransactionResponse(BaseModel):
    id:          int
    amount:      float
    category:    str
    date:        str
    description: Optional[str]
    ok:          bool
    mensaje:     str
    newBalance:  float
