import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';

const router = Router();

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

// Get config
router.get('/', async (_req: Request, res: Response) => {
  try {
    let config = await prisma.config.findFirst();
    if (!config) {
      // Return env defaults if no config exists
      config = await prisma.config.create({
        data: {
          consumerKey: process.env.MPESA_CONSUMER_KEY || '',
          consumerSecret: process.env.MPESA_CONSUMER_SECRET || '',
          shortcode: process.env.MPESA_SHORTCODE || '',
          passkey: process.env.MPESA_PASSKEY || '',
          initiatorName: process.env.MPESA_INITIATOR_NAME || '',
          securityCredential: process.env.MPESA_SECURITY_CREDENTIAL || '',
          environment: process.env.MPESA_ENVIRONMENT || 'sandbox',
          stkCallbackUrl: process.env.MPESA_STK_CALLBACK_URL || '',
          c2bConfirmationUrl: process.env.MPESA_C2B_CONFIRMATION_URL || '',
          c2bValidationUrl: process.env.MPESA_C2B_VALIDATION_URL || '',
          b2cResultUrl: process.env.MPESA_B2C_RESULT_URL || '',
          b2cTimeoutUrl: process.env.MPESA_B2C_TIMEOUT_URL || '',
        },
      });
    }

    // Mask secrets in response
    res.json({
      ...config,
      consumerSecret: config.consumerSecret ? '***' + config.consumerSecret.slice(-4) : '',
      passkey: config.passkey ? '***' + config.passkey.slice(-4) : '',
      securityCredential: config.securityCredential ? '***' + config.securityCredential.slice(-4) : '',
    });
  } catch (error) {
    console.error('Get config error:', error);
    res.status(500).json({ error: 'Failed to get config' });
  }
});

// Update config
router.put('/', async (req: Request, res: Response) => {
  try {
    const body = configSchema.parse(req.body);

    const existing = await prisma.config.findFirst();

    let config;
    if (existing) {
      // Only update fields that are not masked (don't overwrite ***)
      const updateData: Record<string, string> = {};
      for (const [key, value] of Object.entries(body)) {
        if (typeof value === 'string' && value.startsWith('***')) {
          // Skip masked values - keep existing
          continue;
        }
        updateData[key] = value;
      }

      config = await prisma.config.update({
        where: { id: existing.id },
        data: updateData,
      });
    } else {
      config = await prisma.config.create({ data: body });
    }

    // Update process.env so runtime picks up changes
    process.env.MPESA_CONSUMER_KEY = config.consumerKey;
    process.env.MPESA_CONSUMER_SECRET = config.consumerSecret;
    process.env.MPESA_SHORTCODE = config.shortcode;
    process.env.MPESA_PASSKEY = config.passkey;
    process.env.MPESA_INITIATOR_NAME = config.initiatorName || '';
    process.env.MPESA_SECURITY_CREDENTIAL = config.securityCredential || '';
    process.env.MPESA_ENVIRONMENT = config.environment;
    process.env.MPESA_STK_CALLBACK_URL = config.stkCallbackUrl;
    process.env.MPESA_C2B_CONFIRMATION_URL = config.c2bConfirmationUrl;
    process.env.MPESA_C2B_VALIDATION_URL = config.c2bValidationUrl;
    process.env.MPESA_B2C_RESULT_URL = config.b2cResultUrl;
    process.env.MPESA_B2C_TIMEOUT_URL = config.b2cTimeoutUrl;

    res.json({ success: true, message: 'Configuration saved' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Update config error:', error);
    res.status(500).json({ error: 'Failed to update config' });
  }
});

export default router;
