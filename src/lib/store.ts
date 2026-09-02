import { useState, useEffect, useCallback } from 'react';
import { hostP2PNode } from './p2p';

export interface DinnerSession {
  id: string;
  tableName: string;
  scenarioId: string;
  currentActIndex: number;
  status: 'WAITING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  actStartedAt: number | null;
  pausedAt: number | null;
  completedAt?: number | null;
  updatedAt?: number;
  devMode?: boolean;
}

const STORAGE_KEY = 'immersive_sessions';
const ONE_HOUR_MS = 60 * 60 * 1000;

let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel('immersive_dinner_sessions_channel');
  } catch {
    // Fallback if not supported
  }
}

// Clean up sessions completed more than 1 hour ago
const pruneExpiredSessions = (sessions: Record<string, DinnerSession>): Record<string, DinnerSession> => {
  const now = Date.now();
  let changed = false;
  const result: Record<string, DinnerSession> = {};

  for (const [id, session] of Object.entries(sessions)) {
    if (session.status === 'COMPLETED') {
      const finishTime = session.completedAt || session.updatedAt || session.actStartedAt || 0;
      if (now - finishTime > ONE_HOUR_MS) {
        changed = true;
        continue; // Expired, skip
      }
    }
    result[id] = session;
  }

  return changed ? result : sessions;
};

export const getSessions = (): Record<string, DinnerSession> => {
  if (typeof window === 'undefined') return {};
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return {};
  try {
    const parsed = JSON.parse(data);
    const pruned = pruneExpiredSessions(parsed);
    if (pruned !== parsed) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
    }
    return pruned;
  } catch {
    return {};
  }
};

export const fetchSessionById = async (id: string): Promise<DinnerSession | null> => {
  try {
    const res = await fetch(`/api/sessions/${id}`);
    if (res.ok) {
      const session: DinnerSession = await res.json();
      if (session && session.id) {
        const local = getSessions();
        local[id] = session;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(local));
        window.dispatchEvent(new Event('sessions-updated'));
        return session;
      }
    }
  } catch {
    // Offline or starting
  }
  const local = getSessions();
  return local[id] || null;
};

// Push to server in background
const pushSessionsToServer = async (sessions: Record<string, DinnerSession>) => {
  try {
    await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessions)
    });
  } catch {
    // Offline or starting up
  }
};

export const saveSessions = (sessions: Record<string, DinnerSession>) => {
  if (typeof window === 'undefined') return;
  const pruned = pruneExpiredSessions(sessions);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
  window.dispatchEvent(new Event('sessions-updated'));
  
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'SESSIONS_UPDATE', sessions: pruned });
    } catch {
      // Ignore
    }
  }

  // Broadcast to P2P connected guests
  for (const s of Object.values(pruned)) {
    if (s && s.id) {
      hostP2PNode.updateState(s);
    }
  }

  // Sync to server API
  pushSessionsToServer(pruned);
};

export const getHostAuth = () => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('immersive_host_auth') === 'true';
};

export const setHostAuth = (val: boolean) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('immersive_host_auth', val ? 'true' : 'false');
};

export function useSessions() {
  const [sessions, setSessions] = useState<Record<string, DinnerSession>>(() => getSessions());
  
  // Local storage, broadcast channel, and periodic server polling
  useEffect(() => {
    let isMounted = true;

    const handleLocalUpdate = () => {
      if (isMounted) setSessions(getSessions());
    };

    const handleBroadcast = (e: MessageEvent) => {
      if (e.data?.type === 'SESSIONS_UPDATE' && e.data.sessions) {
        if (isMounted) setSessions(pruneExpiredSessions(e.data.sessions));
      }
    };

    window.addEventListener('storage', handleLocalUpdate);
    window.addEventListener('sessions-updated', handleLocalUpdate);
    if (broadcastChannel) {
      broadcastChannel.addEventListener('message', handleBroadcast);
    }

    // Fetch latest sessions from server API immediately and periodically
    const fetchServerSessions = async () => {
      try {
        const res = await fetch('/api/sessions');
        if (res.ok) {
          const remoteSessions: Record<string, DinnerSession> = await res.json();
          if (remoteSessions) {
            const prunedRemote = pruneExpiredSessions(remoteSessions);
            const local = getSessions();
            // Merge remote with local prioritizing higher updatedAt
            const merged: Record<string, DinnerSession> = { ...local };
            for (const [id, r] of Object.entries(prunedRemote)) {
              if (!merged[id]) {
                merged[id] = r;
              } else {
                const localUpdated = merged[id].updatedAt || merged[id].actStartedAt || 0;
                const remoteUpdated = r.updatedAt || r.actStartedAt || 0;
                if (remoteUpdated >= localUpdated) {
                  merged[id] = r;
                }
              }
            }
            const prunedMerged = pruneExpiredSessions(merged);
            if (JSON.stringify(prunedMerged) !== JSON.stringify(local)) {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(prunedMerged));
              if (isMounted) setSessions(prunedMerged);
              window.dispatchEvent(new Event('sessions-updated'));
            }
          }
        }
      } catch {
        // Offline or dev server starting
      }
    };

    fetchServerSessions();
    const pollInterval = setInterval(fetchServerSessions, 800);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      window.removeEventListener('storage', handleLocalUpdate);
      window.removeEventListener('sessions-updated', handleLocalUpdate);
      if (broadcastChannel) {
        broadcastChannel.removeEventListener('message', handleBroadcast);
      }
    };
  }, []);

  const updateSession = useCallback((id: string, updates: Partial<DinnerSession>) => {
    const current = getSessions();
    if (current[id]) {
      const updated: DinnerSession = { 
        ...current[id], 
        ...updates,
        completedAt: updates.status === 'COMPLETED' ? (current[id].completedAt || Date.now()) : current[id].completedAt,
        updatedAt: Date.now()
      };
      current[id] = updated;
      saveSessions(current);
    }
  }, []);

  const createSession = useCallback((tableName: string, scenarioId: string, devMode?: boolean) => {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    const current = getSessions();
    current[id] = {
      id,
      tableName,
      scenarioId,
      currentActIndex: 0,
      status: 'WAITING',
      actStartedAt: null,
      pausedAt: null,
      completedAt: null,
      updatedAt: Date.now(),
      devMode: !!devMode
    };
    saveSessions(current);
    return id;
  }, []);

  const advanceSession = useCallback((id: string) => {
    const current = getSessions();
    if (current[id]) {
      current[id].currentActIndex += 1;
      current[id].actStartedAt = Date.now();
      current[id].status = 'ACTIVE';
      current[id].pausedAt = null;
      current[id].updatedAt = Date.now();
      saveSessions(current);
    }
  }, []);

  const endSession = useCallback((id: string) => {
    updateSession(id, { status: 'COMPLETED', completedAt: Date.now() });
  }, [updateSession]);

  const deleteSession = useCallback((id: string) => {
    const current = getSessions();
    if (current[id]) {
      delete current[id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
      window.dispatchEvent(new Event('sessions-updated'));
      if (broadcastChannel) {
        broadcastChannel.postMessage({ type: 'SESSIONS_UPDATE', sessions: current });
      }
      // Call server delete API
      fetch(`/api/sessions/${id}`, { method: 'DELETE' }).catch(() => {});
    }
  }, []);

  return { sessions, updateSession, createSession, advanceSession, endSession, deleteSession };
}
