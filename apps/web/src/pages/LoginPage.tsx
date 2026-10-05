import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { useAuthStore } from '../stores/auth.store';
import { ApiError } from '../api/client';

export function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ email, password });
      const from = (location.state as { from?: string } | null)?.from ?? '/';
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError('No se pudo iniciar sesión');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-full flex flex-col items-center justify-center px-4 py-10">
     <Card className="w-full max-w-md animate-fade-in">
        <div className="mb-6 text-center space-y-1">
          <div className="text-4xl">❤️</div>
          <h1 className="text-2xl font-semibold text-ink-900">Together</h1>
          <p className="text-sm text-ink-700">Un espacio solo para ustedes dos</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
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
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error ? (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          ) : null}

          <Button type="submit" loading={submitting} className="w-full">
            Iniciar sesión
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-700">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="font-medium text-rose-600 hover:text-rose-700">
            Crear una
          </Link>
        </p>
      </Card>
    </main>
  );
}