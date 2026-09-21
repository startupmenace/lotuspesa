import { getDb } from '../config/database';

function newId(): string { return crypto.randomUUID(); }

export async function createRefund(data: {
  originalTransactionId: string;
  amount: number;
  phoneNumber: string;
  deviceReturnTime: string;
  initiatedBy: string;
}) {
  const id = newId();
  const db = getDb();
  await db.execute({
    sql: `INSERT INTO Refund (id, originalTransactionId, amount, phoneNumber, deviceReturnTime, initiatedBy)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [id, data.originalTransactionId, data.amount, data.phoneNumber, data.deviceReturnTime, data.initiatedBy],
  });
  return { id, ...data, status: 'pending', createdAt: new Date().toISOString() };
}

export async function updateRefund(id: string, data: Record<string, any>) {
  const db = getDb();
  const sets = Object.keys(data).map(k => `"${k}" = ?`).join(', ');
  await db.execute({ sql: `UPDATE Refund SET ${sets}, updatedAt = datetime('now') WHERE id = ?`, args: [...Object.values(data), id] });
}

export async function getRefunds(opts: { page?: number; limit?: number; status?: string } = {}) {
  const db = getDb();
  const page = opts.page || 1;
  const limit = opts.limit || 20;
  const offset = (page - 1) * limit;
  let where = '1=1';
  const args: any[] = [];
  if (opts.status) { where += ' AND r.status = ?'; args.push(opts.status); }
  const countResult = await db.execute({ sql: `SELECT COUNT(*) as total FROM Refund r WHERE ${where}`, args });
  const total = Number((countResult.rows[0] as any).total);
  const result = await db.execute({
    sql: `SELECT r.*, t.phoneNumber as txPhone, t.amount as txAmount, t.mpesaReceiptNumber as txReceipt
          FROM Refund r LEFT JOIN "Transaction" t ON r.originalTransactionId = t.id
          WHERE ${where} ORDER BY r.createdAt DESC LIMIT ? OFFSET ?`,
    args: [...args, limit, offset],
  });
  return { refunds: result.rows, pagination: { total, page, limit } };
}

export async function initiateRefund(data: { transactionId: string; initiatedBy: string }) {
  const db = getDb();
  const tx = await db.execute({ sql: 'SELECT * FROM "Transaction" WHERE id = ?', args: [data.transactionId] });
  if (!tx.rows[0]) throw new Error('Transaction not found');
  const transaction = tx.rows[0] as any;
  const returnTime = new Date(transaction.createdAt).getTime();
  const now = Date.now();
  const diffMinutes = (now - returnTime) / (1000 * 60);
  if (diffMinutes > 60) throw new Error('Refund window expired (1 hour limit)');
  return createRefund({
    originalTransactionId: data.transactionId,
    amount: transaction.amount,
    phoneNumber: transaction.phoneNumber,
    deviceReturnTime: new Date().toISOString(),
    initiatedBy: data.initiatedBy,
  });
}

export async function updateRefundFromCallback(data: any) {
  const db = getDb();
  const status = data.ResultCode === 0 ? 'completed' : 'failed';
  await db.execute({
    sql: `UPDATE Refund SET status = ?, conversationId = ?, mpesaReceiptNumber = ?, resultCode = ?, resultDescription = ?, updatedAt = datetime('now')
          WHERE status = 'pending' LIMIT 1`,
    args: [status, data.ConversationID || null, data.TransactionID || null, String(data.ResultCode), data.ResultDesc || null],
  });
}
