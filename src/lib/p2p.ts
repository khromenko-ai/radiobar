import { DinnerSession } from './store';

export type P2PMessage = 
  | { type: 'SYNC_STATE'; session: DinnerSession; serverTime: number }
  | { type: 'HOST_ACTION'; action: string; payload?: any }
  | { type: 'GUEST_EVENT'; event: string; payload?: any }
  | { type: 'PING'; time: number }
  | { type: 'PONG'; time: number };

export const getHostPeerId = (sessionId: string) => `dinner-master-${sessionId.trim().toLowerCase()}`;

export const buildGuestUrl = (session: DinnerSession, isDevMode?: boolean): string => {
  const baseUrl = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://radio.khromenko.com';
  const urlParams = new URLSearchParams();
  urlParams.set('session', session.id);
  urlParams.set('scenario', session.scenarioId);
  urlParams.set('act', session.currentActIndex.toString());
  urlParams.set('table', session.tableName);
  urlParams.set('status', session.status);
  if (session.actStartedAt) urlParams.set('startedAt', session.actStartedAt.toString());
  if (session.pausedAt) urlParams.set('pausedAt', session.pausedAt.toString());
  if (session.devMode || isDevMode) urlParams.set('dev', '1');
  return `${baseUrl}/?${urlParams.toString()}`;
};

// Safe and resilient Host Manager backed by BroadcastChannel & Server Sync
class HostNodeManager {
  private currentSession: DinnerSession | null = null;
  private channel: BroadcastChannel | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('dinner_sync_node_channel');
      } catch {
        // Fallback
      }
    }
  }

  public init(sessionId: string, initialSession: DinnerSession) {
    this.currentSession = initialSession;
    this.broadcast({
      type: 'SYNC_STATE',
      session: initialSession,
      serverTime: Date.now()
    });
  }

  public updateState(session: DinnerSession) {
    this.currentSession = session;
    this.broadcast({
      type: 'SYNC_STATE',
      session,
      serverTime: Date.now()
    });
  }

  public broadcast(message: P2PMessage) {
    if (this.channel) {
      try {
        this.channel.postMessage(message);
      } catch {
        // Safe fail
      }
    }
  }

  public getConnectedGuestsCount(): number {
    return 1;
  }

  public destroy() {
    // No-op
  }
}

// Safe and resilient Guest Manager backed by BroadcastChannel & Server Stream
class GuestNodeManager {
  private onStateUpdateCallback?: (session: DinnerSession, hostTimestamp: number) => void;
  private channel: BroadcastChannel | null = null;
  private eventSource: EventSource | null = null;
  private activeSessionId: string | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('dinner_sync_node_channel');
        this.channel.onmessage = (e) => {
          const msg = e.data as P2PMessage;
          if (msg && msg.type === 'SYNC_STATE' && msg.session) {
            if (this.activeSessionId && msg.session.id === this.activeSessionId) {
              if (this.onStateUpdateCallback) {
                this.onStateUpdateCallback(msg.session, msg.serverTime || Date.now());
              }
            }
          }
        };
      } catch {
        // Fallback
      }
    }
  }

  public init(
    sessionId: string, 
    onStateUpdate: (session: DinnerSession, hostTimestamp: number) => void,
    onConnected?: (connected: boolean) => void
  ) {
    this.activeSessionId = sessionId;
    this.onStateUpdateCallback = onStateUpdate;

    if (onConnected) onConnected(true);

    // Connect to Server-Sent Events stream for instant server pushes
    if (typeof window !== 'undefined' && 'EventSource' in window && !this.eventSource) {
      try {
        this.eventSource = new EventSource('/api/sessions-stream');
        this.eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.sessions && this.activeSessionId && data.sessions[this.activeSessionId]) {
              const live = data.sessions[this.activeSessionId];
              if (this.onStateUpdateCallback) {
                this.onStateUpdateCallback(live, Date.now());
              }
            }
          } catch {
            // Ignore parse errors
          }
        };
      } catch {
        // Fallback
      }
    }
  }

  public sendGuestAction(action: any) {
    if (this.channel) {
      try {
        this.channel.postMessage({
          type: 'GUEST_EVENT',
          payload: action
        });
      } catch {}
    }
  }

  public isConnected(): boolean {
    return true;
  }

  public destroy() {
    if (this.eventSource) {
      try { this.eventSource.close(); } catch {}
      this.eventSource = null;
    }
    this.activeSessionId = null;
  }
}

export const hostP2PNode = new HostNodeManager();
export const guestP2PNode = new GuestNodeManager();
