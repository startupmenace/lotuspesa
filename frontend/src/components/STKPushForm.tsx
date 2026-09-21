import { useState } from 'react';
import { api } from '../lib/api';
import { Smartphone, Loader2 } from 'lucide-react';

export default function STKPushForm({ onSuccess }: { onSuccess?: () => void }) {
  const [form, setForm] = useState({
    amount: '',
    phoneNumber: '',
    accountReference: '',
    transactionDesc: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await api.stkPush({
        amount: Number(form.amount),
        phoneNumber: form.phoneNumber,
        accountReference: form.accountReference,
        transactionDesc: form.transactionDesc,
      });
      setResult({ success: true, message: 'STK Push sent! Check your phone. ' + (res.CustomerMessage || '') });
      setForm({ amount: '', phoneNumber: '', accountReference: '', transactionDesc: '' });
      onSuccess?.();
    } catch (err) {
      setResult({ success: false, message: err instanceof Error ? err.message : 'Failed to send STK Push' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-mpesa-green/10 rounded-lg flex items-center justify-center">
          <Smartphone size={20} className="text-mpesa-dark" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Initiate STK Push</h3>
          <p className="text-sm text-gray-500">Send payment prompt to customer phone</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (KES)</label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mpesa-green focus:border-transparent text-sm"
              placeholder="1500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="text"
              value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mpesa-green focus:border-transparent text-sm"
              placeholder="254712345678"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Account Reference</label>
          <input
            type="text"
            value={form.accountReference}
            onChange={(e) => setForm({ ...form, accountReference: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mpesa-green focus:border-transparent text-sm"
            placeholder="DEVICE-001"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <input
            type="text"
            value={form.transactionDesc}
            onChange={(e) => setForm({ ...form, transactionDesc: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mpesa-green focus:border-transparent text-sm"
            placeholder="Device rental"
            required
          />
        </div>

        {result && (
          <div className={`p-3 rounded-lg text-sm ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {result.message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-mpesa-green text-white py-2.5 rounded-lg font-medium hover:bg-mpesa-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? 'Sending...' : 'Send STK Push'}
        </button>
      </form>
    </div>
  );
}
