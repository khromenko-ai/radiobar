import { useState, useEffect } from 'react';
import { Language } from '../data/content';

export type AppState = 'HOME' | 'INFO' | 'INTRO' | 'ACTS' | 'END';

export interface SessionData {
  language: Language;
  scenarioId: string | null;
  currentActIndex: number;
  maxActIndexReached: number;
  actStartedAt: number | null;
  state: AppState;
  devMode: boolean;
  hostSessionId: string | null;
}

const DEFAULT_SESSION: SessionData = {
  language: 'RU',
  scenarioId: null,
  currentActIndex: 0,
  maxActIndexReached: 0,
  actStartedAt: null,
  state: 'HOME',
  devMode: false,
  hostSessionId: null,
};

export function useSession() {
  const [session, setSessionState] = useState<SessionData>(() => {
    const saved = localStorage.getItem('immersive_dinner_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const validLangs: Language[] = ['EN', 'ES', 'RU'];
        const lang: Language = validLangs.includes(parsed.language) ? parsed.language : 'RU';
        const validStates: AppState[] = ['HOME', 'INFO', 'INTRO', 'ACTS', 'END'];
        let state: AppState = validStates.includes(parsed.state) ? parsed.state : 'HOME';

        if ((state === 'INTRO' || state === 'ACTS') && !parsed.scenarioId) {
          state = 'HOME';
        }

        return {
          ...DEFAULT_SESSION,
          ...parsed,
          language: lang,
          state,
          scenarioId: parsed.scenarioId || null,
        };
      } catch (e) {
        console.error('Failed to parse session', e);
      }
    }
    return DEFAULT_SESSION;
  });

  useEffect(() => {
    localStorage.setItem('immersive_dinner_session', JSON.stringify(session));
  }, [session]);

  const updateSession = (updates: Partial<SessionData>) => {
    setSessionState((prev) => ({ ...prev, ...updates }));
  };

  const resetSession = () => {
    setSessionState({ ...DEFAULT_SESSION, language: session.language, devMode: session.devMode });
  };

  const startScenario = (scenarioId: string) => {
    updateSession({
      scenarioId,
      state: 'INTRO',
      currentActIndex: 0,
      maxActIndexReached: 0,
      actStartedAt: null
    });
  };

  const beginActs = () => {
    updateSession({
      state: 'ACTS',
      currentActIndex: 0,
      maxActIndexReached: Math.max(session.maxActIndexReached || 0, 0),
      actStartedAt: Date.now()
    });
  };

  const advanceAct = () => {
    const nextIndex = session.currentActIndex + 1;
    updateSession({
      currentActIndex: nextIndex,
      maxActIndexReached: Math.max(session.maxActIndexReached || 0, nextIndex),
      actStartedAt: Date.now()
    });
  };

  const goToAct = (index: number) => {
    updateSession({
      currentActIndex: index
    });
  };

  const endExperience = () => {
    updateSession({
      state: 'END'
    });
  };

  const toggleDevMode = () => {
    updateSession({ devMode: !session.devMode });
  };

  return {
    session,
    updateSession,
    resetSession,
    startScenario,
    beginActs,
    advanceAct,
    goToAct,
    endExperience,
    toggleDevMode
  };
}
