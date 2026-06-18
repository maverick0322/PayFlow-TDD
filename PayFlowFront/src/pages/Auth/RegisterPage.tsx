import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import {
  validate, validateAll, hasErrors,
  required, isEmail, minLength, maxLength,
  hasLetter, hasDigit, isNonNegative, maxNumber,
} from '@/lib/validation';

interface FormState {
  nombre:        string;
  email:         string;
  password:      string;
  saldo_inicial: string;
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading, error } = useAuthStore();

  const [form,        setForm]        = useState<FormState>({ nombre: '', email: '', password: '', saldo_inicial: '' });
  const [touched,     setTouched]     = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const parsedSaldo = parseFloat(form.saldo_inicial) || 0;

  const runValidation = (current: FormState): FieldErrors => {
    const saldo = parseFloat(current.saldo_inicial) || 0;
    return validateAll({
      nombre:        () => validate(current.nombre,
        required('El nombre'), minLength('El nombre', 2), maxLength('El nombre', 80)),
      email:         () => validate(current.email,
        required('El correo'), isEmail()),
      password:      () => validate(current.password,
        required('La contraseña'), minLength('La contraseña', 8),
        hasLetter(), hasDigit()),
      saldo_inicial: () => validate(saldo,
        isNonNegative('El saldo inicial'), maxNumber('El saldo inicial', 100_000_000)),
    }) as FieldErrors;
  };

  const handleBlur = (field: keyof FormState) => {
    setTouched((t) => ({ ...t, [field]: true }));
    setFieldErrors(runValidation(form));
  };

  const handleChange = (field: keyof FormState, value: string) => {
    if (field === 'saldo_inicial' && value !== '') {
      const val = parseFloat(value);
      if (isNaN(val) || val < 0 || val > 100_000_000) return;
      const parts = value.split('.');
      if (parts[1] && parts[1].length > 2) return;
    }
    const next = { ...form, [field]: value };
    setForm(next);
    if (touched[field]) setFieldErrors(runValidation(next));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ nombre: true, email: true, password: true, saldo_inicial: true });
    const errors = runValidation(form);
    setFieldErrors(errors);
    if (hasErrors(errors)) return;

    try {
      await register({
        nombre:        form.nombre.trim(),
        email:         form.email.trim(),
        password:      form.password,
        saldo_inicial: parsedSaldo,
      });
      navigate('/', { replace: true });
    } catch {
      // Server error displayed via store.error
    }
  };

  const fieldClass = (field: keyof FormState) =>
    `auth-input${touched[field] && fieldErrors[field] ? ' auth-input-error' : ''}`;

  const FieldError = ({ field }: { field: keyof FormState }) =>
    touched[field] && fieldErrors[field]
      ? <span className="auth-field-error">{fieldErrors[field]}</span>
      : null;

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo-mark">P</span>
          <span className="auth-logo-text">PayFlow</span>
        </div>

        <div className="auth-header">
          <h1 className="auth-title">Crea tu cuenta</h1>
          <p className="auth-subtitle">Empieza a gestionar tus finanzas hoy</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {/* Nombre */}
          <div className="auth-field">
            <label htmlFor="reg-nombre" className="auth-label">Nombre completo</label>
            <input
              id="reg-nombre"
              type="text"
              autoComplete="name"
              className={fieldClass('nombre')}
              placeholder="Juan Pérez"
              value={form.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              onBlur={() => handleBlur('nombre')}
            />
            <FieldError field="nombre" />
          </div>

          {/* Email */}
          <div className="auth-field">
            <label htmlFor="reg-email" className="auth-label">Correo electrónico</label>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              className={fieldClass('email')}
              placeholder="tu@correo.com"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              onBlur={() => handleBlur('email')}
            />
            <FieldError field="email" />
          </div>

          {/* Password */}
          <div className="auth-field">
            <label htmlFor="reg-password" className="auth-label">Contraseña</label>
            <input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              className={fieldClass('password')}
              placeholder="Mín. 8 caracteres, letra y número"
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
              onBlur={() => handleBlur('password')}
            />
            <FieldError field="password" />
            {/* Password strength hint — shown only when field is not in error */}
            {!fieldErrors.password && form.password.length > 0 && (
              <PasswordStrength password={form.password} />
            )}
          </div>

          {/* Saldo inicial */}
          <div className="auth-field">
            <label htmlFor="reg-saldo" className="auth-label">
              Saldo inicial <span className="auth-label-hint">(opcional)</span>
            </label>
            <div className="auth-input-prefix-wrapper">
              <span className="auth-input-prefix">$</span>
              <input
                id="reg-saldo"
                type="number"
                min="0"
                step="100"
                className={`auth-input-with-prefix ${fieldClass('saldo_inicial')}`}
                placeholder="0.00"
                value={form.saldo_inicial}
                onChange={(e) => handleChange('saldo_inicial', e.target.value)}
                onBlur={() => handleBlur('saldo_inicial')}
              />
            </div>
            <FieldError field="saldo_inicial" />
          </div>

          {error && <div className="auth-error" role="alert">{error}</div>}

          <button id="reg-submit" type="submit" className="auth-submit" disabled={isLoading}>
            {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="auth-footer">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="auth-link">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}

/** Visual password strength indicator. */
function PasswordStrength({ password }: { password: string }) {
  const hasMin    = password.length >= 8;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNum    = /\d/.test(password);
  const strength  = [hasMin, hasLetter, hasNum].filter(Boolean).length;

  const colors = ['#ba1a1a', '#d97706', '#059669'];
  const labels = ['Débil', 'Regular', 'Segura'];

  return (
    <div className="auth-strength">
      <div className="auth-strength-bars">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="auth-strength-bar"
            style={{ background: i < strength ? colors[strength - 1] : 'var(--color-outline-variant)' }}
          />
        ))}
      </div>
      <span className="auth-strength-label" style={{ color: colors[strength - 1] ?? 'var(--color-on-surface-variant)' }}>
        {strength > 0 ? labels[strength - 1] : ''}
      </span>
    </div>
  );
}
