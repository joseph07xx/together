import { useEffect, useState } from 'react';
import { STATUS_CATALOG, CUSTOM_KEY } from '@together/shared';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useSetStatus } from './useStatus';
import { ApiError } from '../../api/client';

type Props = {
  open: boolean;
  onClose: () => void;
  currentKey?: string;
};

export function StatusPicker({ open, onClose, currentKey }: Props) {
  const setStatus = useSetStatus();
  const [showCustom, setShowCustom] = useState(false);
  const [customEmoji, setCustomEmoji] = useState('✨');
  const [customLabel, setCustomLabel] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Reset estado interno al abrir
  useEffect(() => {
    if (open) {
      setError(null);
      setShowCustom(false);
    }
  }, [open]);

  if (!open) return null;

  async function pickPreset(key: string) {
    setError(null);
    try {
      await setStatus.mutateAsync({ key });
      onClose();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError('No se pudo actualizar');
    }
  }

  async function submitCustom() {
    setError(null);
    if (!customLabel.trim()) {
      setError('Escribe un texto');
      return;
    }
    try {
      await setStatus.mutateAsync({
        key: CUSTOM_KEY,
        emoji: customEmoji.trim() || '✨',
        label: customLabel.trim(),
      });
      onClose();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError('No se pudo actualizar');
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink-900/40 px-3 py-3 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Elegir estado"
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white shadow-xl p-5 space-y-4 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink-900">
            ¿Qué estás haciendo?
          </h2>
          <button
            onClick={onClose}
            className="h-9 w-9 -mr-2 flex items-center justify-center rounded-full text-ink-700/60 hover:text-ink-900 hover:bg-ink-50 text-xl leading-none"
            aria-label="Cerrar"
          >
            ×
          </button>
        </header>

        {!showCustom ? (
          <>
            <div className="grid grid-cols-2 gap-2 max-h-[55vh] overflow-y-auto pr-1">
              {STATUS_CATALOG.map((s) => {
                const active = s.key === currentKey;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => pickPreset(s.key)}
                    disabled={setStatus.isPending}
                    className={`flex items-center gap-2 rounded-2xl border px-3 py-3 text-left text-sm transition ${
                      active
                        ? 'border-rose-300 bg-rose-50 text-rose-800 ring-1 ring-rose-200'
                        : 'border-ink-100 bg-white hover:bg-ink-50 text-ink-900'
                    } disabled:opacity-60`}
                  >
                    <span className="text-lg" aria-hidden>
                      {s.emoji}
                    </span>
                    <span className="truncate">{s.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setShowCustom(true)}
              className="w-full text-sm text-rose-600 hover:text-rose-700 py-2"
            >
              Escribir un estado personalizado →
            </button>
          </>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="w-20">
                <Input
                  label="Emoji"
                  name="customEmoji"
                  maxLength={4}
                  value={customEmoji}
                  onChange={(e) => setCustomEmoji(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Input
                  label="¿Qué estás haciendo?"
                  name="customLabel"
                  maxLength={60}
                  placeholder="Café con la abuela"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setShowCustom(false)}
              >
                Atrás
              </Button>
              <Button
                className="flex-1"
                onClick={submitCustom}
                loading={setStatus.isPending}
              >
                Guardar
              </Button>
            </div>
          </div>
        )}

        {error ? (
          <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </div>
    </div>
  );
}