import { useState, useEffect } from 'react';

export interface DinnerSession {
  id: string;
  tableName: string;
  scenarioId: string;
  currentActIndex: number;
  status: 'WAITING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  actStartedAt: number | null;
  pausedAt: number | null;
}

export const getSessions = (): Record<string, DinnerSession> => {
  const data = localStorage.getItem('immersive_sessions');
  return data ? JSON.parse(data) : {};
};

export const saveSessions = (sessions: Record<string, DinnerSession>) => {
  localStorage.setItem('immersive_sessions', JSON.stringify(sessions));
  window.dispatchEvent(new Event('sessions-updated'));
};

export const getHostAuth = () => localStorage.getItem('immersive_host_auth') === 'true';
export const setHostAuth = (val: boolean) => {
  localStorage.setItem('immersive_host_auth', val ? 'true' : 'false');
};

export function useSessions() {
  const [sessions, setSessions] = useState(getSessions());
  
  useEffect(() => {
    const handleUpdate = () => setSessions(getSessions());
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('sessions-updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('sessions-updated', handleUpdate);
    };
  }, []);

  const updateSession = (id: string, updates: Partial<DinnerSession>) => {
    const current = getSessions();
    if (current[id]) {
      current[id] = { ...current[id], ...updates };
      saveSessions(current);
    }
  };

  const createSession = (tableName: string, scenarioId: string) => {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    const current = getSessions();
    current[id] = {
      id,
      tableName,
      scenarioId,
      currentActIndex: 0,
      status: 'WAITING',
      actStartedAt: null,
      pausedAt: null
    };
    saveSessions(current);
    return id;
  };

  const advanceSession = (id: string) => {
    const current = getSessions();
    if (current[id]) {
      current[id].currentActIndex += 1;
      current[id].actStartedAt = Date.now();
      current[id].status = 'ACTIVE';
      current[id].pausedAt = null;
      saveSessions(current);
    }
  };

  const endSession = (id: string) => {
    updateSession(id, { status: 'COMPLETED' });
  };

  return { sessions, updateSession, createSession, advanceSession, endSession };
}
