import { usePaletteStore } from '../store/paletteStore';
import { useThemeStore } from '../store/themeStore';
import { useUiStore } from '../store/uiStore';

/**
 * Persistent strip of imported palette colors under the preview. With a color
 * key selected, clicking a swatch assigns it — fast manual mapping.
 */
export function PaletteRail() {
  const { palette, setPalette } = usePaletteStore();
  const setColor = useThemeStore((s) => s.setColor);
  const selectedKey = useUiStore((s) => s.selectedKey);

  if (!palette || palette.colors.length === 0) return null;

  return (
    <div className="mt-2 flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
      <span className="shrink-0 text-[11px] uppercase tracking-wide text-zinc-500">
        {palette.name ?? 'Palette'}
      </span>
      <div className="flex min-w-0 flex-1 flex-wrap gap-1">
        {palette.colors.map((c, i) => (
          <button
            key={i}
            title={
              (c.label ? `${c.label} · ${c.hex}` : c.hex) +
              (selectedKey ? `\nClick to set ${selectedKey}` : '\nSelect a color key first, then click to assign')
            }
            className={`size-5 rounded border border-zinc-700 ${selectedKey ? 'hover:scale-125 hover:border-zinc-300' : 'cursor-default opacity-80'} transition-transform`}
            style={{ background: c.hex }}
            onClick={() => selectedKey && setColor(selectedKey, c.hex)}
          />
        ))}
      </div>
      <span className="shrink-0 text-[11px] text-zinc-600">
        {selectedKey ? `click → ${selectedKey}` : 'select a key, then click a swatch'}
      </span>
      <button className="shrink-0 text-[11px] text-zinc-500 hover:text-zinc-200" onClick={() => setPalette(null)}>
        clear
      </button>
    </div>
  );
}
