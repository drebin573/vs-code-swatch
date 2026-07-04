import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { temporal } from 'zundo';
import type { SemanticTokenStyle, ThemeDoc, TokenColorRule } from '../theme/types';
import darkModern from '../data/templates/dark-modern.json';

export interface ThemeState {
  themes: Record<string, ThemeDoc>;
  order: string[];
  activeId: string;

  setColor: (key: string, value: string | undefined) => void;
  setColors: (patch: Record<string, string | undefined>) => void;
  renameTheme: (name: string) => void;
  setThemeType: (type: 'dark' | 'light') => void;
  setTokenColors: (rules: TokenColorRule[]) => void;
  setSemanticTokenColors: (map: Record<string, SemanticTokenStyle>) => void;
  setSemanticHighlighting: (on: boolean) => void;

  addTheme: (doc: ThemeDoc) => string;
  duplicateTheme: (id: string) => string;
  deleteTheme: (id: string) => void;
  setActive: (id: string) => void;
  replaceActiveTheme: (doc: ThemeDoc) => void;
}

function newId(): string {
  return crypto.randomUUID();
}

const initialTheme: ThemeDoc = {
  ...(darkModern as unknown as ThemeDoc),
  name: 'My Theme',
};
const initialId = newId();

function mutateActive(state: ThemeState, fn: (doc: ThemeDoc) => ThemeDoc): Partial<ThemeState> {
  const doc = state.themes[state.activeId];
  if (!doc) return {};
  return { themes: { ...state.themes, [state.activeId]: fn(doc) } };
}

export const useThemeStore = create<ThemeState>()(
  persist(
    temporal(
      (set) => ({
        themes: { [initialId]: initialTheme },
        order: [initialId],
        activeId: initialId,

        setColor: (key, value) =>
          set((s) =>
            mutateActive(s, (doc) => {
              const colors = { ...doc.colors };
              if (value === undefined) delete colors[key];
              else colors[key] = value;
              return { ...doc, colors };
            }),
          ),

        setColors: (patch) =>
          set((s) =>
            mutateActive(s, (doc) => {
              const colors = { ...doc.colors };
              for (const [key, value] of Object.entries(patch)) {
                if (value === undefined) delete colors[key];
                else colors[key] = value;
              }
              return { ...doc, colors };
            }),
          ),

        renameTheme: (name) => set((s) => mutateActive(s, (doc) => ({ ...doc, name }))),
        setThemeType: (type) => set((s) => mutateActive(s, (doc) => ({ ...doc, type }))),
        setTokenColors: (tokenColors) => set((s) => mutateActive(s, (doc) => ({ ...doc, tokenColors }))),
        setSemanticTokenColors: (semanticTokenColors) =>
          set((s) => mutateActive(s, (doc) => ({ ...doc, semanticTokenColors }))),
        setSemanticHighlighting: (semanticHighlighting) =>
          set((s) => mutateActive(s, (doc) => ({ ...doc, semanticHighlighting }))),

        addTheme: (doc) => {
          const id = newId();
          set((s) => ({
            themes: { ...s.themes, [id]: doc },
            order: [...s.order, id],
            activeId: id,
          }));
          return id;
        },

        duplicateTheme: (id) => {
          const copy = newId();
          set((s) => {
            const src = s.themes[id];
            if (!src) return {};
            return {
              themes: { ...s.themes, [copy]: { ...src, name: `${src.name} Copy` } },
              order: [...s.order, copy],
              activeId: copy,
            };
          });
          return copy;
        },

        deleteTheme: (id) =>
          set((s) => {
            if (s.order.length <= 1) return {};
            const themes = { ...s.themes };
            delete themes[id];
            const order = s.order.filter((x) => x !== id);
            return {
              themes,
              order,
              activeId: s.activeId === id ? order[0] : s.activeId,
            };
          }),

        setActive: (activeId) => set({ activeId }),
        replaceActiveTheme: (doc) => set((s) => mutateActive(s, () => doc)),
      }),
      {
        // Only theme content participates in undo/redo, not which theme is open.
        partialize: (s) => ({ themes: s.themes, order: s.order }) as ThemeState,
        limit: 200,
      },
    ),
    {
      name: 'codeswatch',
      version: 1,
      // v0 shipped templates without "type"; heal any persisted theme.
      migrate: (persisted) => {
        const state = persisted as ThemeState;
        for (const doc of Object.values(state.themes ?? {})) {
          if (doc.type !== 'dark' && doc.type !== 'light') doc.type = guessType(doc);
        }
        return state;
      },
    },
  ),
);

function guessType(doc: ThemeDoc): 'dark' | 'light' {
  const m = /^#(..)(..)(..)/.exec(doc.colors?.['editor.background'] ?? '');
  if (!m) return 'dark';
  const [r, g, b] = [m[1], m[2], m[3]].map((h) => parseInt(h, 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 128 ? 'dark' : 'light';
}

export const useActiveTheme = (): ThemeDoc => useThemeStore((s) => s.themes[s.activeId]);

export const undo = () => useThemeStore.temporal.getState().undo();
export const redo = () => useThemeStore.temporal.getState().redo();
