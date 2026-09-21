import { createClient, Client } from '@libsql/client';

let client: Client;

export function getDb(): Client {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL || 'file:./prisma/dev.db';
    const authToken = process.env.TURSO_AUTH_TOKEN || undefined;
    client = createClient({ url, authToken });
  }
  return client;
}

export async function initDb() {
  const db = getDb();
  
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS "Transaction" (
      id TEXT PRIMARY KEY,
      externalId TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      phoneNumber TEXT NOT NULL,
      shortcode TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      mpesaReceiptNumber TEXT,
      checkoutRequestId TEXT,
      conversationId TEXT,
      resultCode TEXT,
      resultDescription TEXT,
      accountReference TEXT,
      transactionDesc TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS Callback (
      id TEXT PRIMARY KEY,
      transactionId TEXT NOT NULL,
      type TEXT NOT NULL,
      rawPayload TEXT NOT NULL,
      processed INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (transactionId) REFERENCES "Transaction"(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS Refund (
      id TEXT PRIMARY KEY,
      originalTransactionId TEXT NOT NULL,
      amount REAL NOT NULL,
      phoneNumber TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      conversationId TEXT,
      mpesaReceiptNumber TEXT,
      resultCode TEXT,
      resultDescription TEXT,
      deviceReturnTime TEXT NOT NULL,
      initiatedBy TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (originalTransactionId) REFERENCES "Transaction"(id)
    );

    CREATE TABLE IF NOT EXISTS Config (
      id TEXT PRIMARY KEY,
      consumerKey TEXT NOT NULL,
      consumerSecret TEXT NOT NULL,
      shortcode TEXT NOT NULL,
      passkey TEXT NOT NULL,
      initiatorName TEXT,
      securityCredential TEXT,
      environment TEXT NOT NULL DEFAULT 'sandbox',
      stkCallbackUrl TEXT NOT NULL,
      c2bConfirmationUrl TEXT NOT NULL,
      c2bValidationUrl TEXT NOT NULL,
      b2cResultUrl TEXT NOT NULL,
      b2cTimeoutUrl TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_tx_status ON "Transaction"(status);
    CREATE INDEX IF NOT EXISTS idx_tx_type ON "Transaction"(type);
    CREATE INDEX IF NOT EXISTS idx_tx_phone ON "Transaction"(phoneNumber);
    CREATE INDEX IF NOT EXISTS idx_tx_created ON "Transaction"(createdAt);
    CREATE INDEX IF NOT EXISTS idx_cb_tx ON Callback(transactionId);
    CREATE INDEX IF NOT EXISTS idx_refund_status ON Refund(status);
  `);

  console.log('Database initialized');
}
