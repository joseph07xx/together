import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { usePrivacy, useUpdatePrivacy } from '../features/privacy/usePrivacy';

function Toggle({
  icon,
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  icon: string;
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      className={`flex items-start gap-3 py-3 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-5 w-5 rounded accent-rose-500"
      />
      <div className="flex-1">
        <div className="text-sm font-medium text-ink-900">
          <span aria-hidden className="mr-1.5">
            {icon}
          </span>
          {label}
        </div>
        {description ? (
          <div className="text-xs text-ink-700/70 mt-0.5">{description}</div>
        ) : null}
      </div>
    </label>
  );
}

export function PrivacyPage() {
  const navigate = useNavigate();
  const { data: privacy, isLoading } = usePrivacy();
  const update = useUpdatePrivacy();

  if (isLoading || !privacy) {
    return (
      <main className="min-h-full flex items-center justify-center">
        <div className="animate-pulse-soft text-sm text-ink-700">Cargando…</div>
      </main>
    );
  }

  const paused = privacy.paused;

  return (
    <main className="min-h-full flex items-start justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-lg space-y-5 animate-fade-in">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-ink-900">Privacidad</h1>
          <Button variant="ghost" onClick={() => navigate('/')}>
            Volver
          </Button>
        </header>

        <Card>
          <div
            className={`rounded-2xl px-4 py-3 mb-2 text-sm ${
              paused
                ? 'bg-amber-50 text-amber-800 border border-amber-100'
                : 'bg-ink-50 text-ink-700'
            }`}
          >
            {paused ? (
              <>
                <strong className="font-medium">⏸ Compartir está en pausa.</strong>{' '}
                Tu pareja no ve nada de ti.
              </>
            ) : (
              <>Estás compartiendo información según las opciones de abajo.</>
            )}
          </div>

          <div className="divide-y divide-ink-100">
            <Toggle
              icon="📍"
              label="Compartir ubicación"
              description="Tu pareja podrá ver dónde estás aproximadamente."
              checked={privacy.shareLocation}
              onChange={(v) => update.mutate({ shareLocation: v })}
            />
            <Toggle
              icon="💭"
              label="Compartir estado"
              description="Tu pareja verá qué estás haciendo (Estudiando, Trabajando…)."
              checked={privacy.shareStatus}
              onChange={(v) => update.mutate({ shareStatus: v })}
            />
            <Toggle
              icon="🕐"
              label="Mostrar última conexión"
              description="Tu pareja verá si estás en línea o cuándo fue la última vez."
              checked={privacy.shareLastSeen}
              onChange={(v) => update.mutate({ shareLastSeen: v })}
            />
          </div>

          <div className="mt-6 pt-6 border-t border-ink-100 space-y-2">
            <Button
              variant={paused ? 'primary' : 'ghost'}
              className="w-full"
              loading={update.isPending}
              onClick={() => update.mutate({ paused: !paused })}
            >
              {paused ? '▶ Reanudar compartir' : '⏸ Pausar compartir'}
            </Button>
            <p className="text-xs text-ink-700/70 text-center">
              Pausar no cambia tus preferencias. Al reanudar, se aplican de nuevo.
            </p>
          </div>
        </Card>
      </div>
    </main>
  );
}