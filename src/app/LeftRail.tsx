import { useUiStore, type EditorTab } from '../store/uiStore';
import { KeyList } from './KeyList';
import { TokenEditor } from './TokenEditor';
import { SemanticEditor } from './SemanticEditor';

const tabs: { id: EditorTab; label: string }[] = [
  { id: 'colors', label: 'UI Colors' },
  { id: 'tokens', label: 'Syntax' },
  { id: 'semantic', label: 'Semantic' },
];

export function LeftRail() {
  const { editorTab, setEditorTab } = useUiStore();
  return (
    <div className="flex w-[280px] shrink-0 flex-col border-r border-zinc-800 bg-zinc-900">
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
  );
}
