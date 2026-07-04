import { create } from 'zustand';

export type EditorTab = 'colors' | 'tokens' | 'semantic';

/** Where a color-key selection came from; decides which side gets revealed. */
export type SelectSource = 'list' | 'preview';

export interface RevealPrefs {
  /** Flash the color in the preview when a key is picked from the list. */
  flashOnListSelect: boolean;
  /** Also flash when a preview region is clicked directly. */
  flashOnPreviewClick: boolean;
}

const PREFS_STORAGE_KEY = 'codeswatch:reveal-prefs';
const defaultPrefs: RevealPrefs = { flashOnListSelect: true, flashOnPreviewClick: false };

function loadPrefs(): RevealPrefs {
  try {
    return { ...defaultPrefs, ...JSON.parse(localStorage.getItem(PREFS_STORAGE_KEY) ?? '{}') };
  } catch {
    return defaultPrefs;
  }
}

/**
 * One selection drives the whole app: the inspector (picker + palette) edits
 * whatever is selected, whether it's a workbench color key, a TextMate token
 * rule's foreground, or a semantic selector's foreground.
 */
export type Selection =
  | { kind: 'color'; key: string }
  | { kind: 'token'; index: number }
  | { kind: 'semantic'; selector: string }
  | null;

export interface UiState {
  selection: Selection;
  search: string;
  editorTab: EditorTab;
  previewLanguage: string;
  /** Below lg the left rail is a slide-in drawer; this is its open state. */
  railOpen: boolean;
  /**
   * Ask the preview to flash the region(s) using this color key. `tick` bumps
   * on every request so re-selecting the same key re-triggers the flash.
   */
  reveal: { key: string; tick: number } | null;
  /** Ask the key list to expand to and scroll to this key (preview clicks). */
  listReveal: { key: string; tick: number } | null;
  prefs: RevealPrefs;

  select: (selection: Selection) => void;
  /** Select a workbench color key (or clear) and jump to the UI Colors tab. */
  selectKey: (key: string | null, source?: SelectSource) => void;
  requestReveal: (key: string) => void;
  setRevealPref: (patch: Partial<RevealPrefs>) => void;
  setSearch: (search: string) => void;
  setEditorTab: (tab: EditorTab) => void;
  setPreviewLanguage: (lang: string) => void;
  setRailOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>()((set) => ({
  selection: null,
  search: '',
  editorTab: 'colors',
  previewLanguage: 'typescript',
  railOpen: false,
  reveal: null,
  listReveal: null,
  prefs: loadPrefs(),

  select: (selection) => set({ selection }),
  // Also closes the mobile drawer: picking a key means you're done browsing
  // the list and want to see the preview + inspector.
  selectKey: (key, source = 'list') =>
    set((s) => {
      const flash = key !== null && (source === 'list' ? s.prefs.flashOnListSelect : s.prefs.flashOnPreviewClick);
      return {
        selection: key ? { kind: 'color', key } : null,
        editorTab: 'colors',
        railOpen: false,
        reveal: flash ? { key: key!, tick: (s.reveal?.tick ?? 0) + 1 } : s.reveal,
        listReveal:
          key && source === 'preview' ? { key, tick: (s.listReveal?.tick ?? 0) + 1 } : s.listReveal,
      };
    }),
  requestReveal: (key) => set((s) => ({ reveal: { key, tick: (s.reveal?.tick ?? 0) + 1 } })),
  setRevealPref: (patch) =>
    set((s) => {
      const prefs = { ...s.prefs, ...patch };
      try {
        localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
      } catch {
        // Storage may be unavailable (private mode); prefs still apply this session.
      }
      return { prefs };
    }),
  setSearch: (search) => set({ search }),
  setEditorTab: (editorTab) => set({ editorTab }),
  setPreviewLanguage: (previewLanguage) => set({ previewLanguage }),
  setRailOpen: (railOpen) => set({ railOpen }),
}));
