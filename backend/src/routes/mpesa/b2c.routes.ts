import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { initiateRefund, updateRefundFromCallback } from '../../services/refund.service';
import { notifications } from '../../services/notification.service';

const router = Router();

const refundSchema = z.object({
  transactionId: z.string().uuid(),
});

router.post('/refund', async (req: Request, res: Response) => {
  try {
    const body = refundSchema.parse(req.body);
    const refund = await initiateRefund({
      transactionId: body.transactionId,
      initiatedBy: 'manual',
    });
    res.json(refund);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Refund error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to initiate refund' });
  }
});

router.post('/refund/api', async (req: Request, res: Response) => {
  try {
    const body = refundSchema.parse(req.body);
    const refund = await initiateRefund({
      transactionId: body.transactionId,
      initiatedBy: 'api',
    });
    res.json(refund);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('API Refund error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to initiate refund' });
  }
});

router.post('/result', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    console.log('B2C Result received:', JSON.stringify(data, null, 2));

    const result = data.Result;
    if (result) {
      await updateRefundFromCallback({
        ConversationID: result.ConversationID,
        ResultCode: result.ResultCode,
        ResultDesc: result.ResultDesc,
        TransactionID: result.TransactionID,
        ResultParameters: result.ResultParameters,
      });
    }

    notifications.broadcast('b2c:result', data);
    res.json({ ResultCode: 0, ResultDesc: 'Success' });
  } catch (error) {
    console.error('B2C result error:', error);
    res.json({ ResultCode: 0, ResultDesc: 'Success' });
  }
});

router.post('/timeout', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    console.log('B2C Timeout received:', JSON.stringify(data, null, 2));
    notifications.broadcast('b2c:timeout', data);
    res.json({ ResultCode: 0, ResultDesc: 'Success' });
  } catch (error) {
    console.error('B2C timeout error:', error);
    res.json({ ResultCode: 0, ResultDesc: 'Success' });
  }
});

export default router;
