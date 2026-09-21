import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { executeSql } from '../config/database';

const router = Router();

function newId(): string { return crypto.randomUUID(); }

const configSchema = z.object({
  consumerKey: z.string().min(1),
  consumerSecret: z.string().min(1),
  shortcode: z.string().min(1),
  passkey: z.string().min(1),
  initiatorName: z.string().optional().default(''),
  securityCredential: z.string().optional().default(''),
  environment: z.enum(['sandbox', 'production']).default('sandbox'),
  stkCallbackUrl: z.string().min(1),
  c2bConfirmationUrl: z.string().min(1),
  c2bValidationUrl: z.string().min(1),
  b2cResultUrl: z.string().min(1),
  b2cTimeoutUrl: z.string().min(1),
});

router.get('/', async (_req: Request, res: Response) => {
  try {
    let result = await executeSql('SELECT * FROM Config LIMIT 1');

    if (result.rows.length === 0) {
      await executeSql(
        `INSERT INTO Config (id, consumerKey, consumerSecret, shortcode, passkey, initiatorName, securityCredential, environment, stkCallbackUrl, c2bConfirmationUrl, c2bValidationUrl, b2cResultUrl, b2cTimeoutUrl)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [newId(), process.env.MPESA_CONSUMER_KEY||'', process.env.MPESA_CONSUMER_SECRET||'', process.env.MPESA_SHORTCODE||'', process.env.MPESA_PASSKEY||'', process.env.MPESA_INITIATOR_NAME||'', process.env.MPESA_SECURITY_CREDENTIAL||'', process.env.MPESA_ENVIRONMENT||'sandbox', process.env.MPESA_STK_CALLBACK_URL||'', process.env.MPESA_C2B_CONFIRMATION_URL||'', process.env.MPESA_C2B_VALIDATION_URL||'', process.env.MPESA_B2C_RESULT_URL||'', process.env.MPESA_B2C_TIMEOUT_URL||''],
      );
      result = await executeSql('SELECT * FROM Config LIMIT 1');
    }

    const config = result.rows[0];
    res.json({ ...config, consumerSecret: config.consumerSecret ? '***' + config.consumerSecret.slice(-4) : '', passkey: config.passkey ? '***' + config.passkey.slice(-4) : '', securityCredential: config.securityCredential ? '***' + config.securityCredential.slice(-4) : '' });
  } catch (error) {
    console.error('Get config error:', error);
    res.status(500).json({ error: 'Failed to get config' });
  }
});

router.put('/', async (req: Request, res: Response) => {
  try {
    const body = configSchema.parse(req.body);
    const existing = await executeSql('SELECT * FROM Config LIMIT 1');

    if (existing.rows.length > 0) {
      const updates: Record<string, string> = {};
      for (const [key, value] of Object.entries(body)) {
        if (typeof value === 'string' && value.startsWith('***')) continue;
        updates[key] = value;
      }
      const sets = Object.keys(updates).map(k => `"${k}" = ?`).join(', ');
      await executeSql(`UPDATE Config SET ${sets}, updatedAt = datetime('now') WHERE id = ?`, [...Object.values(updates), existing.rows[0].id]);
    } else {
      await executeSql(
        `INSERT INTO Config (id, consumerKey, consumerSecret, shortcode, passkey, initiatorName, securityCredential, environment, stkCallbackUrl, c2bConfirmationUrl, c2bValidationUrl, b2cResultUrl, b2cTimeoutUrl)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [newId(), body.consumerKey, body.consumerSecret, body.shortcode, body.passkey, body.initiatorName, body.securityCredential, body.environment, body.stkCallbackUrl, body.c2bConfirmationUrl, body.c2bValidationUrl, body.b2cResultUrl, body.b2cTimeoutUrl],
      );
    }

    process.env.MPESA_CONSUMER_KEY = body.consumerKey;
    process.env.MPESA_CONSUMER_SECRET = body.consumerSecret;
    process.env.MPESA_SHORTCODE = body.shortcode;
    process.env.MPESA_PASSKEY = body.passkey;
    process.env.MPESA_ENVIRONMENT = body.environment;
    process.env.MPESA_STK_CALLBACK_URL = body.stkCallbackUrl;

    res.json({ success: true, message: 'Configuration saved' });
  } catch (error) {
    if (error instanceof z.ZodError) { res.status(400).json({ error: 'Validation error', details: error.errors }); return; }
    console.error('Update config error:', error);
    res.status(500).json({ error: 'Failed to update config' });
  }
});

export default router;
