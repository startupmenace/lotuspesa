const TURSO_URL = process.env.TURSO_DATABASE_URL || '';
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN || '';

interface QueryResult {
  rows: Record<string, any>[];
  rows_affected: number;
}

interface ExecResult {
  results: QueryResult[];
}

function buildArgs(args: any[]): any[] {
  return args.map(a => {
    if (a === null || a === undefined) return { type: 'null' };
    if (typeof a === 'number') return { type: 'float', value: a };
    return { type: 'text', value: String(a) };
  });
}

export async function executeSql(sql: string, args: any[] = []): Promise<QueryResult> {
  const result = await batchExecute([{ sql, args }]);
  return result.results[0] || { rows: [], rows_affected: 0 };
}

export async function batchExecute(statements: { sql: string; args?: any[] }[]): Promise<ExecResult> {
  const body = {
    statements: statements.map(s => ({
      q: s.sql,
      args: buildArgs(s.args || []),
    })),
  };

  const resp = await fetch(`${TURSO_URL}/v2/pipeline`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TURSO_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Turso API error ${resp.status}: ${text}`);
  }

  const data: any = await resp.json();
  const results: QueryResult[] = (data.results || []).map((r: any) => ({
    rows: (r.rows || []).map((row: any[]) => {
      const obj: Record<string, any> = {};
      (r.cols || []).forEach((col: any, i: number) => {
        obj[col.name] = row[i] !== undefined ? row[i] : null;
      });
      return obj;
    }),
    rows_affected: r.rows_affected || 0,
  }));

  return { results };
}

export async function executeMultiple(sql: string): Promise<void> {
  const stmts = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
  await batchExecute(stmts.map(s => ({ sql: s })));
}

export async function initDb() {
  await executeMultiple(`
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
    )
  `);

  await executeMultiple(`
    CREATE TABLE IF NOT EXISTS Callback (
      id TEXT PRIMARY KEY,
      transactionId TEXT NOT NULL,
      type TEXT NOT NULL,
      rawPayload TEXT NOT NULL,
      processed INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (transactionId) REFERENCES "Transaction"(id) ON DELETE CASCADE
    )
  `);

  await executeMultiple(`
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
    )
  `);

  await executeMultiple(`
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
    )
  `);

  await executeMultiple(`CREATE INDEX IF NOT EXISTS idx_tx_status ON "Transaction"(status)`);
  await executeMultiple(`CREATE INDEX IF NOT EXISTS idx_tx_type ON "Transaction"(type)`);
  await executeMultiple(`CREATE INDEX IF NOT EXISTS idx_tx_phone ON "Transaction"(phoneNumber)`);
  await executeMultiple(`CREATE INDEX IF NOT EXISTS idx_tx_created ON "Transaction"(createdAt)`);
  await executeMultiple(`CREATE INDEX IF NOT EXISTS idx_cb_tx ON Callback(transactionId)`);
  await executeMultiple(`CREATE INDEX IF NOT EXISTS idx_refund_status ON Refund(status)`);

  console.log('Database initialized');
}
