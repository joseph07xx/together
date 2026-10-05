export type StatusKey =
  | 'available'
  | 'studying'
  | 'working'
  | 'gaming'
  | 'eating'
  | 'sleeping'
  | 'moving'
  | 'watching'
  | 'thinking_of_you'
  | 'do_not_disturb'
  | 'custom';

export type StatusDefinition = {
  key: Exclude<StatusKey, 'custom'>;
  emoji: string;
  label: string;
};

export const STATUS_CATALOG: readonly StatusDefinition[] = [
  { key: 'available', emoji: '🟢', label: 'Disponible' },
  { key: 'studying', emoji: '📚', label: 'Estudiando' },
  { key: 'working', emoji: '💻', label: 'Trabajando' },
  { key: 'gaming', emoji: '🎮', label: 'Jugando' },
  { key: 'eating', emoji: '🍽️', label: 'Comiendo' },
  { key: 'sleeping', emoji: '😴', label: 'Durmiendo' },
  { key: 'moving', emoji: '🚗', label: 'En movimiento' },
  { key: 'watching', emoji: '🎬', label: 'Viendo algo' },
  { key: 'thinking_of_you', emoji: '❤️', label: 'Pensando en ti' },
  { key: 'do_not_disturb', emoji: '📴', label: 'No molestar' },
] as const;

export const CUSTOM_KEY = 'custom' as const;

export function findStatusByKey(key: string): StatusDefinition | undefined {
  return STATUS_CATALOG.find((s) => s.key === key);
}