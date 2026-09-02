import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

interface DinnerSession {
  id: string;
  tableName: string;
  scenarioId: string;
  currentActIndex: number;
  status: 'WAITING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  actStartedAt: number | null;
  pausedAt: number | null;
  completedAt?: number | null;
  updatedAt?: number;
}

// In-memory sessions store synced across network
const sessionsStore: Record<string, DinnerSession> = {};

// SSE Clients for instant real-time pushes
const sseClients = new Set<express.Response>();

function broadcastSSE(data: any) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

const ONE_HOUR_MS = 60 * 60 * 1000;

function cleanupExpiredSessions() {
  const now = Date.now();
  for (const id of Object.keys(sessionsStore)) {
    const s = sessionsStore[id];
    if (s.status === 'COMPLETED') {
      const finishTime = s.completedAt || s.updatedAt || s.actStartedAt || 0;
      if (now - finishTime > ONE_HOUR_MS) {
        delete sessionsStore[id];
      }
    }
  }
}

// Periodic cleanup every 60 seconds
setInterval(cleanupExpiredSessions, 60 * 1000);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Real-time SSE stream endpoint
  app.get('/api/sessions-stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    // Send initial state immediately
    cleanupExpiredSessions();
    res.write(`data: ${JSON.stringify({ type: 'INIT', sessions: sessionsStore })}\n\n`);

    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  // API endpoints for real-time guest/host synchronization
  app.get('/api/sessions', (req, res) => {
    cleanupExpiredSessions();
    res.json(sessionsStore);
  });

  app.get('/api/sessions/:id', (req, res) => {
    cleanupExpiredSessions();
    const session = sessionsStore[req.params.id];
    if (session) {
      res.json(session);
    } else {
      res.status(404).json({ error: 'Session not found' });
    }
  });

  app.post('/api/sessions', (req, res) => {
    const incoming = req.body;
    if (incoming && typeof incoming === 'object') {
      for (const [id, s] of Object.entries(incoming as Record<string, DinnerSession>)) {
        if (!s || !s.id) continue;
        const existing = sessionsStore[id];
        if (!existing) {
          sessionsStore[id] = s;
        } else {
          // If existing is already active/started and incoming has older or missing timestamps, preserve existing
          const existingUpdated = existing.updatedAt || existing.actStartedAt || 0;
          const incomingUpdated = s.updatedAt || s.actStartedAt || 0;
          if (incomingUpdated >= existingUpdated) {
            sessionsStore[id] = { ...existing, ...s };
          }
        }
      }
      cleanupExpiredSessions();
      broadcastSSE({ type: 'UPDATE', sessions: sessionsStore });
      res.json({ success: true, sessions: sessionsStore });
    } else {
      res.status(400).json({ error: 'Invalid sessions payload' });
    }
  });

  app.post('/api/sessions/:id', (req, res) => {
    const session = req.body;
    if (session && session.id) {
      if (session.status === 'COMPLETED' && !session.completedAt) {
        session.completedAt = Date.now();
      }
      session.updatedAt = Date.now();
      sessionsStore[session.id] = session;
      cleanupExpiredSessions();
      broadcastSSE({ type: 'UPDATE', sessions: sessionsStore, updatedId: session.id });
      res.json({ success: true, session: sessionsStore[session.id] });
    } else {
      res.status(400).json({ error: 'Invalid session payload' });
    }
  });

  app.patch('/api/sessions/:id', (req, res) => {
    const id = req.params.id;
    const updates = req.body;
    if (updates.status === 'COMPLETED' && !updates.completedAt) {
      updates.completedAt = Date.now();
    }
    updates.updatedAt = Date.now();
    if (sessionsStore[id]) {
      sessionsStore[id] = { ...sessionsStore[id], ...updates };
      cleanupExpiredSessions();
      broadcastSSE({ type: 'UPDATE', sessions: sessionsStore, updatedId: id });
      res.json({ success: true, session: sessionsStore[id] });
    } else if (updates && updates.id) {
      sessionsStore[id] = updates;
      cleanupExpiredSessions();
      broadcastSSE({ type: 'UPDATE', sessions: sessionsStore, updatedId: id });
      res.json({ success: true, session: sessionsStore[id] });
    } else {
      res.status(404).json({ error: 'Session not found' });
    }
  });

  app.delete('/api/sessions/:id', (req, res) => {
    const id = req.params.id;
    if (sessionsStore[id]) {
      delete sessionsStore[id];
      broadcastSSE({ type: 'DELETE', deletedId: id, sessions: sessionsStore });
    }
    res.json({ success: true });
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
