import { useEffect } from 'react';
import { Header } from './app/Header';
import { KeyList } from './app/KeyList';
import { InspectorPanel } from './app/InspectorPanel';
import { Workbench } from './preview/Workbench';
import { undo, redo } from './store/themeStore';

export default function App() {
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
        <KeyList />
        <main className="min-w-0 flex-1 p-3">
          <div className="h-full overflow-hidden rounded-lg border border-zinc-800 shadow-2xl">
            <Workbench />
          </div>
        </main>
        <InspectorPanel />
      </div>
    </div>
  );
}
