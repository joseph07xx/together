import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useAuthStore } from '../stores/auth.store';

export function SettingsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [loggingOut, setLoggingOut] = useState(false);

  if (!user) return null;

  async function onLogout() {
    setLoggingOut(true);
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <main className="min-h-full flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-lg space-y-5 animate-fade-in">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-ink-900">Configuración</h1>
          <Button variant="ghost" onClick={() => navigate('/')}>
            Volver
          </Button>
        </header>

        <Card className="flex items-center gap-4">
          <Avatar name={user.displayName} size="lg" />
          <div className="flex-1">
            <div className="font-medium text-ink-900">{user.displayName}</div>
            <div className="text-sm text-ink-700/70">{user.email}</div>
          </div>
        </Card>

        <Card className="space-y-2">
          <Button variant="ghost" className="w-full" onClick={() => navigate('/privacy')}>
            Privacidad
          </Button>
          <Button variant="ghost" className="w-full" onClick={onLogout} loading={loggingOut}>
            Cerrar sesión
          </Button>
        </Card>
      </div>
    </main>
  );
}