'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const links = [
  { href: '/admin',         icon: '📊', label: 'Dashboard' },
  { href: '/admin/menu',    icon: '🍽️', label: 'Kelola Menu' },
  { href: '/admin/reports', icon: '📈', label: 'Laporan' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  if (path === '/admin/login') return <>{children}</>;

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  return (
    <div className="min-h-screen bg-slate-100 md:flex">
      {/* ── Desktop Sidebar ─────────────────────────── */}
      <aside className="hidden md:flex md:w-64 shrink-0 flex-col bg-go-900 text-white">
        {/* Logo */}
        <div className="px-6 py-8 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 text-xl">
              🍽️
            </div>
            <div>
              <p className="text-xs text-emerald-300 font-semibold uppercase tracking-widest">Tenant Admin</p>
              <h1 className="text-lg font-extrabold">ZCORNER</h1>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {links.map((l) => {
            const active = path === l.href || (l.href !== '/admin' && path.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold transition-all duration-150 ${
                  active
                    ? 'bg-white/20 text-white shadow-inner'
                    : 'text-emerald-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="text-xl">{l.icon}</span>
                <span>{l.label}</span>
                {active && <span className="ml-auto h-2 w-2 rounded-full bg-go-300" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 pb-6 space-y-2">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm text-emerald-300 hover:bg-white/10 hover:text-white transition"
          >
            <span>🏠</span> Lihat App Customer
          </Link>
          <button
            onClick={logout}
            id="sidebar-logout-btn"
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-sm text-emerald-300 hover:bg-red-500/20 hover:text-red-300 transition"
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* ── Mobile Top Nav ──────────────────────────── */}
      <div className="flex-1 min-w-0">
        <div className="sticky top-0 z-30 flex items-center gap-2 overflow-x-auto border-b bg-white/95 backdrop-blur px-3 py-2.5 md:hidden shadow-sm scrollbar-none">
          <div className="flex items-center gap-2 mr-2 shrink-0">
            <span className="text-xl">🍽️</span>
            <span className="font-extrabold text-go-700">ZCORNER</span>
          </div>
          {links.map((l) => {
            const active = path === l.href || (l.href !== '/admin' && path.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold transition ${
                  active ? 'bg-go-500 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {l.icon} {l.label}
              </Link>
            );
          })}
          <button
            onClick={logout}
            className="ml-auto shrink-0 text-sm text-slate-500 hover:text-red-500 transition"
          >
            Logout
          </button>
        </div>

        {/* Page Content */}
        <div className="p-4 md:p-8">{children}</div>
      </div>
    </div>
  );
}
