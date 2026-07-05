import { useUiStore, type EditorTab } from '../store/uiStore';
import { ChevronLeft, ChevronRight } from '../preview/icons';
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
 * the header) so the preview keeps the full width on small screens. On lg+
 * it can also collapse to a thin strip so the preview can take the full width.
 */
export function LeftRail() {
  const { editorTab, setEditorTab, railOpen, setRailOpen, leftRailCollapsed, setLeftRailCollapsed } = useUiStore();
  return (
    <>
      {railOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setRailOpen(false)} />}
      <div
        className={`fixed bottom-0 left-0 top-12 z-[45] flex w-[280px] max-w-[85vw] flex-col border-r border-zinc-800 bg-zinc-900 transition-transform lg:static lg:z-auto lg:shrink-0 lg:translate-x-0 lg:transition-[width] lg:duration-150 ${
          railOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        } ${leftRailCollapsed ? 'lg:w-3' : ''}`}
      >
        <div className={`min-h-0 flex-1 flex-col ${leftRailCollapsed ? 'flex lg:hidden' : 'flex'}`}>
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
            <button
              className="hidden shrink-0 items-center px-1.5 text-zinc-500 hover:text-zinc-200 lg:flex"
              onClick={() => setLeftRailCollapsed(true)}
              title="Collapse editor panel"
              aria-label="Collapse editor panel"
            >
              <ChevronLeft size={14} />
            </button>
          </div>
          {editorTab === 'colors' && <KeyList />}
          {editorTab === 'tokens' && <TokenEditor />}
          {editorTab === 'semantic' && <SemanticEditor />}
        </div>
        <button
          className={`hidden w-3 flex-1 items-center justify-center text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300 ${
            leftRailCollapsed ? 'lg:flex' : ''
          }`}
          onClick={() => setLeftRailCollapsed(false)}
          title="Show editor panel"
          aria-label="Show editor panel"
        >
          <ChevronRight size={12} />
        </button>
      </div>
    </>
  );
}
