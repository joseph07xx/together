import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import {
  useCoupleState,
  useCreateInvite,
  useJoinCouple,
} from '../features/couples/useCouple';
import { ApiError } from '../api/client';
import { useNow } from '../hooks/useNow';

export function LinkPage() {
  const { data, isLoading } = useCoupleState();
  const createInvite = useCreateInvite();
  const joinCouple = useJoinCouple();
  const now = useNow(1000); // refrescamos cada segundo para la cuenta atrás

  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Reset "copiado" tras 2s
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  if (isLoading || !data) {
    return (
      <main className="min-h-full flex items-center justify-center">
        <div className="animate-pulse-soft text-sm text-ink-700">Cargando…</div>
      </main>
    );
  }

  if (data.status === 'linked') return null;

  async function onJoin(e: FormEvent) {
    e.preventDefault();
    setJoinError(null);
    try {
      await joinCouple.mutateAsync(joinCode.trim().toUpperCase());
    } catch (err) {
      if (err instanceof ApiError) setJoinError(err.message);
      else setJoinError('No se pudo vincular');
    }
  }

  async function onCopy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      /* silencioso */
    }
  }

  return (
    <main className="min-h-full flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-lg space-y-5 animate-fade-in">
        <header className="text-center space-y-1">
          <div className="text-3xl" aria-hidden>
            ❤️
          </div>
          <h1 className="text-2xl font-semibold text-ink-900">Vincular pareja</h1>
          <p className="text-sm text-ink-700">
            Genera un código y compártelo, o introduce el que te hayan dado.
          </p>
        </header>

        {/* ── Generar ──────────────────────────────────────── */}
        <Card>
          <h2 className="text-xs font-semibold text-ink-700 uppercase tracking-widest">
            Invitar a mi pareja
          </h2>

          {data.status === 'inviting' ? (
            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={() => onCopy(data.code)}
                className="w-full rounded-2xl bg-rose-50 px-5 py-5 text-center transition hover:bg-rose-100"
                aria-label="Copiar código"
              >
                <div className="text-[10px] uppercase tracking-widest text-rose-700/70">
                  {copied ? '¡Copiado!' : 'Toca para copiar'}
                </div>
                <div className="text-3xl font-semibold tracking-[0.3em] text-rose-700 select-all">
                  {data.code}
                </div>
              </button>
              <p className="text-xs text-center text-ink-700/70">
                {countdownText(data.expiresAt, now)}
              </p>
              <Button
                variant="ghost"
                className="w-full"
                loading={createInvite.isPending}
                onClick={() => createInvite.mutate()}
              >
                Generar uno nuevo
              </Button>
            </div>
          ) : (
            <div className="mt-4">
              <Button
                className="w-full"
                loading={createInvite.isPending}
                onClick={() => createInvite.mutate()}
              >
                Generar código
              </Button>
            </div>
          )}
        </Card>

        {/* ── Unirse ──────────────────────────────────────── */}
        <Card>
          <h2 className="text-xs font-semibold text-ink-700 uppercase tracking-widest">
            Ya tengo un código
          </h2>

          <form onSubmit={onJoin} className="mt-4 space-y-3">
            <Input
              label="Código de tu pareja"
              name="joinCode"
              placeholder="AB7K92"
              autoComplete="off"
              maxLength={6}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              error={joinError ?? undefined}
            />
            <Button
              type="submit"
              className="w-full"
              loading={joinCouple.isPending}
              disabled={joinCode.trim().length !== 6}
            >
              Vincular
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}

function countdownText(expiresAt: string, now: Date): string {
  const ms = new Date(expiresAt).getTime() - now.getTime();
  if (ms <= 0) return 'El código ha expirado';
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  if (min <= 0) return `Válido durante ${sec} s`;
  return `Válido durante ${min} min`;
}