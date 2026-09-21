import { env, mpesaBaseUrl } from '../../config/env';
import { getAccessToken } from './auth';
import { generatePassword, generateTimestamp } from './password';
import type { STKPushRequest, STKPushResponse, STKQueryRequest, STKQueryResponse } from './types';

export async function initiateSTKPush(params: {
  amount: number;
  phoneNumber: string;
  accountReference: string;
  transactionDesc: string;
}): Promise<STKPushResponse> {
  const token = await getAccessToken();
  const timestamp = generateTimestamp();
  const password = generatePassword(env.MPESA_SHORTCODE, env.MPESA_PASSKEY, timestamp);

  const payload: STKPushRequest = {
    BusinessShortCode: env.MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: params.amount,
    PartyA: params.phoneNumber,
    PartyB: env.MPESA_SHORTCODE,
    PhoneNumber: params.phoneNumber,
    CallBackURL: env.MPESA_STK_CALLBACK_URL,
    AccountReference: params.accountReference,
    TransactionDesc: params.transactionDesc,
  };

  console.log('--- STK Push Request ---');
  console.log('URL:', mpesaBaseUrl + '/mpesa/stkpush/v1/processrequest');
  console.log('Payload:', JSON.stringify(payload, null, 2));

  const response = await fetch(
    mpesaBaseUrl + '/mpesa/stkpush/v1/processrequest',
    {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  const responseText = await response.text();
  console.log('STK Push Response:', response.status, responseText);

  if (!response.ok) {
    const errorMsg = 'STK Push failed (' + response.status + '): ' + responseText;
    throw new Error(errorMsg);
  }

  return JSON.parse(responseText) as STKPushResponse;
}

export async function querySTKPush(checkoutRequestId: string): Promise<STKQueryResponse> {
  const token = await getAccessToken();
  const timestamp = generateTimestamp();
  const password = generatePassword(env.MPESA_SHORTCODE, env.MPESA_PASSKEY, timestamp);

  const payload: STKQueryRequest = {
    BusinessShortCode: env.MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    CheckoutRequestID: checkoutRequestId,
  };

  const response = await fetch(
    mpesaBaseUrl + '/mpesa/stkpushquery/v1/query',
    {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw new Error('STK Query failed: ' + response.status + ' ' + response.statusText);
  }

  return response.json() as Promise<STKQueryResponse>;
}
