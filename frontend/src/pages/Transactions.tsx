import { useState } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import TransactionTable from '../components/TransactionTable';
import TransactionBadge from '../components/TransactionBadge';
import RefundButton from '../components/RefundButton';
import { X, Search } from 'lucide-react';
import type { Transaction } from '../types';

export default function Transactions() {
  const { transactions, loading, page, setPage, filters, setFilters, refresh } = useTransactions();
  const [selected, setSelected] = useState<Transaction | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <p className="text-sm text-gray-500 mt-1">View and manage all M-Pesa transactions</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by phone, receipt, or reference..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-mpesa-green focus:border-transparent"
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        <select
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-mpesa-green"
          value={filters.status || ''}
          onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
        <select
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-mpesa-green"
          value={filters.type || ''}
          onChange={(e) => setFilters({ ...filters, type: e.target.value || undefined })}
        >
          <option value="">All Types</option>
          <option value="STK_PUSH">STK Push</option>
          <option value="C2B">C2B</option>
          <option value="B2C">B2C</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading...</div>
        ) : (
          <TransactionTable transactions={transactions} onSelect={setSelected} />
        )}
      </div>

      {transactions.length > 0 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1.5 text-sm text-gray-600">Page {page}</span>
          <button
            onClick={() => setPage(page + 1)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
          >
            Next
          </button>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Transaction Details</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <TransactionBadge status={selected.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Type</span>
                <span className="text-sm font-medium">{selected.type.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Amount</span>
                <span className="text-sm font-bold">KES {Number(selected.amount).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Phone</span>
                <span className="text-sm font-mono">{selected.phoneNumber}</span>
              </div>
              {selected.mpesaReceiptNumber && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Receipt</span>
                  <span className="text-sm font-mono">{selected.mpesaReceiptNumber}</span>
                </div>
              )}
              {selected.accountReference && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Reference</span>
                  <span className="text-sm">{selected.accountReference}</span>
                </div>
              )}
              {selected.resultDescription && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Result</span>
                  <span className="text-sm text-gray-600">{selected.resultDescription}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Date</span>
                <span className="text-sm">{new Date(selected.createdAt).toLocaleString()}</span>
              </div>
            </div>

            {selected.status === 'completed' && selected.type === 'STK_PUSH' && (
              <div className="mt-6 pt-4 border-t">
                <RefundButton transactionId={selected.id} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
