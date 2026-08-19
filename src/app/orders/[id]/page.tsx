'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { money } from '@/lib/format';
import { BottomNav } from '@/components/BottomNav';
import Link from 'next/link';

type Order = {
  id: string | number;
  nomor_meja: string;
  status: string;
  total_harga: number;
  metode_bayar: string;
  payment_status: string;
  created_at: string;
  tenant: { nama_tenant: string };
  items: { qty: number; subtotal: number; menu_item: { nama_menu: string } }[];
};

export default function OrderTrackPage() {
  const { id } = useParams<{ id: string }>();
  const [o, setO] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Coba ambil data order dari cache localStorage dulu
    const cached = localStorage.getItem(`zcorner_order_${id}`);
    if (cached) {
      try { setO(JSON.parse(cached)); setLoading(false); } catch {}
    }
    // Tetap fetch dari API untuk data terbaru
    fetch(`/api/orders/${id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setO(data);
          localStorage.setItem(`zcorner_order_${id}`, JSON.stringify(data));
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <main className="mx-auto min-h-screen max-w-lg flex flex-col items-center justify-center gap-4">
      <div className="text-5xl animate-bounce">⏳</div>
      <p className="text-slate-400 font-medium">Memuat pesanan...</p>
    </main>
  );

  // Gunakan data dari localStorage jika API tidak punya detail lengkap
  const cachedFull = (() => {
    try { return JSON.parse(localStorage.getItem('zcorner_last_order_data') || '{}'); } catch { return {}; }
  })();
  const tenantName = o?.tenant?.nama_tenant || cachedFull.tenant_name || 'Tenant';
  const meja = o?.nomor_meja || cachedFull.nomor_meja || '-';
  const total = o?.total_harga || cachedFull.total_harga || 0;
  const items: { qty: number; subtotal: number; menu_item: { nama_menu: string } }[] =
    (o?.items?.length ? o.items : cachedFull.items) || [];
  const createdAt = o?.created_at || cachedFull.created_at || new Date().toISOString();

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-slate-50 pb-28">
      {/* ── Hero ─────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-go-500 to-go-700 px-5 pb-10 pt-12 text-center relative overflow-hidden">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -left-4 bottom-0 h-20 w-20 rounded-full bg-white/10" />

        {/* Animated check */}
        <div className="relative z-10 mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-4xl shadow-glow">
          ✅
        </div>
        <h1 className="relative z-10 text-2xl font-extrabold text-white">Pesanan Diterima!</h1>
        <p className="relative z-10 mt-1 text-sm text-emerald-100">
          {tenantName} · <strong className="text-white">Meja {meja}</strong>
        </p>
        <div className="relative z-10 mt-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold text-white">
          <span className="h-2 w-2 rounded-full bg-green-300 animate-pulse" />
          Pesanan masuk ke dapur
        </div>
      </div>

      <div className="px-4 pt-5 space-y-4">
        {/* ── Status Card ──────────────────────────── */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-go-100 text-xl">
              📋
            </div>
            <div>
              <p className="font-extrabold text-slate-800">Status Pesanan</p>
              <p className="text-xs text-slate-400">ID: #{String(id)}</p>
            </div>
            <span className="ml-auto rounded-full bg-go-100 px-3 py-1 text-xs font-bold text-go-700">
              ✅ Diterima
            </span>
          </div>

          {/* Info baris */}
          <div className="space-y-2.5 border-t border-slate-100 pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">🪑 Nomor Meja</span>
              <span className="font-bold">{meja}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">🏪 Tenant</span>
              <span className="font-bold">{tenantName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">💳 Pembayaran</span>
              <span className="font-bold">COD — Bayar saat diantar</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">🕐 Waktu Pesan</span>
              <span className="font-bold text-xs">{new Date(createdAt).toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        {/* ── Instruksi ────────────────────────────── */}
        <div className="rounded-3xl bg-amber-50 border border-amber-100 p-4">
          <p className="text-sm font-bold text-amber-800 mb-1">ℹ️ Informasi Pembayaran</p>
          <p className="text-xs text-amber-700 leading-relaxed">
            Pesanan Anda telah diterima. Silakan tunggu di <strong>Meja {meja}</strong>.
            Makanan akan diantarkan dan pembayaran dilakukan langsung ke pelayan saat makanan tiba.
          </p>
        </div>

        {/* ── Detail Item ──────────────────────────── */}
        {items.length > 0 && (
          <div className="card p-4">
            <h2 className="font-bold text-slate-800 mb-3">Detail Pesanan</h2>
            <div className="space-y-2">
              {items.map((it, i) => (
                <div key={i} className="flex justify-between text-sm text-slate-600">
                  <span>{it.qty}× {it.menu_item.nama_menu}</span>
                  <span className="font-medium">{money(it.subtotal)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-100 mt-3 pt-3 flex justify-between font-extrabold">
              <span>Total</span>
              <span className="text-go-600 text-lg">{money(total)}</span>
            </div>
          </div>
        )}

        {/* ── Actions ──────────────────────────────── */}
        <div className="flex gap-3">
          <Link href="/" className="btn-ghost flex-1 text-center">
            🏠 Kembali ke Home
          </Link>
          <Link href="/" className="btn flex-1 text-center">
            🛒 Pesan Lagi
          </Link>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
