import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  wpm: number;
  useDyslexicFont: boolean;
  theme: 'focus' | 'dark' | 'light';
  setWpm: (wpm: number) => void;
  setUseDyslexicFont: (use: boolean) => void;
  setTheme: (theme: 'focus' | 'dark' | 'light') => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      wpm: 300,
      useDyslexicFont: false,
      theme: 'focus',
      setWpm: (wpm) => set({ wpm }),
      setUseDyslexicFont: (useDyslexicFont) => set({ useDyslexicFont }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'sprintread-settings',
    }
  )
);
