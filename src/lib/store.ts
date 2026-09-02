import { useState, useEffect, useCallback } from 'react';
import { hostP2PNode } from './p2p';
import { db } from './firebase';
import { doc, setDoc, getDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

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
    const docRef = doc(db, 'sessions', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const session = docSnap.data() as DinnerSession;
      if (session && session.id) {
        const local = getSessions();
        local[id] = session;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(local));
        window.dispatchEvent(new Event('sessions-updated'));
        return session;
      }
    }
  } catch {
    // Offline or error
  }
  const local = getSessions();
  return local[id] || null;
};

// Push to Firestore in background
const pushSessionToFirebase = async (session: DinnerSession) => {
  try {
    await setDoc(doc(db, 'sessions', session.id), session);
  } catch (e) {
    console.error("Firebase save error", e);
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

  // Update legacy P2P host just in case any component still relies on it
  for (const s of Object.values(pruned)) {
    if (s && s.id) {
      hostP2PNode.updateState(s);
    }
  }
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
  
  // Local storage, broadcast channel, and Firestore real-time sync
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

    // Subscribe to Firestore for all active sessions in local storage
    const unsubscribes: (() => void)[] = [];
    const local = getSessions();
    Object.keys(local).forEach(id => {
       const unsub = onSnapshot(doc(db, 'sessions', id), (docSnapshot) => {
         if (docSnapshot.exists() && isMounted) {
           const remote = docSnapshot.data() as DinnerSession;
           const currentLocal = getSessions();
           
           // Only update if remote is newer
           const localUpdated = currentLocal[id]?.updatedAt || currentLocal[id]?.actStartedAt || 0;
           const remoteUpdated = remote.updatedAt || remote.actStartedAt || 0;
           
           if (remoteUpdated >= localUpdated) {
             currentLocal[id] = remote;
             saveSessions(currentLocal);
             setSessions(currentLocal);
           }
         }
       });
       unsubscribes.push(unsub);
    });

    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleLocalUpdate);
      window.removeEventListener('sessions-updated', handleLocalUpdate);
      if (broadcastChannel) {
        broadcastChannel.removeEventListener('message', handleBroadcast);
      }
      unsubscribes.forEach(u => u());
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
      pushSessionToFirebase(updated);
    }
  }, []);

  const createSession = useCallback((tableName: string, scenarioId: string, devMode?: boolean) => {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    const current = getSessions();
    const newSession: DinnerSession = {
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
    current[id] = newSession;
    saveSessions(current);
    pushSessionToFirebase(newSession);
    
    // Slight delay to allow the useEffect to subscribe to the newly created session
    setTimeout(() => { window.dispatchEvent(new Event('sessions-updated')); }, 100);
    
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
      pushSessionToFirebase(current[id]);
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
      try {
        deleteDoc(doc(db, 'sessions', id));
      } catch (e) {}
    }
  }, []);

  return { sessions, updateSession, createSession, advanceSession, endSession, deleteSession };
}
