export interface Transaction {
  id: string;
  externalId: string;
  type: string;
  amount: string;
  phoneNumber: string;
  shortcode: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  mpesaReceiptNumber: string | null;
  checkoutRequestId: string | null;
  conversationId: string | null;
  resultCode: string | null;
  resultDescription: string | null;
  accountReference: string | null;
  transactionDesc: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Refund {
  id: string;
  originalTransactionId: string;
  originalTransaction: Transaction;
  amount: string;
  phoneNumber: string;
  status: string;
  conversationId: string | null;
  mpesaReceiptNumber: string | null;
  resultCode: string | null;
  resultDescription: string | null;
  deviceReturnTime: string;
  initiatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Stats {
  totalTransactions: number;
  totalAmount: string;
  completedCount: number;
  failedCount: number;
  pendingCount: number;
  successRate: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface SSEEvent {
  type: string;
  data: unknown;
  timestamp: string;
}
