import { useState, useRef, useEffect } from 'react';
import { useAppModeStore } from '../../store';
import type { MapTileStyleId } from '../../store/appModeStore';
import { Layers, Type } from 'lucide-react';
import { useT, type StringKey } from '@/i18n';

type BaseMapType = 'dark' | 'light' | 'white' | 'black' | 'grayscale';

/** Derive the 6-option MapTileStyleId from base type + labels toggle */
function toTileStyleId(base: BaseMapType, labels: boolean): MapTileStyleId {
  if (labels) return base;
  return `${base}-nolabels` as MapTileStyleId;
}

/** Extract base type and labels state from current MapTileStyleId */
function fromTileStyleId(id: MapTileStyleId): { base: BaseMapType; labels: boolean } {
  if (id.endsWith('-nolabels')) {
    return { base: id.replace('-nolabels', '') as BaseMapType, labels: false };
  }
  return { base: id as BaseMapType, labels: true };
}

const BASE_OPTIONS: { id: BaseMapType; labelKey: StringKey }[] = [
  { id: 'dark', labelKey: 'ctrl_style_dark' },
  { id: 'light', labelKey: 'ctrl_style_light' },
  { id: 'white', labelKey: 'ctrl_style_white' },
  { id: 'black', labelKey: 'ctrl_style_black' },
  { id: 'grayscale', labelKey: 'ctrl_style_grayscale' },
];

export function MapStyleControl() {
  const t = useT();
  const { mapTileStyle, setMapTileStyle } = useAppModeStore();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const { base, labels } = fromTileStyleId(mapTileStyle);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const handleBaseChange = (newBase: BaseMapType) => {
    setMapTileStyle(toTileStyleId(newBase, labels));
  };

  const handleLabelsToggle = () => {
    setMapTileStyle(toTileStyleId(base, !labels));
  };

  return (
    <div ref={panelRef} className="map-style-control absolute z-20">
      {/* Popover */}
      {isOpen && (
        <div className="absolute bottom-[48px] right-0 w-40 bg-dark-800 rounded-md border border-dark-600 overflow-hidden">
          {/* Base map type */}
          <div className="p-1.5 space-y-0.5">
            {BASE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleBaseChange(opt.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-left transition-colors ${
                  base === opt.id
                    ? 'bg-accent/10 text-white'
                    : 'text-dark-400 hover:bg-dark-700 hover:text-white'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  base === opt.id ? 'bg-accent' : 'bg-dark-600'
                }`} />
                <span className="text-xs font-medium">{t(opt.labelKey)}</span>
              </button>
            ))}
          </div>

          {/* Labels toggle */}
          <div className="border-t border-dark-600 px-3 py-2">
            <button
              onClick={handleLabelsToggle}
              role="switch"
              aria-checked={labels}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Type className="w-3 h-3 text-dark-400" />
                <span className="text-xs text-dark-300">{t('ctrl_style_labels')}</span>
              </div>
              <div
                className={`relative w-8 h-[18px] rounded-full transition-colors ${
                  labels ? 'bg-accent' : 'bg-dark-600'
                }`}
              >
                <div className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-transform ${
                  labels ? 'translate-x-[15px]' : 'translate-x-[2px]'
                }`} />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Trigger button — matches zoom control styling exactly */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t('ctrl_style_change_aria')}
        aria-expanded={isOpen}
        className={`w-[40px] h-[40px] flex items-center justify-center rounded-md transition-colors
          bg-dark-800 border border-dark-600
          ${isOpen ? 'text-accent' : 'text-dark-300 hover:bg-dark-700'}`}
        title={t('ctrl_style_title')}
      >
        <Layers className="w-4 h-4" />
      </button>
    </div>
  );
}
