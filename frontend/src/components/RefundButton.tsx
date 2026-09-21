import { useState } from 'react';
import { api } from '../lib/api';
import { RotateCcw, Loader2 } from 'lucide-react';

export default function RefundButton({ transactionId, disabled }: { transactionId: string; disabled?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleRefund = async () => {
    if (!confirm('Issue 50% refund for this transaction?')) return;
    setLoading(true);
    setResult(null);

    try {
      await api.initiateRefund(transactionId);
      setResult({ success: true, message: 'Refund initiated successfully' });
    } catch (err) {
      setResult({ success: false, message: err instanceof Error ? err.message : 'Failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleRefund}
        disabled={disabled || loading}
        className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
        {loading ? 'Processing...' : 'Issue 50% Refund'}
      </button>
      {result && (
        <p className={`text-xs mt-1 ${result.success ? 'text-green-600' : 'text-red-600'}`}>
          {result.message}
        </p>
      )}
    </div>
  );
}
