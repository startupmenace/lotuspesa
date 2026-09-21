import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { Stats } from '../types';

interface Props {
  stats: Stats | null;
}

export default function Charts({ stats }: Props) {
  const pieData = stats
    ? [
        { name: 'Completed', value: stats.completedCount, color: '#4CAF50' },
        { name: 'Failed', value: stats.failedCount, color: '#EF4444' },
        { name: 'Pending', value: stats.pendingCount, color: '#F59E0B' },
      ]
    : [];

  const barData = [
    { name: 'Mon', transactions: 12, amount: 15000 },
    { name: 'Tue', transactions: 19, amount: 23000 },
    { name: 'Wed', transactions: 8, amount: 9500 },
    { name: 'Thu', transactions: 15, amount: 18000 },
    { name: 'Fri', transactions: 22, amount: 27500 },
    { name: 'Sat', transactions: 30, amount: 38000 },
    { name: 'Sun', transactions: 25, amount: 31000 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4">Transaction Volume</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" fontSize={12} tickLine={false} />
            <YAxis fontSize={12} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
              formatter={(value: number, name: string) => [
                name === 'amount' ? `KES ${value.toLocaleString()}` : value,
                name === 'amount' ? 'Amount' : 'Transactions',
              ]}
            />
            <Bar dataKey="transactions" fill="#4CAF50" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4">Status Distribution</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={4}
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-6 mt-2">
          {pieData.map((entry) => (
            <div key={entry.name} className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-gray-600">{entry.name}</span>
              <span className="font-medium">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
