import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { prisma } from './config/database';
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

// M-Pesa callback routes (no auth - called by Safaricom)
app.use('/api/mpesa/stk', stkRoutes);
app.use('/api/mpesa/c2b', c2bRoutes);
app.use('/api/mpesa/b2c', b2cRoutes);

// Dashboard routes
app.use('/api/dashboard', dashboardRoutes);

// Config routes (protected)
app.use('/api/config', apiKeyAuth, configRoutes);

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log('M-Pesa API running on port ' + env.PORT);
  console.log('Environment: ' + env.MPESA_ENVIRONMENT);
});

export default app;
