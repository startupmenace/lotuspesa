import { env, mpesaBaseUrl } from '../../config/env';
import { getAccessToken } from './auth';
import type { B2CRequest, B2CResponse } from './types';

export async function initiateB2CPayment(params: {
  amount: number;
  phoneNumber: string;
  remarks: string;
  occasion: string;
}): Promise<B2CResponse> {
  const token = await getAccessToken();

  const payload: B2CRequest = {
    InitiatorName: env.MPESA_INITIATOR_NAME || '',
    SecurityCredential: env.MPESA_SECURITY_CREDENTIAL || '',
    CommandID: 'BusinessPayment',
    Amount: params.amount,
    PartyA: env.MPESA_SHORTCODE,
    PartyB: params.phoneNumber,
    Remarks: params.remarks,
    QueueTimeOutURL: env.MPESA_B2C_TIMEOUT_URL,
    ResultURL: env.MPESA_B2C_RESULT_URL,
    Occassion: params.occasion,
  };

  const response = await fetch(
    `${mpesaBaseUrl}/mpesa/b2c/v1/paymentrequest`,
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
    throw new Error(`B2C Payment failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<B2CResponse>;
}
