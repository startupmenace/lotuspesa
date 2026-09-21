import { TrendingUp, CheckCircle, XCircle, Clock, ArrowLeftRight } from 'lucide-react';
import { useTransactions } from '../hooks/useTransactions';
import StatsCard from '../components/StatsCard';
import TransactionTable from '../components/TransactionTable';
import LiveFeed from '../components/LiveFeed';
import Charts from '../components/Charts';
import STKPushForm from '../components/STKPushForm';

export default function Dashboard() {
  const { transactions, stats, loading, refresh } = useTransactions();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">M-Pesa transaction monitoring overview</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Transactions"
          value={stats?.totalTransactions || 0}
          icon={ArrowLeftRight}
          color="green"
        />
        <StatsCard
          title="Total Amount"
          value={`KES ${Number(stats?.totalAmount || 0).toLocaleString()}`}
          icon={TrendingUp}
          color="blue"
          subtitle="Completed transactions"
        />
        <StatsCard
          title="Success Rate"
          value={`${stats?.successRate || 0}%`}
          icon={CheckCircle}
          color="green"
        />
        <StatsCard
          title="Pending"
          value={stats?.pendingCount || 0}
          icon={Clock}
          color="yellow"
          subtitle={`${stats?.failedCount || 0} failed`}
        />
      </div>

      <Charts stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Recent Transactions</h3>
            </div>
            {loading ? (
              <div className="p-12 text-center text-gray-400">Loading...</div>
            ) : (
              <TransactionTable transactions={transactions.slice(0, 5)} />
            )}
          </div>
        </div>

        <div className="space-y-6">
          <STKPushForm onSuccess={refresh} />
          <LiveFeed />
        </div>
      </div>
    </div>
  );
}
