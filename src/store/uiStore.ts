import { create } from 'zustand';

export type EditorTab = 'colors' | 'tokens' | 'semantic';

export interface UiState {
  selectedKey: string | null;
  search: string;
  editorTab: EditorTab;
  previewLanguage: string;

  selectKey: (key: string | null) => void;
  setSearch: (search: string) => void;
  setEditorTab: (tab: EditorTab) => void;
  setPreviewLanguage: (lang: string) => void;
}

export const useUiStore = create<UiState>()((set) => ({
  selectedKey: null,
  search: '',
  editorTab: 'colors',
  previewLanguage: 'typescript',

  selectKey: (selectedKey) => set({ selectedKey, editorTab: 'colors' }),
  setSearch: (search) => set({ search }),
  setEditorTab: (editorTab) => set({ editorTab }),
  setPreviewLanguage: (previewLanguage) => set({ previewLanguage }),
}));
