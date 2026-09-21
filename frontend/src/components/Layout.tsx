import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  RotateCcw,
  Settings,
  BookOpen,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useSSE } from '../hooks/useSSE';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/refunds', icon: RotateCcw, label: 'Refunds' },
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/docs', icon: BookOpen, label: 'Docs' },
];

export default function Layout() {
  const { connected } = useSSE('/api/dashboard/stream');

  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-mpesa-dark text-white flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <div className="w-8 h-8 bg-mpesa-accent rounded-lg flex items-center justify-center">
              M
            </div>
            M-Pesa System
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-mpesa-green text-white'
                    : 'text-mpesa-light hover:bg-mpesa-dark/80'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 mx-4 mb-4 rounded-lg bg-white/10 text-sm">
          <div className="flex items-center gap-2">
            {connected ? (
              <>
                <Wifi size={14} className="text-mpesa-accent" />
                <span className="text-mpesa-light">Live Connected</span>
              </>
            ) : (
              <>
                <WifiOff size={14} className="text-red-400" />
                <span className="text-red-300">Disconnected</span>
              </>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
