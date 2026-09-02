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
    const sessions = req.body;
    if (sessions && typeof sessions === 'object') {
      Object.assign(sessionsStore, sessions);
      cleanupExpiredSessions();
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
      sessionsStore[session.id] = session;
      cleanupExpiredSessions();
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
    if (sessionsStore[id]) {
      sessionsStore[id] = { ...sessionsStore[id], ...updates };
      cleanupExpiredSessions();
      res.json({ success: true, session: sessionsStore[id] });
    } else if (updates && updates.id) {
      sessionsStore[id] = updates;
      cleanupExpiredSessions();
      res.json({ success: true, session: sessionsStore[id] });
    } else {
      res.status(404).json({ error: 'Session not found' });
    }
  });

  app.delete('/api/sessions/:id', (req, res) => {
    const id = req.params.id;
    if (sessionsStore[id]) {
      delete sessionsStore[id];
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
