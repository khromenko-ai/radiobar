import { DinnerSession } from './store';
import { db } from './firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export type P2PMessage = 
  | { type: 'SYNC_STATE'; session: DinnerSession; serverTime: number }
  | { type: 'HOST_ACTION'; action: string; payload?: any }
  | { type: 'GUEST_EVENT'; event: string; payload?: any }
  | { type: 'PING'; time: number }
  | { type: 'PONG'; time: number };

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

class HostNodeManager {
  public init(sessionId: string, initialSession: DinnerSession) {}
  public updateState(session: DinnerSession) {}
  public broadcast(message: P2PMessage) {}
  public getConnectedGuestsCount(): number { return 1; }
  public destroy() {}
}

class GuestNodeManager {
  private unsub?: () => void;
  private sessionId?: string;

  public init(
    sessionId: string, 
    onStateUpdate: (session: DinnerSession, hostTimestamp: number) => void,
    onConnected?: (connected: boolean) => void
  ) {
    this.sessionId = sessionId;
    if (onConnected) onConnected(true);
    
    // Subscribe to Firestore for real-time guest updates
    this.unsub = onSnapshot(doc(db, 'sessions', sessionId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as DinnerSession;
        onStateUpdate(data, data.updatedAt || Date.now());
      }
    }, (error) => {
      console.error("Guest Firebase subscription error", error);
      if (onConnected) onConnected(false);
    });
  }

  public sendGuestAction(action: any) {
    // Now handled directly by useSessions() modifying Firestore
  }

  public isConnected(): boolean {
    return !!this.unsub;
  }

  public destroy() {
    if (this.unsub) {
      this.unsub();
      this.unsub = undefined;
    }
  }
}

export const hostP2PNode = new HostNodeManager();
export const guestP2PNode = new GuestNodeManager();
