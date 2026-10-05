import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { useAuthStore } from '../stores/auth.store';
import { ApiError } from '../api/client';

export function RegisterPage() {
  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({ email, password, displayName });
      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        // Mensaje más claro para validaciones Zod
        if (err.code === 'VALIDATION_ERROR' && err.details) {
          const details = err.details as Record<string, string[]>;
          const first = Object.values(details)[0]?.[0];
          setError(first ?? err.message);
        } else {
          setError(err.message);
        }
      } else {
        setError('No se pudo crear la cuenta');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-full flex flex-col items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md animate-fade-in">
        <div className="mb-6 text-center space-y-1">
          <div className="text-4xl">❤️</div>
          <h1 className="text-2xl font-semibold text-ink-900">Crear cuenta</h1>
          <p className="text-sm text-ink-700">Empieza a compartir con tu pareja</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Nombre"
            name="displayName"
            autoComplete="name"
            required
            maxLength={40}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <Input
            label="Correo electrónico"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Contraseña"
            type="password"
            name="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error ? (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          ) : null}

          <Button type="submit" loading={submitting} className="w-full">
            Crear cuenta
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-700">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-medium text-rose-600 hover:text-rose-700">
            Inicia sesión
          </Link>
        </p>
      </Card>
    </main>
  );
}