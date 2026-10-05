import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { LastUpdatedLine } from '../components/LastUpdatedLine';
import { LocationLine } from '../components/LocationLine';
import { PresencePill } from '../components/PresencePill';
import { StatusPill } from '../components/StatusPill';
import { useAuthStore } from '../stores/auth.store';
import { useCoupleState, useUnlinkCouple } from '../features/couples/useCouple';
import { useMyStatus, usePartnerStatus } from '../features/status/useStatus';
import {
  usePartnerLocation,
  usePartnerPresence,
} from '../features/location/useLocation';
import { StatusPicker } from '../features/status/StatusPicker';
import { LocationWatcher } from '../features/location/LocationWatcher';

export function HomePage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const { data: couple, isLoading: loadingCouple } = useCoupleState();
  const unlink = useUnlinkCouple();

  const { data: myStatus } = useMyStatus();
  const { data: partnerStatus } = usePartnerStatus();
  const { data: partnerLocation } = usePartnerLocation();
  const { data: partnerPresence } = usePartnerPresence();

  const [pickerOpen, setPickerOpen] = useState(false);

  if (!user) return null;

  if (loadingCouple || !couple) {
    return (
      <main className="min-h-full flex items-center justify-center">
        <div className="animate-pulse-soft text-sm text-ink-700">Cargando…</div>
      </main>
    );
  }

  if (couple.status !== 'linked') {
    navigate('/link', { replace: true });
    return null;
  }

  return (
    <main className="min-h-full flex items-center justify-center px-4 py-8 sm:py-12">
      <LocationWatcher />

      <div className="w-full max-w-2xl space-y-5 animate-fade-in">
        {/* ── Encabezado ─────────────────────────────────────── */}
        <header className="text-center space-y-1">
          <div className="text-3xl" aria-hidden>
            ❤️
          </div>
          <h1 className="text-2xl font-semibold text-ink-900">Nosotros</h1>
          <p className="text-sm text-ink-700">
            Tú y {couple.partner.displayName}
          </p>
        </header>

        {/* ── Tarjetas ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Tú */}
          <Card className="flex flex-col items-center text-center gap-3">
            <span className="text-[10px] uppercase tracking-widest text-ink-700/60">
              Tú
            </span>
            <Avatar name={user.displayName} size="lg" ring />
            <div className="font-medium text-ink-900">{user.displayName}</div>

            {myStatus ? (
              <StatusPill
                emoji={myStatus.emoji}
                label={myStatus.label}
                startedAt={myStatus.startedAt}
              />
            ) : (
              <EmptyState
                icon="💭"
                title="Aún sin estado"
                hint="Elige qué estás haciendo"
              />
            )}

            <Button
              variant="ghost"
              className="w-full mt-1"
              onClick={() => setPickerOpen(true)}
            >
              {myStatus ? 'Cambiar estado' : 'Elegir estado'}
            </Button>
          </Card>

          {/* Pareja */}
          <Card className="flex flex-col items-center text-center gap-3">
            <span className="text-[10px] uppercase tracking-widest text-ink-700/60">
              Tu pareja
            </span>
            <Avatar name={couple.partner.displayName} size="lg" ring />
            <div className="font-medium text-ink-900">
              {couple.partner.displayName}
            </div>

            {/* Presencia */}
            {partnerPresence?.shared ? (
              <PresencePill
                online={partnerPresence.online}
                lastSeenAt={partnerPresence.lastSeenAt}
              />
            ) : partnerPresence && !partnerPresence.shared ? (
              <span className="text-xs text-ink-700/60">
                {partnerPresence.reason === 'paused'
                  ? 'Ha pausado compartir información'
                  : 'No comparte su última conexión'}
              </span>
            ) : null}

            {/* Estado */}
            {partnerStatus?.shared ? (
              <StatusPill
                emoji={partnerStatus.status.emoji}
                label={partnerStatus.status.label}
                startedAt={partnerStatus.status.startedAt}
              />
            ) : partnerStatus && !partnerStatus.shared ? (
              <EmptyState
                icon="💭"
                title={partnerStatusTitle(partnerStatus.reason)}
                hint={partnerStatusHint(partnerStatus.reason)}
              />
            ) : (
              <EmptyState icon="💭" title="Cargando estado…" />
            )}

            {/* Ubicación */}
            {partnerLocation?.shared ? (
              <LocationLine
                placeLabel={partnerLocation.location.placeLabel}
                latitude={partnerLocation.location.latitude}
                longitude={partnerLocation.location.longitude}
                updatedAt={partnerLocation.location.updatedAt}
              />
            ) : partnerLocation && !partnerLocation.shared ? (
              <span className="text-xs text-ink-700/60">
                {partnerLocation.reason === 'partner_hidden'
                  ? 'No comparte su ubicación'
                  : partnerLocation.reason === 'paused'
                    ? 'Ha pausado compartir información'
                    : partnerLocation.reason === 'no_location'
                      ? 'Aún no hay ubicación'
                      : ''}
              </span>
            ) : null}
          </Card>
        </div>

        {/* ── Última actualización ──────────────────────────── */}
        <LastUpdatedLine
          timestamps={[
            myStatus?.updatedAt,
            partnerStatus?.shared ? partnerStatus.status.updatedAt : null,
            partnerLocation?.shared ? partnerLocation.location.updatedAt : null,
            partnerPresence?.shared ? partnerPresence.lastSeenAt : null,
          ]}
        />

        {/* ── Acciones ──────────────────────────────────────── */}
        <Card className="grid grid-cols-2 gap-2">
          <Button variant="ghost" onClick={() => navigate('/settings')}>
            ⚙️ Configuración
          </Button>
          <Button variant="ghost" onClick={() => navigate('/privacy')}>
            🔒 Privacidad
          </Button>
          <Button
            variant="ghost"
            className="col-span-2 text-rose-600 hover:bg-rose-50"
            onClick={async () => {
              if (!confirm('¿Seguro que quieres desvincular a tu pareja?')) return;
              await unlink.mutateAsync();
            }}
            loading={unlink.isPending}
          >
            Desvincular
          </Button>
        </Card>
      </div>

      <StatusPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        currentKey={myStatus?.key}
      />
    </main>
  );
}

function partnerStatusTitle(reason: string): string {
  switch (reason) {
    case 'partner_hidden':
      return 'No comparte su estado';
    case 'paused':
      return 'Compartir en pausa';
    case 'no_status':
      return 'Aún sin estado';
    case 'no_couple':
      return 'Sin pareja';
    default:
      return 'Sin estado';
  }
}

function partnerStatusHint(reason: string): string | undefined {
  switch (reason) {
    case 'paused':
      return 'No verás su información hasta que reanude';
    case 'partner_hidden':
      return 'Puede activarlo desde su privacidad';
    case 'no_status':
      return 'Cuando elija uno, aparecerá aquí';
    default:
      return undefined;
  }
}