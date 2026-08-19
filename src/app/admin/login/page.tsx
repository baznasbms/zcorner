'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('admin@nusantara.id');
  const [password, setPassword] = useState('admin123');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) { setErr(await res.text()); return; }
    const payload = await res.json();
    const role = payload?.user?.role ?? payload?.role;
    router.push(role === 'super_admin' ? '/super' : '/admin');
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-go-900 via-go-800 to-go-600 flex items-center justify-center p-6">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/5" />
        <div className="absolute -right-10 -bottom-20 h-96 w-96 rounded-full bg-white/5" />
        <div className="absolute left-1/2 top-1/3 h-32 w-32 rounded-full bg-white/5" />
      </div>

      <div className="relative w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-white/20 text-3xl mb-4 backdrop-blur">
            🍽️
          </div>
          <h1 className="text-3xl font-extrabold text-white">ZCORNER</h1>
          <p className="text-emerald-200 text-sm mt-1">Panel Admin · Food Court Digital</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl bg-white/95 backdrop-blur p-8 shadow-glow">
          <h2 className="text-xl font-extrabold text-slate-800 mb-1">Masuk ke Dashboard</h2>
          <p className="text-sm text-slate-500 mb-6">Admin tenant atau super admin</p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
              <input
                id="login-email"
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@tenant.id"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
              <input
                id="login-password"
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {err && (
              <div className="rounded-2xl bg-red-50 border border-red-200 p-3 text-sm text-red-700 font-medium">
                ⚠️ {err}
              </div>
            )}

            <button
              id="login-btn"
              type="submit"
              className="btn w-full py-3.5 text-base"
              disabled={loading}
            >
              {loading ? '⏳ Masuk...' : 'Masuk ke Dashboard'}
            </button>
          </form>

          <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-100 p-4 text-xs text-slate-500 space-y-1">
            <p className="font-bold text-slate-600 mb-2">Akun Demo:</p>
            <p>🍛 admin@nusantara.id — Admin Nusantara Bowl</p>
            <p>☕ admin@kopisenja.id — Admin Kopi Senja</p>
            <p>👑 super@zcorner.id — Super Admin Platform</p>
            <p className="text-slate-400 mt-1">Password semua: <code className="bg-white px-1 rounded">admin123</code></p>
          </div>
        </div>
      </div>
    </main>
  );
}
