'use client';
import { useEffect, useState } from 'react';
import { money } from '@/lib/format';
import Link from 'next/link';

type Tenant = {
  id: number; nama_tenant: string; status: string; kategori: string;
  jam_buka: string; omzet: number;
  _count: { orders: number; menu_items: number };
};
type Summary = {
  total_tenant: number; total_pesanan: number; total_omzet: number;
  tenants: Tenant[];
};
type RekapBulanan = { no: number; bulan: string; omset: number; modal: number; infak: number; perolehan: number };

export default function SuperPage() {
  const [s, setS] = useState<Summary | null>(null);
  const [rekap, setRekap] = useState<RekapBulanan[]>([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    Promise.all([fetch('/api/super/summary'), fetch('/api/super/rekap-bulanan')]).then(async ([summaryRes, rekapRes]) => {
      if (!summaryRes.ok) { setErr('Butuh akses super admin'); return; }
      setS(await summaryRes.json());
      if (rekapRes.ok) setRekap(await rekapRes.json());
    });
  }, []);

  if (err) return (
    <main className="min-h-screen bg-hero-gradient flex items-center justify-center p-8">
      <div className="text-center text-white">
        <span className="text-5xl">🔒</span>
        <h1 className="mt-4 text-2xl font-extrabold">Akses Super Admin</h1>
        <p className="mt-2 text-emerald-200">{err}</p>
        <Link href="/admin/login" className="btn mt-6 bg-white text-go-800 hover:bg-slate-100">Login Sekarang</Link>
      </div>
    </main>
  );

  if (!s) return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl animate-spin">⏳</div>
        <p className="mt-4 text-slate-400 font-medium">Memuat data platform...</p>
      </div>
    </main>
  );

  const topTenant = [...s.tenants].sort((a, b) => b.omzet - a.omzet)[0];
  const latestRekap = rekap[rekap.length - 1];

  return (
    <main className="min-h-screen bg-slate-50">
      {/* ── Header ──────────────────────────────── */}
      <header className="bg-hero-gradient px-6 pb-10 pt-12 text-white relative overflow-hidden">
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -left-8 bottom-0 h-32 w-32 rounded-full bg-white/5" />
        <div className="relative mx-auto max-w-5xl flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-300">👑 Super Admin</p>
            <h1 className="text-3xl font-extrabold mt-1">Dashboard Platform</h1>
            <p className="text-emerald-200 text-sm mt-1">Monitoring seluruh ekosistem ZCORNER</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/login" className="btn-ghost !text-slate-700 text-sm">Ganti Akun</Link>
            <Link href="/" className="btn-ghost !text-slate-700 text-sm">🏠 Customer App</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8 space-y-8">
        {/* ── Platform Stats ──────────────────── */}
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="card p-6 border-l-4 border-l-go-400">
            <p className="text-xs font-bold uppercase text-slate-400 tracking-wide">Total Tenant</p>
            <p className="text-4xl font-extrabold text-go-600 mt-1">{s.total_tenant}</p>
            <p className="text-xs text-slate-400 mt-2">Tenant terdaftar di platform</p>
          </div>
          <div className="card p-6 border-l-4 border-l-blue-400">
            <p className="text-xs font-bold uppercase text-slate-400 tracking-wide">Total Pesanan</p>
            <p className="text-4xl font-extrabold text-blue-600 mt-1">{s.total_pesanan}</p>
            <p className="text-xs text-slate-400 mt-2">Semua transaksi platform</p>
          </div>
          <div className="card p-6 border-l-4 border-l-amber-400">
            <p className="text-xs font-bold uppercase text-slate-400 tracking-wide">Omzet Platform</p>
            <p className="text-2xl font-extrabold text-amber-600 mt-1">{money(s.total_omzet)}</p>
            <p className="text-xs text-slate-400 mt-2">Gabungan semua tenant</p>
          </div>
          <div className="card p-6 border-l-4 border-l-emerald-400">
            <p className="text-xs font-bold uppercase text-slate-400 tracking-wide">Perolehan Bulan Ini</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">{money(latestRekap?.perolehan ?? 0)}</p>
            <p className="text-xs text-slate-400 mt-2">Dari Rekap Bulanan</p>
          </div>
        </div>

        {/* ── Top Performer ───────────────────── */}
        {topTenant && (
          <div className="card p-5 flex items-center gap-4 border border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50">
            <span className="text-4xl shrink-0">🏆</span>
            <div>
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wide">Tenant Terbaik</p>
              <p className="text-xl font-extrabold text-slate-800">{topTenant.nama_tenant}</p>
              <p className="text-sm text-slate-500 mt-0.5">
                {money(topTenant.omzet)} omzet · {topTenant._count.orders} pesanan
              </p>
            </div>
          </div>
        )}

        {rekap.length > 0 && (
          <div className="card overflow-hidden">
            <div className="border-b px-6 py-5 flex items-center justify-between">
              <h2 className="font-extrabold text-slate-800 text-lg">Rekap Bulanan</h2>
              <span className="text-xs bg-go-50 text-go-700 rounded-full px-3 py-1 font-semibold">Google Sheets</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-400 tracking-wide">
                    <th className="px-5 py-3">Bulan</th>
                    <th className="px-5 py-3">Omset</th>
                    <th className="px-5 py-3">Modal</th>
                    <th className="px-5 py-3">Infak</th>
                    <th className="px-5 py-3">Perolehan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {rekap.map((r) => (
                    <tr key={`${r.no}-${r.bulan}`} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 font-bold text-slate-800">{r.bulan}</td>
                      <td className="px-5 py-4 text-go-600 font-bold">{money(r.omset)}</td>
                      <td className="px-5 py-4">{money(r.modal)}</td>
                      <td className="px-5 py-4">{money(r.infak)}</td>
                      <td className="px-5 py-4 font-extrabold text-emerald-600">{money(r.perolehan)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Tenant Performance Table ─────── */}
        <div className="card overflow-hidden">
          <div className="border-b px-6 py-5 flex items-center justify-between">
            <h2 className="font-extrabold text-slate-800 text-lg">Performa Semua Tenant</h2>
            <span className="text-xs bg-slate-100 text-slate-500 rounded-full px-3 py-1 font-semibold">
              {s.tenants.length} tenant
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-400 tracking-wide">
                  <th className="px-5 py-3">#</th>
                  <th className="px-5 py-3">Nama Tenant</th>
                  <th className="px-5 py-3">Kategori</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Menu</th>
                  <th className="px-5 py-3">Pesanan</th>
                  <th className="px-5 py-3">Omzet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[...s.tenants]
                  .sort((a, b) => b.omzet - a.omzet)
                  .map((t, i) => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="text-slate-400">{i + 1}</span>}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-800">{t.nama_tenant}</p>
                        <p className="text-xs text-slate-400 mt-0.5">⏰ {t.jam_buka}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {t.kategori}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          t.status === 'buka'
                            ? 'bg-go-100 text-go-700'
                            : 'bg-red-100 text-red-600'
                        }`}>
                          {t.status === 'buka' ? '🟢 Buka' : '🔴 Tutup'}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-semibold">{t._count.menu_items}</td>
                      <td className="px-5 py-4 font-semibold">{t._count.orders}</td>
                      <td className="px-5 py-4 font-extrabold text-go-600">{money(t.omzet)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
