import { usePaletteStore } from '../store/paletteStore';

/**
 * Imported palette swatches, shown in the inspector directly under the color
 * picker. With something selected, clicking a swatch assigns its color —
 * works the same for UI colors, token rules, and semantic selectors.
 */
export function PaletteSwatches({ onPick }: { onPick: ((hex: string) => void) | null }) {
  const { palette, setPalette } = usePaletteStore();
  if (!palette || palette.colors.length === 0) return null;

  return (
    <div className="rounded border border-zinc-800 bg-zinc-950/60 p-2">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wide text-zinc-500">{palette.name ?? 'Palette'}</span>
        <button className="text-[11px] text-zinc-500 hover:text-zinc-200" onClick={() => setPalette(null)}>
          clear
        </button>
      </div>
      <div className="flex flex-wrap gap-1">
        {palette.colors.map((c, i) => (
          <button
            key={i}
            title={(c.label ? `${c.label} · ${c.hex}` : c.hex) + (onPick ? '' : '\nSelect something first, then click to assign')}
            className={`size-6 rounded border border-zinc-700 ${onPick ? 'hover:scale-110 hover:border-zinc-300' : 'cursor-default opacity-70'} transition-transform`}
            style={{ background: c.hex }}
            onClick={() => onPick?.(c.hex)}
          />
        ))}
      </div>
      {!onPick && <p className="mt-1.5 text-[11px] text-zinc-600">Select something to assign these colors.</p>}
    </div>
  );
}
