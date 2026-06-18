import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import {
  validate, validateAll, hasErrors,
  required, isEmail, minLength,
} from '@/lib/validation';

interface FormState {
  email:    string;
  password: string;
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuthStore();

  const [form,       setForm]       = useState<FormState>({ email: '', password: '' });
  const [touched,    setTouched]    = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const runValidation = (current: FormState): FieldErrors =>
    validateAll({
      email:    () => validate(current.email,    required('El correo'), isEmail()),
      password: () => validate(current.password, required('La contraseña'), minLength('La contraseña', 8)),
    }) as FieldErrors;

  const handleBlur = (field: keyof FormState) => {
    setTouched((t) => ({ ...t, [field]: true }));
    setFieldErrors(runValidation(form));
  };

  const handleChange = (field: keyof FormState, value: string) => {
    const next = { ...form, [field]: value };
    setForm(next);
    if (touched[field]) setFieldErrors(runValidation(next));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Mark all fields as touched and run full validation.
    setTouched({ email: true, password: true });
    const errors = runValidation(form);
    setFieldErrors(errors);
    if (hasErrors(errors)) return;

    try {
      await login(form);
      navigate('/', { replace: true });
    } catch {
      // Server error displayed via store.error
    }
  };

  const fieldClass = (field: keyof FormState) =>
    `auth-input${touched[field] && fieldErrors[field] ? ' auth-input-error' : ''}`;

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo-mark">P</span>
          <span className="auth-logo-text">PayFlow</span>
        </div>

        <div className="auth-header">
          <h1 className="auth-title">Bienvenido de vuelta</h1>
          <p className="auth-subtitle">Ingresa a tu cuenta para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="auth-field">
            <label htmlFor="login-email" className="auth-label">Correo electrónico</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              className={fieldClass('email')}
              placeholder="tu@correo.com"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              onBlur={() => handleBlur('email')}
            />
            {touched.email && fieldErrors.email && (
              <span className="auth-field-error">{fieldErrors.email}</span>
            )}
          </div>

          <div className="auth-field">
            <label htmlFor="login-password" className="auth-label">Contraseña</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              className={fieldClass('password')}
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
              onBlur={() => handleBlur('password')}
            />
            {touched.password && fieldErrors.password && (
              <span className="auth-field-error">{fieldErrors.password}</span>
            )}
          </div>

          {/* Server-side error (wrong credentials, etc.) */}
          {error && <div className="auth-error" role="alert">{error}</div>}

          <button
            id="login-submit"
            type="submit"
            className="auth-submit"
            disabled={isLoading}
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="auth-footer">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="auth-link">Regístrate</Link>
        </p>
      </div>
    </div>
  );
}
