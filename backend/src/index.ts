import 'dotenv/config';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { checkInsRouter } from './routes/checkins.js';
import { childrenRouter } from './routes/children.js';
import { healthRouter } from './routes/health.js';
import { failInterruptedStoryPipelines } from './lib/pipeline.js';
import { mediaRouter } from './routes/media.js';
import { pinRouter } from './routes/pin.js';
import { storiesRouter } from './routes/stories.js';

const sourceFile = fileURLToPath(import.meta.url);
const frontendDist = path.resolve(path.dirname(sourceFile), '../../frontend/dist');

const errorHandler: ErrorRequestHandler = (error, _request, response) => {
  if (error instanceof ZodError) {
    response.status(400).json({ error: 'The request has invalid fields.' });
    return;
  }

  if (error instanceof SyntaxError && 'body' in error) {
    response.status(400).json({ error: 'The request body must be valid JSON.' });
    return;
  }

  console.error('[api] unhandled route error:', error);
  response.status(500).json({ error: 'Something went wrong.' });
};

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.use('/api', healthRouter);
  app.use('/api', pinRouter);
  app.use('/api', childrenRouter);
  app.use('/api', storiesRouter);
  app.use('/api', checkInsRouter);
  app.use('/api', mediaRouter);
  app.use('/api', (_request, response) => response.status(404).json({ error: 'Not found.' }));
  app.use(errorHandler);

  if (process.env.NODE_ENV === 'production' && existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.get('/{*splat}', (_request, response) => {
      response.sendFile(path.join(frontendDist, 'index.html'));
    });
  }

  return app;
}

const app = createApp();

async function startServer(): Promise<void> {
  try {
    await failInterruptedStoryPipelines();
  } catch (error) {
    console.error('[pipeline] could not recover interrupted generations:', error);
  }

  const port = Number(process.env.PORT ?? 3001);
  app.listen(port, () => {
    console.log(`BeBoo backend listening on :${port}`);
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === sourceFile) {
  void startServer();
}
