import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { env } from './config/env';
import { initDb } from './config/database';
import { apiLimiter } from './middleware/rateLimit';
import { errorHandler } from './middleware/error';
import { apiKeyAuth } from './middleware/auth';
import stkRoutes from './routes/mpesa/stk.routes';
import c2bRoutes from './routes/mpesa/c2b.routes';
import b2cRoutes from './routes/mpesa/b2c.routes';
import dashboardRoutes from './routes/dashboard.routes';
import configRoutes from './routes/config.routes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(apiLimiter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/mpesa/stk', stkRoutes);
app.use('/api/mpesa/c2b', c2bRoutes);
app.use('/api/mpesa/b2c', b2cRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/config', apiKeyAuth, configRoutes);

const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));
app.get('*', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log('M-Pesa API running on port ' + env.PORT);
  console.log('Environment: ' + env.MPESA_ENVIRONMENT);
  initDb().then(() => {
    console.log('Database initialized successfully');
  }).catch(err => {
    console.error('Database init failed (non-fatal):', err.message || err);
  });
});

export default app;
