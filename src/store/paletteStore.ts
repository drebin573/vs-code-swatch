import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Palette } from '../palette/types';

interface PaletteState {
  palette: Palette | null;
  importOpen: boolean;
  setPalette: (palette: Palette | null) => void;
  setImportOpen: (open: boolean) => void;
}

export const usePaletteStore = create<PaletteState>()(
  persist(
    (set) => ({
      palette: null,
      importOpen: false,
      setPalette: (palette) => set({ palette }),
      setImportOpen: (importOpen) => set({ importOpen }),
    }),
    { name: 'codeswatch-palette', partialize: (s) => ({ palette: s.palette }) },
  ),
);
