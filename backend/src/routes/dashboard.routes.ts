import { Router, Request, Response } from 'express';
import { getTransactions, getStats, getTransactionById } from '../services/transaction.service';
import { getRefunds } from '../services/refund.service';
import { notifications } from '../services/notification.service';
import { apiKeyAuth } from '../middleware/auth';

const router = Router();
let sseCounter = 0;

router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await getStats();
    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.get('/transactions', async (req: Request, res: Response) => {
  try {
    const { page, limit, status, type, search } = req.query;
    const result = await getTransactions({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status: status as string,
      type: type as string,
      search: search as string,
    });
    res.json(result);
  } catch (error) {
    console.error('Transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

router.get('/transactions/:id', async (req: Request, res: Response) => {
  try {
    const transaction = await getTransactionById(req.params.id);
    if (!transaction) { res.status(404).json({ error: 'Transaction not found' }); return; }
    res.json(transaction);
  } catch (error) {
    console.error('Transaction detail error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

router.get('/refunds', async (req: Request, res: Response) => {
  try {
    const { page, limit, status } = req.query;
    const result = await getRefunds({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status: status as string,
    });
    res.json(result);
  } catch (error) {
    console.error('Refunds error:', error);
    res.status(500).json({ error: 'Failed to fetch refunds' });
  }
});

router.get('/stream', (req: Request, res: Response) => {
  const apiKey = req.query.key;
  const { env } = require('../config/env');
  if (apiKey !== env.API_KEY) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const clientId = 'client-' + ++sseCounter;
  notifications.addClient(clientId, res);
  req.on('close', () => { notifications.removeClient(clientId); });
});

export default router;
