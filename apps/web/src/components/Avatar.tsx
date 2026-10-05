type Props = {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  ring?: boolean;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
}

export function Avatar({ name, size = 'md', ring = false }: Props) {
  const dim =
    size === 'sm'
      ? 'h-8 w-8 text-xs'
      : size === 'lg'
        ? 'h-16 w-16 text-xl'
        : 'h-12 w-12 text-sm';

  return (
    <div
      className={`${dim} flex items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-rose-200 text-rose-700 font-semibold select-none ${
        ring ? 'ring-2 ring-white shadow-card' : ''
      }`}
      aria-label={name}
    >
      {initials(name)}
    </div>
  );
}