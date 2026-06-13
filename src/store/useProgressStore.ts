import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { LESSON_CATALOG } from '../lib/lessonCatalog';

export interface Session {
  lessonId: string;
  date?: string;
  wpm: number;
  wpm_peak: number;
  comprehension: number;
  regressions: number;
  duration: number;
  deviceType: 'mobile' | 'desktop';
}

export interface UserProgress {
  currentModule: number;
  currentLesson: string;
  totalSessions: number;
  avgWpm: number;
  avgComprehension: number;
  streak: number;
  lastSessionDate: string;
  gatesUnlocked: number[];
  wpmBaseline: number;
  comprehensionBaseline: number;
  recentSessions: Session[];
}

const defaultProgress: UserProgress = {
  currentModule: 1,
  currentLesson: 'M1L1',
  totalSessions: 0,
  avgWpm: 0,
  avgComprehension: 0,
  streak: 0,
  lastSessionDate: '',
  gatesUnlocked: [],
  wpmBaseline: 0,
  comprehensionBaseline: 0,
  recentSessions: [],
};

interface ProgressState {
  progress: UserProgress;
  loading: boolean;
  loadProgress: (userId: string) => Promise<void>;
  saveSession: (userId: string, session: Session) => Promise<void>;
  setBaseline: (userId: string, wpm: number, comprehension: number) => Promise<void>;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      progress: defaultProgress,
      loading: false,

      loadProgress: async (userId: string) => {
        set({ loading: true });
        try {
          const docRef = doc(db, 'users', userId, 'progress', 'main');
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            set({ progress: { ...defaultProgress, ...snap.data() as UserProgress } });
          }
        } catch (e) {
          console.error('Failed to load progress', e);
        } finally {
          set({ loading: false });
        }
      },

      saveSession: async (userId: string, session: Session) => {
        const current = get().progress;
        const sessionWithDate: Session = {
          ...session,
          date: session.date || new Date().toDateString(),
        };
        const recentSessions = [sessionWithDate, ...current.recentSessions].slice(0, 20);
        const last5 = recentSessions.slice(0, 5);
        const avgWpm = Math.round(last5.reduce((a, s) => a + s.wpm, 0) / last5.length);
        const avgComprehension = Math.round(last5.reduce((a, s) => a + s.comprehension, 0) / last5.length);
        const totalSessions = current.totalSessions + 1;

        // Streak calculation
        const today = new Date().toDateString();
        const lastDate = current.lastSessionDate;
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        const streak = lastDate === today ? current.streak :
          lastDate === yesterday ? current.streak + 1 : 1;

        // Gate unlock check
        const gatesUnlocked = [...current.gatesUnlocked];
        if (avgWpm >= 260 && avgComprehension >= 75 && !gatesUnlocked.includes(2)) gatesUnlocked.push(2);
        if (avgWpm >= 360 && avgComprehension >= 70 && !gatesUnlocked.includes(3)) gatesUnlocked.push(3);
        if (avgWpm >= 450 && avgComprehension >= 65 && !gatesUnlocked.includes(4)) gatesUnlocked.push(4);

        // Advance current lesson if completed the one we were on
        let currentLesson = current.currentLesson;
        let currentModule = current.currentModule;

        if (session.lessonId === currentLesson) {
          const currentIndex = LESSON_CATALOG.findIndex(l => l.id === currentLesson);
          if (currentIndex !== -1 && currentIndex < LESSON_CATALOG.length - 1) {
            const nextL = LESSON_CATALOG[currentIndex + 1];
            // If next module is unlocked, advance. Else, hold.
            const nextModuleUnlocked = nextL.module === 1 || gatesUnlocked.includes(nextL.module) || currentModule >= nextL.module;
            if (nextModuleUnlocked) {
              currentLesson = nextL.id;
              currentModule = nextL.module;
            }
          }
        }

        const updated: UserProgress = {
          ...current,
          recentSessions,
          avgWpm,
          avgComprehension,
          totalSessions,
          streak,
          lastSessionDate: today,
          gatesUnlocked,
          currentLesson,
          currentModule,
        };

        set({ progress: updated });
        try {
          await setDoc(doc(db, 'users', userId, 'progress', 'main'), updated);
          await setDoc(doc(db, 'users', userId, 'sessions', Date.now().toString()), {
            ...session,
            date: Timestamp.now(),
          });
        } catch (e) {
          console.error('Failed to save session', e);
        }
      },

      setBaseline: async (userId: string, wpm: number, comprehension: number) => {
        const updated = { ...get().progress, wpmBaseline: wpm, comprehensionBaseline: comprehension };
        set({ progress: updated });
        try {
          await setDoc(doc(db, 'users', userId, 'progress', 'main'), updated, { merge: true });
        } catch (e) {
          console.error('Failed to save baseline', e);
        }
      },
    }),
    { name: 'sprintread-progress' }
  )
);
