import { RotateCcw } from 'lucide-react';

// Used in error / 404 / load-failure fallbacks as a "return to the map" action.
// (Originally linked to DeFlock's legacy map, which doesn't exist for this site.)
const RELOAD_URL = '/';
const RELOAD_LABEL = 'Reload map';

interface LegacyMapLinkProps {
  variant: 'header' | 'button' | 'menu-item';
  className?: string;
}

export function LegacyMapLink({ variant, className = '' }: LegacyMapLinkProps) {
  if (variant === 'header') {
    return (
      <a
        href={RELOAD_URL}
        className={`text-sm text-dark-400 hover:text-dark-200 transition-colors ${className}`}
      >
        {RELOAD_LABEL}
      </a>
    );
  }

  if (variant === 'menu-item') {
    return (
      <a
        href={RELOAD_URL}
        className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-dark-400 hover:text-dark-200 transition-colors ${className}`}
      >
        <RotateCcw className="w-4 h-4" aria-hidden="true" />
        <span>{RELOAD_LABEL}</span>
      </a>
    );
  }

  // variant === 'button'
  return (
    <a
      href={RELOAD_URL}
      className={`flex-1 inline-flex items-center justify-center gap-2 py-3 bg-dark-700 hover:bg-dark-600 text-white font-medium rounded-md transition-colors ${className}`}
    >
      <RotateCcw className="w-4 h-4" aria-hidden="true" />
      {RELOAD_LABEL}
    </a>
  );
}
