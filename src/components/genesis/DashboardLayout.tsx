import { NavLink, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { StatusIndicator } from './MetricCard';
import { useQuery } from '@tanstack/react-query';
import { fetchRuntimeMetrics } from '@/services/genesisApi';
import {
  LayoutDashboard,
  Boxes,
  Activity,
  Code,
  Menu,
  X,
  FlaskConical,
} from 'lucide-react';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'GenesisCells', href: '/cells', icon: Boxes },
  { name: 'Runtime', href: '/runtime', icon: Activity },
  { name: 'VibeCode', href: '/vibecode', icon: Code },
  { name: 'Backend Test', href: '/backend-test', icon: FlaskConical },
];

export function DashboardLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const { data: metrics } = useQuery({
    queryKey: ['runtime-metrics'],
    queryFn: fetchRuntimeMetrics,
    refetchInterval: 30000, // Refresh every 30s
  });

  return (
    <div className="min-h-screen bg-background dark">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden p-2 rounded-md hover:bg-accent"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
            
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">G</span>
              </div>
              <div>
                <h1 className="text-sm font-semibold">GenesisCore</h1>
                <p className="text-xs text-muted-foreground">Observatory</p>
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <StatusIndicator
              status={metrics?.status || 'offline'}
              label={metrics?.status === 'online' ? 'Runtime Online' : 'Offline'}
            />
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b bg-card p-4">
          <nav className="flex flex-col gap-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === '/'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="container py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t py-4">
        <div className="container flex items-center justify-between text-xs text-muted-foreground">
          <span>GenesisCore Dashboard v1.0 — Read-only Observatory</span>
          <span>Phase 3 • Passive Memory</span>
        </div>
      </footer>
    </div>
  );
}
