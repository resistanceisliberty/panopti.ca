import { useCameraStore, useAppModeStore } from '../../store';
import type { ColorSchemeId } from '../../store/appModeStore';
import { COLOR_SCHEMES } from './colorSchemes';

function SliderControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
  formatValue,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  formatValue?: (v: number) => string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-dark-300">{label}</span>
        <span className="text-xs tabular-nums text-dark-400">
          {formatValue ? formatValue(value) : value.toFixed(1)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-dark-700 rounded-full appearance-none cursor-pointer accent-[#0080BC] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-sm"
      />
    </div>
  );
}

const SCHEME_IDS: ColorSchemeId[] = ['neon', 'thermal', 'inferno', 'classic', 'plasma', 'viridis'];

function SchemeGrid({ value, onChange }: { value: ColorSchemeId; onChange: (id: ColorSchemeId) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {SCHEME_IDS.map((id) => {
        const scheme = COLOR_SCHEMES[id];
        const isActive = value === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${
              isActive
                ? 'bg-dark-700 border-dark-600'
                : 'bg-dark-800 border-dark-600 hover:border-dark-500'
            }`}
          >
            <div
              className="w-8 h-3 rounded-full flex-shrink-0"
              style={{ background: scheme.gradient }}
            />
            <span className={`text-xs font-medium ${isActive ? 'text-white' : 'text-dark-300'}`}>
              {scheme.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function HeatmapControls() {
  const { cameras } = useCameraStore();
  const { heatmapSettings, updateHeatmapSettings } = useAppModeStore();

  return (
    <div className="space-y-6">
      {/* Color Scheme */}
      <div className="space-y-4">
        <span className="block text-xs font-medium text-dark-400 uppercase tracking-wider">
          Color Scheme
        </span>
        <div>
          <span className="block text-xs font-medium text-dark-300 mb-2">ALPRs</span>
          <SchemeGrid
            value={heatmapSettings.colorScheme}
            onChange={(id) => updateHeatmapSettings({ colorScheme: id })}
          />
        </div>
        <div>
          <span className="block text-xs font-medium text-dark-300 mb-2">Government CCTVs</span>
          <SchemeGrid
            value={heatmapSettings.cctvColorScheme}
            onChange={(id) => updateHeatmapSettings({ cctvColorScheme: id })}
          />
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-5">
        <SliderControl
          label="Intensity"
          value={heatmapSettings.intensity}
          min={0.1}
          max={3.0}
          step={0.1}
          onChange={(v) => updateHeatmapSettings({ intensity: v })}
        />
        <SliderControl
          label="Radius"
          value={heatmapSettings.radius}
          min={1}
          max={80}
          step={1}
          onChange={(v) => updateHeatmapSettings({ radius: v })}
          formatValue={(v) => `${v}px`}
        />
        <SliderControl
          label="Opacity"
          value={heatmapSettings.opacity}
          min={0.1}
          max={1.0}
          step={0.05}
          onChange={(v) => updateHeatmapSettings({ opacity: v })}
          formatValue={(v) => `${Math.round(v * 100)}%`}
        />
      </div>

      {/* About */}
      <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700/50">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-accent" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-dark-300 font-medium mb-1">About Heatmap</p>
            <p className="text-xs text-dark-400 leading-relaxed">
              Visualizes the density of {cameras.length.toLocaleString()} ALPR cameras across Canada.
              Brighter areas indicate higher camera concentration. At higher zoom levels,
              the heatmap fades to reveal individual camera markers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
