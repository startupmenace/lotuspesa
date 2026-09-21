import { prisma } from '../config/database';
import { notifications } from './notification.service';

export async function createTransaction(data: {
  externalId: string;
  type: string;
  amount: number;
  phoneNumber: string;
  shortcode: string;
  accountReference?: string;
  transactionDesc?: string;
  checkoutRequestId?: string;
}) {
  const transaction = await prisma.transaction.create({
    data: {
      ...data,
      amount: data.amount,
      status: 'pending',
    },
  });

  notifications.broadcast('transaction:new', transaction);
  return transaction;
}

export async function updateTransactionFromSTKCallback(callback: {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: number;
  ResultDesc: string;
  CallbackMetadata?: { Item: Array<{ Name: string; Value: string | number }> };
}) {
  const transaction = await prisma.transaction.findFirst({
    where: { checkoutRequestId: callback.CheckoutRequestID },
  });

  if (!transaction) {
    console.error('Transaction not found for checkout:', callback.CheckoutRequestID);
    return null;
  }

  const metadata = callback.CallbackMetadata?.Item || [];
  const receiptItem = metadata.find(i => i.Name === 'MpesaReceiptNumber');
  const amountItem = metadata.find(i => i.Name === 'Amount');

  const updated = await prisma.transaction.update({
    where: { id: transaction.id },
    data: {
      status: callback.ResultCode === 0 ? 'completed' : 'failed',
      resultCode: String(callback.ResultCode),
      resultDescription: callback.ResultDesc,
      mpesaReceiptNumber: receiptItem?.Value as string || null,
    },
  });

  await prisma.callback.create({
    data: {
      transactionId: transaction.id,
      type: 'STK',
      rawPayload: JSON.stringify(callback),
      processed: true,
    },
  });

  notifications.broadcast('transaction:updated', updated);
  return updated;
}

export async function updateTransactionFromC2B(callback: {
  TransID: string;
  TransAmount: number;
  MSISDN: string;
  BillRefNumber: string;
  FirstName: string;
  LastName: string;
  OrgAccountBalance?: number;
}) {
  const transaction = await prisma.transaction.findFirst({
    where: { externalId: callback.TransID },
  });

  if (transaction) {
    const updated = await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: 'completed',
        mpesaReceiptNumber: callback.TransID,
      },
    });

    await prisma.callback.create({
      data: {
        transactionId: transaction.id,
        type: 'C2B',
        rawPayload: JSON.stringify(callback),
        processed: true,
      },
    });

    notifications.broadcast('transaction:updated', updated);
    return updated;
  }

  const newTransaction = await prisma.transaction.create({
    data: {
      externalId: callback.TransID,
      type: 'C2B',
      amount: callback.TransAmount,
      phoneNumber: callback.MSISDN,
      shortcode: process.env.MPESA_SHORTCODE || '',
      status: 'completed',
      mpesaReceiptNumber: callback.TransID,
      accountReference: callback.BillRefNumber,
    },
  });

  notifications.broadcast('transaction:new', newTransaction);
  return newTransaction;
}

export async function getTransactions(params: {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  search?: string;
}) {
  const page = params.page || 1;
  const limit = params.limit || 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (params.status) where.status = params.status;
  if (params.type) where.type = params.type;
  if (params.search) {
    where.OR = [
      { phoneNumber: { contains: params.search } },
      { mpesaReceiptNumber: { contains: params.search } },
      { accountReference: { contains: params.search } },
    ];
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    transactions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

export async function getStats() {
  const [totalTransactions, totalAmount, completedCount, failedCount, pendingCount] = await Promise.all([
    prisma.transaction.count(),
    prisma.transaction.aggregate({ _sum: { amount: true }, where: { status: 'completed' } }),
    prisma.transaction.count({ where: { status: 'completed' } }),
    prisma.transaction.count({ where: { status: 'failed' } }),
    prisma.transaction.count({ where: { status: 'pending' } }),
  ]);

  return {
    totalTransactions,
    totalAmount: totalAmount._sum.amount || 0,
    completedCount,
    failedCount,
    pendingCount,
    successRate: totalTransactions > 0 ? ((completedCount / totalTransactions) * 100).toFixed(1) : '0',
  };
}
