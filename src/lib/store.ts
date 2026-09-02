import { useState, useEffect, useCallback } from 'react';
import { db } from './firebase';
import { doc, setDoc, getDoc, deleteDoc, onSnapshot, collection } from 'firebase/firestore';
import { Language } from '../data/content';

export interface DinnerSession {
  id: string;
  tableName: string;
  scenarioId: string;
  language: Language;
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
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return {};
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

export const cleanSessionForFirestore = (session: DinnerSession) => {
  return {
    id: session.id,
    tableName: session.tableName || `Table ${session.id}`,
    scenarioId: session.scenarioId || 'first-date',
    language: (session.language === 'EN' || session.language === 'ES' || session.language === 'RU') ? session.language : 'ES',
    currentActIndex: typeof session.currentActIndex === 'number' ? session.currentActIndex : 0,
    status: session.status || 'WAITING',
    actStartedAt: typeof session.actStartedAt === 'number' ? session.actStartedAt : null,
    pausedAt: typeof session.pausedAt === 'number' ? session.pausedAt : null,
    completedAt: typeof session.completedAt === 'number' ? session.completedAt : null,
    updatedAt: session.updatedAt || Date.now(),
    devMode: !!session.devMode
  };
};

export const fetchSessionById = async (id: string): Promise<DinnerSession | null> => {
  try {
    if (!db) return null;
    const docRef = doc(db, "sessions", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const session = docSnap.data() as DinnerSession;
      if (session && session.id) {
        const local = getSessions();
        local[id] = session;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(local));
        } catch {}
        window.dispatchEvent(new Event('sessions-updated'));
        return session;
      }
    }
  } catch (e) {
    console.error("fetchSessionById error:", e);
  }
  const local = getSessions();
  return local[id] || null;
};

// Push to Firestore in background
export const pushSessionToFirebase = async (session: DinnerSession) => {
  try {
    if (!db) return;
    const clean = cleanSessionForFirestore(session);
    await setDoc(doc(db, "sessions", session.id), clean);
  } catch (e) {
    console.error("Firebase save error:", e);
  }
};

export const saveSessions = (sessions: Record<string, DinnerSession>) => {
  if (typeof window === 'undefined') return;
  const pruned = pruneExpiredSessions(sessions);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
  } catch {}
  window.dispatchEvent(new Event('sessions-updated'));
  
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: "SESSIONS_UPDATE", sessions: pruned });
    } catch {
      // Ignore
    }
  }
};

export const getHostAuth = () => {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem('immersive_host_auth') === 'true';
  } catch {
    return false;
  }
};

export const buildGuestUrl = (session: DinnerSession, isDevMode?: boolean): string => {
  const baseUrl = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://radio.khromenko.com';
  const urlParams = new URLSearchParams();
  urlParams.set('session', session.id);
  urlParams.set('scenario', session.scenarioId);
  urlParams.set('act', session.currentActIndex.toString());
  urlParams.set('table', session.tableName);
  urlParams.set('status', session.status);
  if (session.language) {
    urlParams.set('lang', session.language);
  }
  
  if (session.actStartedAt) urlParams.set('startedAt', session.actStartedAt.toString());
  if (session.pausedAt) urlParams.set('pausedAt', session.pausedAt.toString());
  if (session.devMode || isDevMode) urlParams.set('dev', '1');

  return `${baseUrl}/?${urlParams.toString()}`;
};

export const setHostAuth = (val: boolean) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('immersive_host_auth', val ? 'true' : 'false');
  } catch {}
};

export const clearAllSiteData = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.clear();
  } catch (e) {}
  try {
    try { sessionStorage.clear(); } catch(e) {}
  } catch (e) {}
  try {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
      if (name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
        const hostParts = window.location.hostname.split('.');
        while (hostParts.length > 1) {
          const domain = hostParts.join('.');
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${domain}`;
          hostParts.shift();
        }
      }
    }
  } catch (e) {}
  window.dispatchEvent(new Event('sessions-updated'));
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

    // Real-time Firestore sync on all sessions across all devices
    let unsubFirestore: (() => void) | null = null;
    if (db) {
      try {
        unsubFirestore = onSnapshot(collection(db, "sessions"), (snapshot) => {
          if (!isMounted) return;
          const remoteSessions: Record<string, DinnerSession> = {};
          snapshot.docs.forEach((docSnap) => {
            const data = docSnap.data() as DinnerSession;
            if (data && data.id) {
              remoteSessions[data.id] = data;
            }
          });
          const pruned = pruneExpiredSessions(remoteSessions);
          saveSessions(pruned);
          setSessions(pruned);
        }, (error) => {
          console.error("Firestore collection listener error:", error);
        });
      } catch (e) {
        console.error("Failed to attach Firestore sessions listener:", e);
      }
    }

    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleLocalUpdate);
      window.removeEventListener('sessions-updated', handleLocalUpdate);
      if (broadcastChannel) {
        broadcastChannel.removeEventListener('message', handleBroadcast);
      }
      if (unsubFirestore) {
        unsubFirestore();
      }
    };
  }, []);

  const updateSession = useCallback((id: string, updates: Partial<DinnerSession>) => {
    const current = getSessions();
    if (current[id]) {
      const updated: DinnerSession = { 
        ...current[id], 
        ...updates,
        completedAt: updates.status === 'COMPLETED' ? (current[id].completedAt || Date.now()) : (updates.completedAt ?? current[id].completedAt ?? null),
        updatedAt: Date.now()
      };
      current[id] = updated;
      saveSessions(current);
      pushSessionToFirebase(updated);
    }
  }, []);

  const createSession = useCallback((tableName: string, scenarioId: string, devMode?: boolean, language: Language = 'ES') => {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    const current = getSessions();
    const newSession: DinnerSession = {
      id,
      tableName,
      scenarioId,
      language,
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
    
    setTimeout(() => { window.dispatchEvent(new Event('sessions-updated')); }, 50);
    return id;
  }, []);

  const advanceSession = useCallback((id: string) => {
    const current = getSessions();
    if (current[id]) {
      const updated: DinnerSession = {
        ...current[id],
        currentActIndex: current[id].currentActIndex + 1,
        actStartedAt: Date.now(),
        status: 'ACTIVE',
        pausedAt: null,
        updatedAt: Date.now()
      };
      current[id] = updated;
      saveSessions(current);
      pushSessionToFirebase(updated);
    }
  }, []);

  const endSession = useCallback((id: string) => {
    updateSession(id, { status: 'COMPLETED', completedAt: Date.now() });
  }, [updateSession]);

  const deleteSession = useCallback((id: string) => {
    const current = getSessions();
    if (current[id]) {
      delete current[id];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
      } catch {}
      window.dispatchEvent(new Event('sessions-updated'));
      if (broadcastChannel) {
        try { broadcastChannel.postMessage({ type: "SESSIONS_UPDATE", sessions: current }); } catch(e){}
      }
      try {
        if (db) deleteDoc(doc(db, "sessions", id));
      } catch (e) {}
    }
  }, []);

  return { sessions, updateSession, createSession, advanceSession, endSession, deleteSession };
}
