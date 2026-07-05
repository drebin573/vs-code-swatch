import { useEffect, useState } from 'react';

// Ko-fi's official embed panel — the same iframe their overlay widget opens.
const KOFI_EMBED_URL = 'https://ko-fi.com/drebin573/?hidefeed=true&widget=true&embed=true';

function KofiIcon() {
  return (
    <svg className="kofi-cup" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <path
        d="M10 15.5c-.2 0-2.8-1.6-2.8-3.4 0-1 .8-1.8 1.8-1.8.4 0 .8.2 1 .5.2-.3.6-.5 1-.5 1 0 1.8.8 1.8 1.8 0 1.8-2.6 3.4-2.8 3.4Z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

/** Always-visible support pill; opens the Ko-fi donation panel in-page. */
export function KofiBadge() {
  const [open, setOpen] = useState(false);
  // Stays true after the first open so the iframe isn't reloaded on reopen.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      {mounted && (
        <div className={open ? 'fixed inset-0 z-40' : 'hidden'} role="dialog" aria-modal="true" aria-label="Support on Ko-fi">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-16 right-4 flex h-[620px] max-h-[calc(100dvh-5.5rem)] w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl bg-[#f9f9f9] shadow-2xl shadow-black/60">
            <iframe src={KOFI_EMBED_URL} title="Support drebin573 on Ko-fi" className="h-full w-full border-0" loading="lazy" />
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => {
          setMounted(true);
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        className="kofi-badge fixed bottom-4 right-4 z-50 flex cursor-pointer items-center gap-1.5 rounded-full bg-[#ff5e5b] py-2 pl-3 pr-3.5 text-[12px] font-semibold text-white shadow-lg shadow-black/50 transition-transform hover:scale-105"
      >
        <KofiIcon />
        {open ? 'Close' : 'Support on Ko-fi'}
      </button>
    </>
  );
}
