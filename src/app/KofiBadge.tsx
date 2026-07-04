const KOFI_URL = 'https://ko-fi.com/drebin573';

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

/** Always-visible support pill, floating over the bottom-right corner. */
export function KofiBadge() {
  return (
    <a
      href={KOFI_URL}
      target="_blank"
      rel="noreferrer"
      className="kofi-badge fixed bottom-4 right-4 z-30 flex items-center gap-1.5 rounded-full bg-[#ff5e5b] py-2 pl-3 pr-3.5 text-[12px] font-semibold text-white shadow-lg shadow-black/50 transition-transform hover:scale-105"
    >
      <KofiIcon />
      Support on Ko-fi
    </a>
  );
}
