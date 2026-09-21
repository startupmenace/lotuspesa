import { env, mpesaBaseUrl } from '../../config/env';
import type { OAuthToken } from './types';

let tokenCache: { token: string; expiresAt: number } | null = null;

export async function getAccessToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  const credentials = Buffer.from(
    `${env.MPESA_CONSUMER_KEY}:${env.MPESA_CONSUMER_SECRET}`
  ).toString('base64');

  console.log('--- OAuth Token Request ---');
  console.log('URL:', mpesaBaseUrl + '/oauth/v1/generate?grant_type=client_credentials');

  const response = await fetch(
    `${mpesaBaseUrl}/oauth/v1/generate?grant_type=client_credentials`,
    {
      method: 'GET',
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    }
  );

  const responseText = await response.text();
  console.log('OAuth Response:', response.status, responseText);

  if (!response.ok) {
    throw new Error(`Failed to get access token (${response.status}): ${responseText}`);
  }

  const data = JSON.parse(responseText) as OAuthToken;
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + 3500000,
  };

  console.log('Access token obtained successfully');
  return data.access_token;
}
