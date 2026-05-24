import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { connectDB } from './config/db';
import { connectRedis } from './config/redis';
import assignmentsRouter from './routes/assignments';
import { wsManager } from './websocket/wsManager';
import { setupWorker } from './workers/generationWorker';

const app = express();
const httpServer = createServer(app);

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    const allowed = (process.env.FRONTEND_URL || 'http://localhost:3000').trim();
    if (!origin || allowed === '*' || origin === allowed || /\.vercel\.app$/.test(origin)) {
      callback(null, origin || '*');
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/assignments', assignmentsRouter);
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ success: false, error: err.message || 'Internal server error' });
});

const PORT = Number(process.env.PORT) || 4000;

async function bootstrap() {
  await connectDB();
  await connectRedis();

  const wss = new WebSocketServer({ server: httpServer });
  wsManager.init(wss);

  await setupWorker();

  httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`WebSocket ready on ws://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
