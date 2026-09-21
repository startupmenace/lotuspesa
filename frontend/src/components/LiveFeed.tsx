import { useSSE } from '../hooks/useSSE';
import { ArrowDown, ArrowUp, RefreshCw } from 'lucide-react';
import TransactionBadge from './TransactionBadge';

export default function LiveFeed() {
  const { events, connected } = useSSE('/api/dashboard/stream');

  const transactionEvents = events.filter(
    (e) => e.type === 'transaction:new' || e.type === 'transaction:updated' || e.type === 'refund:new'
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Live Feed</h3>
        <div className="flex items-center gap-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className={connected ? 'text-green-600' : 'text-red-500'}>
            {connected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {transactionEvents.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            <RefreshCw size={24} className="mx-auto mb-2 animate-spin" />
            Waiting for transactions...
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {transactionEvents.slice(0, 15).map((event, i) => {
              const data = event.data as Record<string, unknown>;
              const isNew = event.type === 'transaction:new' || event.type === 'refund:new';
              return (
                <div key={i} className="px-6 py-3 flex items-center gap-4 hover:bg-gray-50">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isNew ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {isNew ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {event.type === 'refund:new' ? 'Refund Initiated' : isNew ? 'New Transaction' : 'Transaction Updated'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {String(data.phoneNumber || '')} - KES {String(data.amount || '')}
                    </p>
                  </div>
                  <div className="text-right">
                    {typeof data.status === "string" && <TransactionBadge status={data.status} />}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(event.timestamp).toLocaleTimeString('en-KE', { timeStyle: 'short' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
