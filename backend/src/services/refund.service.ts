import { prisma } from '../config/database';
import { initiateB2CPayment } from '../lib/mpesa';
import { notifications } from './notification.service';

export async function initiateRefund(params: {
  transactionId: string;
  initiatedBy: 'manual' | 'api';
}) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: params.transactionId },
  });

  if (!transaction) {
    throw new Error('Transaction not found');
  }

  if (transaction.status !== 'completed') {
    throw new Error('Transaction must be completed to issue a refund');
  }

  const refundAmount = Number(transaction.amount) * 0.5;

  const b2cResponse = await initiateB2CPayment({
    amount: refundAmount,
    phoneNumber: transaction.phoneNumber,
    remarks: `50% refund for ${transaction.mpesaReceiptNumber || transaction.externalId}`,
    occasion: 'Device Return Refund',
  });

  const refund = await prisma.refund.create({
    data: {
      originalTransactionId: transaction.id,
      amount: refundAmount,
      phoneNumber: transaction.phoneNumber,
      status: 'processing',
      conversationId: b2cResponse.ConversationID,
      deviceReturnTime: new Date(),
      initiatedBy: params.initiatedBy,
    },
  });

  notifications.broadcast('refund:new', refund);
  return refund;
}

export async function updateRefundFromCallback(data: {
  ConversationID: string;
  ResultCode: number;
  ResultDesc: string;
  TransactionID?: string;
  ResultParameters?: { ResultParameter: Array<{ Key: string; Value: string | number }> };
}) {
  const refund = await prisma.refund.findFirst({
    where: { conversationId: data.ConversationID },
  });

  if (!refund) {
    console.error('Refund not found for conversation:', data.ConversationID);
    return null;
  }

  const receiptParam = data.ResultParameters?.ResultParameter.find(
    p => p.Key === 'MpesaReceiptNumber'
  );

  const updated = await prisma.refund.update({
    where: { id: refund.id },
    data: {
      status: data.ResultCode === 0 ? 'completed' : 'failed',
      resultCode: String(data.ResultCode),
      resultDescription: data.ResultDesc,
      mpesaReceiptNumber: receiptParam?.Value as string || data.TransactionID || null,
    },
  });

  notifications.broadcast('refund:updated', updated);
  return updated;
}

export async function getRefunds(params: { page?: number; limit?: number; status?: string }) {
  const page = params.page || 1;
  const limit = params.limit || 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (params.status) where.status = params.status;

  const [refunds, total] = await Promise.all([
    prisma.refund.findMany({
      where,
      include: { originalTransaction: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.refund.count({ where }),
  ]);

  return {
    refunds,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}
