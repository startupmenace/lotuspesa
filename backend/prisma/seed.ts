import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.config.findFirst();
  if (existing) {
    console.log('Config already exists, skipping seed');
    return;
  }

  await prisma.config.create({
    data: {
      consumerKey: process.env.MPESA_CONSUMER_KEY || 'sandbox_key',
      consumerSecret: process.env.MPESA_CONSUMER_SECRET || 'sandbox_secret',
      shortcode: process.env.MPESA_SHORTCODE || '174379',
      passkey: process.env.MPESA_PASSKEY || 'sandbox_passkey',
      environment: 'sandbox',
      stkCallbackUrl: process.env.MPESA_STK_CALLBACK_URL || 'http://localhost:3000/api/mpesa/stk/callback',
      c2bConfirmationUrl: process.env.MPESA_C2B_CONFIRMATION_URL || 'http://localhost:3000/api/mpesa/c2b/confirmation',
      c2bValidationUrl: process.env.MPESA_C2B_VALIDATION_URL || 'http://localhost:3000/api/mpesa/c2b/validation',
      b2cResultUrl: process.env.MPESA_B2C_RESULT_URL || 'http://localhost:3000/api/mpesa/b2c/result',
      b2cTimeoutUrl: process.env.MPESA_B2C_TIMEOUT_URL || 'http://localhost:3000/api/mpesa/b2c/timeout',
    },
  });

  console.log('Config seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
