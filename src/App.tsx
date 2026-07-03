import { useEffect } from 'react';
import { Header } from './app/Header';
import { LeftRail } from './app/LeftRail';
import { InspectorPanel } from './app/InspectorPanel';
import { ImportDialog } from './app/ImportDialog';
import { PaletteRail } from './app/PaletteRail';
import { Workbench } from './preview/Workbench';
import { undo, redo, useThemeStore } from './store/themeStore';
import { clearShareHash, themeFromLocationHash } from './theme/share';

// Module-level so React 19 StrictMode's double effect run can't import twice.
let handledShareHash = false;

export default function App() {
  useEffect(() => {
    if (handledShareHash) return;
    handledShareHash = true;
    const shared = themeFromLocationHash();
    if (shared) {
      useThemeStore.getState().addTheme(shared);
      clearShareHash();
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="flex h-screen flex-col bg-zinc-950 text-zinc-200">
      <Header />
      <div className="flex min-h-0 flex-1">
        <LeftRail />
        <main className="flex min-w-0 flex-1 flex-col p-3">
          <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-zinc-800 shadow-2xl">
            <Workbench />
          </div>
          <PaletteRail />
        </main>
        <InspectorPanel />
      </div>
      <ImportDialog />
    </div>
  );
}
