try { require('dotenv').config(); } catch {}

export const env = {
  MPESA_ENVIRONMENT: process.env.MPESA_ENVIRONMENT || 'sandbox',
  MPESA_CONSUMER_KEY: process.env.MPESA_CONSUMER_KEY || '',
  MPESA_CONSUMER_SECRET: process.env.MPESA_CONSUMER_SECRET || '',
  MPESA_SHORTCODE: process.env.MPESA_SHORTCODE || '',
  MPESA_PASSKEY: process.env.MPESA_PASSKEY || '',
  MPESA_INITIATOR_NAME: process.env.MPESA_INITIATOR_NAME || '',
  MPESA_SECURITY_CREDENTIAL: process.env.MPESA_SECURITY_CREDENTIAL || '',
  MPESA_STK_CALLBACK_URL: process.env.MPESA_STK_CALLBACK_URL || '',
  MPESA_C2B_CONFIRMATION_URL: process.env.MPESA_C2B_CONFIRMATION_URL || '',
  MPESA_C2B_VALIDATION_URL: process.env.MPESA_C2B_VALIDATION_URL || '',
  MPESA_B2C_RESULT_URL: process.env.MPESA_B2C_RESULT_URL || '',
  MPESA_B2C_TIMEOUT_URL: process.env.MPESA_B2C_TIMEOUT_URL || '',
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
  PORT: Number(process.env.PORT) || 3000,
  API_KEY: process.env.API_KEY || 'dev-api-key-12345',
};

export const mpesaBaseUrl = env.MPESA_ENVIRONMENT === 'production'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke';
