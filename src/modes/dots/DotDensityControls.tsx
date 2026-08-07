import { useAppModeStore } from '../../store';
import { useT, type StringKey } from '../../i18n';

const DOT_COLORS: { id: string; nameKey: StringKey; preview: string }[] = [
  { id: '#4DA6FF', nameKey: 'tl_dot_blue', preview: '#4DA6FF' },
  { id: '#f97316', nameKey: 'tl_dot_orange', preview: '#f97316' },
  { id: '#eab308', nameKey: 'tl_dot_yellow', preview: '#eab308' },
  { id: '#22c55e', nameKey: 'tl_dot_green', preview: '#22c55e' },
  { id: '#06b6d4', nameKey: 'tl_dot_cyan', preview: '#06b6d4' },
  { id: '#ffffff', nameKey: 'tl_dot_white', preview: '#ffffff' },
];

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

export function DotDensityControls() {
  const t = useT();
  const { dotDensitySettings, updateDotDensitySettings } = useAppModeStore();

  return (
    <div className="space-y-6">
      {/* Dot Color */}
      <div>
        <span className="block text-xs font-medium text-dark-400 uppercase tracking-wider mb-3">
          {t('tl_dot_color_label')}
        </span>
        <div className="grid grid-cols-3 gap-2">
          {DOT_COLORS.map((c) => {
            const isActive = dotDensitySettings.color === c.id;
            return (
              <button
                key={c.id}
                onClick={() => updateDotDensitySettings({ color: c.id })}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-dark-700 border-dark-600'
                    : 'bg-dark-800 border-dark-600 hover:border-dark-500'
                }`}
              >
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0 border border-dark-500"
                  style={{ backgroundColor: c.preview }}
                />
                <span className={`text-xs font-medium ${isActive ? 'text-white' : 'text-dark-300'}`}>
                  {t(c.nameKey)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-5">
        <SliderControl
          label={t('tl_dot_size_label')}
          value={dotDensitySettings.radius}
          min={1}
          max={6}
          step={0.5}
          onChange={(v) => updateDotDensitySettings({ radius: v })}
          formatValue={(v) => `${v}px`}
        />
        <SliderControl
          label={t('tl_dot_opacity_label')}
          value={dotDensitySettings.opacity}
          min={0.05}
          max={0.5}
          step={0.01}
          onChange={(v) => updateDotDensitySettings({ opacity: v })}
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
            <p className="text-sm text-dark-300 font-medium mb-1">{t('tl_about_dots_heading')}</p>
            <p className="text-xs text-dark-400 leading-relaxed">
              {t('tl_about_dots_body')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
