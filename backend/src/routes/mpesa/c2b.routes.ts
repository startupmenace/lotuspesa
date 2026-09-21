import { Router, Request, Response } from 'express';
import { registerC2BUrls } from '../../lib/mpesa';
import { updateTransactionFromC2B } from '../../services/transaction.service';
import { notifications } from '../../services/notification.service';

const router = Router();

router.post('/register', async (_req: Request, res: Response) => {
  try {
    const result = await registerC2BUrls();
    res.json(result);
  } catch (error) {
    console.error('C2B register error:', error);
    res.status(500).json({ error: 'Failed to register C2B URLs' });
  }
});

router.post('/confirmation', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    console.log('C2B Confirmation received:', JSON.stringify(data, null, 2));

    await updateTransactionFromC2B({
      TransID: data.TransID,
      TransAmount: data.TransAmount,
      MSISDN: data.MSISDN,
      BillRefNumber: data.BillRefNumber,
      FirstName: data.FirstName,
      LastName: data.LastName,
    });

    notifications.broadcast('c2b:confirmation', data);
    res.json({ ResultCode: 0, ResultDesc: 'Success' });
  } catch (error) {
    console.error('C2B confirmation error:', error);
    res.json({ ResultCode: 0, ResultDesc: 'Success' });
  }
});

router.post('/validation', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    console.log('C2B Validation received:', JSON.stringify(data, null, 2));

    res.json({
      ResultCode: 0,
      ResultDesc: 'Accepted',
      ResultParams: { ResultType: 0 },
    });
  } catch (error) {
    console.error('C2B validation error:', error);
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
});

export default router;
