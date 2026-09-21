import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { initiateSTKPush, querySTKPush } from '../../lib/mpesa';
import { createTransaction, updateTransactionFromSTKCallback, getTransactions } from '../../services/transaction.service';
import { notifications } from '../../services/notification.service';
import { stkLimiter } from '../../middleware/rateLimit';

const router = Router();

const stkPushSchema = z.object({
  amount: z.number().positive(),
  phoneNumber: z.string().regex(/^254\d{9}$/, 'Phone must be in format 254XXXXXXXXX'),
  accountReference: z.string().min(1).max(12),
  transactionDesc: z.string().min(1).max(13),
});

router.post('/push', stkLimiter, async (req: Request, res: Response) => {
  try {
    const body = stkPushSchema.parse(req.body);
    const result = await initiateSTKPush(body);

    await createTransaction({
      externalId: result.MerchantRequestID,
      type: 'STK_PUSH',
      amount: body.amount,
      phoneNumber: body.phoneNumber,
      shortcode: process.env.MPESA_SHORTCODE || '',
      accountReference: body.accountReference,
      transactionDesc: body.transactionDesc,
      checkoutRequestId: result.CheckoutRequestID,
    });

    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('STK Push error:', error);
    const message = error instanceof Error ? error.message : 'Failed to initiate STK push';
    res.status(500).json({ error: message });
  }
});

router.post('/callback', async (req: Request, res: Response) => {
  try {
    console.log('STK Callback received:', JSON.stringify(req.body, null, 2));
    const callback = req.body.Body?.stkCallback;
    if (callback) {
      await updateTransactionFromSTKCallback(callback);
    }
    res.json({ ResultCode: 0, ResultDesc: 'Success' });
  } catch (error) {
    console.error('STK callback error:', error);
    res.json({ ResultCode: 0, ResultDesc: 'Success' });
  }
});

router.get('/query/:checkoutRequestId', async (req: Request, res: Response) => {
  try {
    const result = await querySTKPush(req.params.checkoutRequestId);
    res.json(result);
  } catch (error) {
    console.error('STK query error:', error);
    res.status(500).json({ error: 'Failed to query STK transaction' });
  }
});

router.get('/transactions', async (req: Request, res: Response) => {
  try {
    const { page, limit, status, search } = req.query;
    const result = await getTransactions({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status: status as string,
      type: 'STK_PUSH',
      search: search as string,
    });
    res.json(result);
  } catch (error) {
    console.error('Get STK transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

export default router;
