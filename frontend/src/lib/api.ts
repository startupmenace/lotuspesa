const API_KEY = import.meta.env.VITE_API_KEY || 'dev-api-key-12345';
const BASE_URL = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(BASE_URL + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'HTTP ' + res.status);
  }

  return res.json();
}

export const api = {
  stats: () => request<import('../types').Stats>('/dashboard/stats'),

  transactions: (params?: { page?: number; limit?: number; status?: string; type?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.status) query.set('status', params.status);
    if (params?.type) query.set('type', params.type);
    if (params?.search) query.set('search', params.search);
    return request<{ transactions: import('../types').Transaction[]; pagination: { total: number } }>(
      '/dashboard/transactions?' + query.toString()
    );
  },

  transaction: (id: string) => request<import('../types').Transaction>('/dashboard/transactions/' + id),

  refunds: (params?: { page?: number; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.status) query.set('status', params.status);
    return request<{ refunds: import('../types').Refund[]; pagination: { total: number } }>(
      '/dashboard/refunds?' + query.toString()
    );
  },

  initiateRefund: (transactionId: string) =>
    request<import('../types').Refund>('/mpesa/b2c/refund', {
      method: 'POST',
      body: JSON.stringify({ transactionId }),
    }),

  stkPush: (data: { amount: number; phoneNumber: string; accountReference: string; transactionDesc: string }): Promise<{ CustomerMessage?: string; ResponseCode?: string }> =>
    request('/mpesa/stk/push', { method: 'POST', body: JSON.stringify(data) }),

  registerC2B: () => request('/mpesa/c2b/register', { method: 'POST' }),

  getConfig: () => request<any>('/config'),

  updateConfig: (config: any) =>
    request<any>('/config', { method: 'PUT', body: JSON.stringify(config) }),
};
