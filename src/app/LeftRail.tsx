import { useUiStore, type EditorTab } from '../store/uiStore';
import { KeyList } from './KeyList';
import { TokenEditor } from './TokenEditor';
import { SemanticEditor } from './SemanticEditor';

const tabs: { id: EditorTab; label: string }[] = [
  { id: 'colors', label: 'UI Colors' },
  { id: 'tokens', label: 'Syntax' },
  { id: 'semantic', label: 'Semantic' },
];

/**
 * Editor rail: a static column on lg+, a slide-in drawer below (toggled from
 * the header) so the preview keeps the full width on small screens.
 */
export function LeftRail() {
  const { editorTab, setEditorTab, railOpen, setRailOpen } = useUiStore();
  return (
    <>
      {railOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setRailOpen(false)} />}
      <div
        className={`fixed bottom-0 left-0 top-12 z-[45] flex w-[280px] max-w-[85vw] flex-col border-r border-zinc-800 bg-zinc-900 transition-transform lg:static lg:z-auto lg:shrink-0 lg:translate-x-0 lg:transition-none ${
          railOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="flex shrink-0 border-b border-zinc-800">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`flex-1 py-2 text-[12px] ${
                editorTab === t.id
                  ? 'border-b-2 border-sky-500 font-medium text-zinc-100'
                  : 'border-b-2 border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
              onClick={() => setEditorTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        {editorTab === 'colors' && <KeyList />}
        {editorTab === 'tokens' && <TokenEditor />}
        {editorTab === 'semantic' && <SemanticEditor />}
      </div>
    </>
  );
}
