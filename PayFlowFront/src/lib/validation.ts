/**
 * Lightweight, zero-dependency form validation utilities.
 * Returns the first failing message or null if all pass.
 * Tailored to be user-friendly and close to the financial domain language.
 */

type Rule<T> = (value: T) => string | null;

export function required(fieldName: string): Rule<string> {
  return (v) => (!v.trim() ? `Por favor ingresa tu ${fieldName.toLowerCase()}` : null);
}

export function minLength(fieldName: string, min: number): Rule<string> {
  return (v) => (v.trim().length < min ? `Tu ${fieldName.toLowerCase()} debe tener al menos ${min} caracteres` : null);
}

export function maxLength(fieldName: string, max: number): Rule<string> {
  return (v) => (v.trim().length > max ? `Tu ${fieldName.toLowerCase()} no puede tener más de ${max} caracteres` : null);
}

export function isEmail(): Rule<string> {
  return (v) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? null : 'El formato de correo electrónico no es válido (ejemplo: usuario@correo.com)';
}

export function isPositive(fieldName: string): Rule<number> {
  return (v) => (v > 0 ? null : `El monto de ${fieldName.toLowerCase()} debe ser mayor a cero`);
}

export function isNonNegative(fieldName: string): Rule<number> {
  return (v) => (v >= 0 ? null : `El monto de ${fieldName.toLowerCase()} no puede ser un valor negativo`);
}

export function maxNumber(fieldName: string, max: number): Rule<number> {
  return (v) =>
    v > max ? `El monto de ${fieldName.toLowerCase()} no puede superar los $${max.toLocaleString('es-MX')}` : null;
}

export function hasLetter(): Rule<string> {
  return (v) => (/[A-Za-z]/.test(v) ? null : 'La contraseña debe incluir al menos una letra');
}

export function hasDigit(): Rule<string> {
  return (v) => (/\d/.test(v) ? null : 'La contraseña debe incluir al menos un número');
}

export function notExceedOther(fieldName: string, otherFieldName: string, getOther: () => number): Rule<number> {
  return (v) =>
    v > getOther() ? `El monto de ${fieldName.toLowerCase()} no puede superar tu ${otherFieldName.toLowerCase()}` : null;
}

/** Run a chain of rules, return first error or null. */
export function validate<T>(value: T, ...rules: Rule<T>[]): string | null {
  for (const rule of rules) {
    const error = rule(value);
    if (error) return error;
  }
  return null;
}

/** Run multiple fields, return a map of field → first error. */
export function validateAll(
  fields: Record<string, () => string | null>
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const [key, check] of Object.entries(fields)) {
    const err = check();
    if (err) errors[key] = err;
  }
  return errors;
}

/** Returns true if there are any errors in the error map. */
export function hasErrors(errors: Record<string, string>): boolean {
  return Object.keys(errors).length > 0;
}
