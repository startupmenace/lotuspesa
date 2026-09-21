import { executeSql } from '../config/database';

function newId(): string { return crypto.randomUUID(); }

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
  const id = newId();
  await executeSql(
    `INSERT INTO "Transaction" (id, externalId, type, amount, phoneNumber, shortcode, accountReference, transactionDesc, checkoutRequestId)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.externalId, data.type, data.amount, data.phoneNumber, data.shortcode, data.accountReference || null, data.transactionDesc || null, data.checkoutRequestId || null],
  );
  return { id, ...data, status: 'pending', createdAt: new Date().toISOString() };
}

export async function updateTransactionByExternalId(externalId: string, data: Record<string, any>) {
  const sets = Object.keys(data).map(k => `"${k}" = ?`).join(', ');
  await executeSql(`UPDATE "Transaction" SET ${sets}, updatedAt = datetime('now') WHERE externalId = ?`, [...Object.values(data), externalId]);
}

export async function updateTransactionByCheckoutId(checkoutRequestId: string, data: Record<string, any>) {
  const sets = Object.keys(data).map(k => `"${k}" = ?`).join(', ');
  await executeSql(`UPDATE "Transaction" SET ${sets}, updatedAt = datetime('now') WHERE checkoutRequestId = ?`, [...Object.values(data), checkoutRequestId]);
}

export async function getTransactions(opts: { page?: number; limit?: number; status?: string; type?: string; search?: string } = {}) {
  const page = opts.page || 1;
  const limit = opts.limit || 20;
  const offset = (page - 1) * limit;
  let where = '1=1';
  const args: any[] = [];
  if (opts.status) { where += ' AND status = ?'; args.push(opts.status); }
  if (opts.type) { where += ' AND type = ?'; args.push(opts.type); }
  if (opts.search) { where += ' AND (phoneNumber LIKE ? OR externalId LIKE ? OR mpesaReceiptNumber LIKE ?)'; args.push(`%${opts.search}%`, `%${opts.search}%`, `%${opts.search}%`); }
  const countResult = await executeSql(`SELECT COUNT(*) as total FROM "Transaction" WHERE ${where}`, args);
  const total = Number(countResult.rows[0]?.total ?? 0);
  const result = await executeSql(`SELECT * FROM "Transaction" WHERE ${where} ORDER BY createdAt DESC LIMIT ? OFFSET ?`, [...args, limit, offset]);
  return { transactions: result.rows, pagination: { total, page, limit } };
}

export async function getTransactionById(id: string) {
  const tx = await executeSql('SELECT * FROM "Transaction" WHERE id = ?', [id]);
  if (!tx.rows[0]) return null;
  const callbacks = await executeSql('SELECT * FROM Callback WHERE transactionId = ? ORDER BY createdAt DESC', [id]);
  const refunds = await executeSql('SELECT * FROM Refund WHERE originalTransactionId = ?', [id]);
  return { ...tx.rows[0], callbacks: callbacks.rows, refunds: refunds.rows };
}

export async function getStats() {
  const total = await executeSql('SELECT COUNT(*) as count FROM "Transaction"');
  const successful = await executeSql(`SELECT COUNT(*) as count FROM "Transaction" WHERE status = 'completed'`);
  const pending = await executeSql(`SELECT COUNT(*) as count FROM "Transaction" WHERE status = 'pending'`);
  const failed = await executeSql(`SELECT COUNT(*) as count FROM "Transaction" WHERE status = 'failed'`);
  const totalAmount = await executeSql(`SELECT COALESCE(SUM(amount), 0) as total FROM "Transaction" WHERE status = 'completed'`);
  const todayCount = await executeSql(`SELECT COUNT(*) as count FROM "Transaction" WHERE date(createdAt) = date('now')`);
  return {
    total: Number(total.rows[0]?.count ?? 0),
    successful: Number(successful.rows[0]?.count ?? 0),
    pending: Number(pending.rows[0]?.count ?? 0),
    failed: Number(failed.rows[0]?.count ?? 0),
    totalAmount: Number(totalAmount.rows[0]?.total ?? 0),
    todayCount: Number(todayCount.rows[0]?.count ?? 0),
  };
}

export async function createCallback(data: { transactionId: string; type: string; rawPayload: string }) {
  const id = newId();
  await executeSql('INSERT INTO Callback (id, transactionId, type, rawPayload) VALUES (?, ?, ?, ?)', [id, data.transactionId, data.type, data.rawPayload]);
  return { id, ...data };
}

export async function updateTransactionFromSTKCallback(callback: any) {
  const merchantRequestId = callback.MerchantRequestID;
  const checkoutRequestId = callback.CheckoutRequestID;
  const resultCode = String(callback.ResultCode);
  const resultDescription = callback.ResultDesc;
  const status = callback.ResultCode === 0 ? 'completed' : 'failed';
  const mpesaReceiptNumber = callback.ResultCode === 0 ? callback.CallbackMetadata?.Item?.find((i: any) => i.Name === 'MpesaReceiptNumber')?.Value : null;
  await executeSql(
    `UPDATE "Transaction" SET status = ?, resultCode = ?, resultDescription = ?, mpesaReceiptNumber = ?, updatedAt = datetime('now')
          WHERE checkoutRequestId = ? OR externalId = ?`,
    [status, resultCode, resultDescription, mpesaReceiptNumber, checkoutRequestId, merchantRequestId],
  );
  const tx = await executeSql('SELECT id FROM "Transaction" WHERE checkoutRequestId = ? OR externalId = ?', [checkoutRequestId, merchantRequestId]);
  if (tx.rows[0]) {
    await createCallback({ transactionId: tx.rows[0].id, type: 'STK', rawPayload: JSON.stringify(callback) });
  }
}

export async function updateTransactionFromC2B(data: any) {
  await executeSql(
    `UPDATE "Transaction" SET status = 'completed', mpesaReceiptNumber = ?, updatedAt = datetime('now')
          WHERE externalId = ? OR phoneNumber = ?`,
    [data.TransID, data.TransID, data.MSISDN],
  );
}
