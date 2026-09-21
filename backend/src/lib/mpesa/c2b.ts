import { env, mpesaBaseUrl } from '../../config/env';
import { getAccessToken } from './auth';
import type { C2BRegisterRequest } from './types';

export async function registerC2BUrls(): Promise<{ ResponseCode: string; ResponseDescription: string }> {
  const token = await getAccessToken();

  const payload: C2BRegisterRequest = {
    ShortCode: env.MPESA_SHORTCODE,
    ResponseType: 'Completed',
    ConfirmationURL: env.MPESA_C2B_CONFIRMATION_URL,
    ValidationURL: env.MPESA_C2B_VALIDATION_URL,
  };

  const response = await fetch(
    `${mpesaBaseUrl}/mpesa/c2b/v1/registerurl`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw new Error(`C2B Register failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<{ ResponseCode: string; ResponseDescription: string }>;
}
