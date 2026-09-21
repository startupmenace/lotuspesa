import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import TransactionBadge from '../components/TransactionBadge';
import { RotateCcw } from 'lucide-react';
import type { Refund } from '../types';

export default function Refunds() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRefunds();
  }, []);

  const fetchRefunds = async () => {
    try {
      const data = await api.refunds();
      setRefunds(data.refunds);
    } catch (err) {
      console.error('Failed to fetch refunds:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Refunds</h1>
        <p className="text-sm text-gray-500 mt-1">Manage B2C refunds for device returns within 1 hour</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading...</div>
        ) : refunds.length === 0 ? (
          <div className="p-12 text-center">
            <RotateCcw size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No refunds yet</p>
            <p className="text-sm text-gray-400 mt-1">Refunds are initiated from the Transactions page</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Initiated By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {refunds.map((refund) => (
                <tr key={refund.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-mono">{refund.phoneNumber}</td>
                  <td className="px-6 py-4 text-sm font-bold">KES {Number(refund.amount).toLocaleString()}</td>
                  <td className="px-6 py-4"><TransactionBadge status={refund.status} /></td>
                  <td className="px-6 py-4 text-sm font-mono">{refund.mpesaReceiptNumber || '—'}</td>
                  <td className="px-6 py-4 text-sm capitalize">{refund.initiatedBy}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(refund.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
