'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BottomNav } from '@/components/BottomNav';
import { getCart } from '@/lib/cart';

type Tenant = {
  id: number; nama_tenant: string; deskripsi: string; foto_banner: string;
  jam_buka: string; status: string; rating: number; kategori: string;
  _count?: { menu_items: number };
};

export default function HomePage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('Semua');
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/tenants').then((r) => r.json()).then((data) => {
      setTenants(data);
      setLoading(false);
    });
    const updateCart = () => {
      const c = getCart();
      setCartCount(c?.items.reduce((s, i) => s + i.qty, 0) ?? 0);
    };
    updateCart();
    window.addEventListener('cart', updateCart);
    return () => window.removeEventListener('cart', updateCart);
  }, []);

  const cats = useMemo(() => ['Semua', ...Array.from(new Set(tenants.map((t) => t.kategori)))], [tenants]);
  const list = tenants.filter((t) => {
    const okQ = !q || t.nama_tenant.toLowerCase().includes(q.toLowerCase()) || t.deskripsi.toLowerCase().includes(q.toLowerCase());
    const okC = cat === 'Semua' || t.kategori === cat;
    return okQ && okC;
  });

  return (
    <main className="mx-auto min-h-screen max-w-lg pb-28 bg-slate-50">
      {/* ── Hero Header ─────────────────────────────────── */}
      <header className="relative overflow-hidden bg-hero-gradient px-5 pb-10 pt-12 text-white">
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -right-4 top-12 h-28 w-28 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-32 w-full bg-gradient-to-t from-black/10 to-transparent" />

        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-200/80">🍽️ Food Court Digital</p>
            <h1 className="mt-1 text-4xl font-extrabold tracking-tight">ZCORNER</h1>
            <p className="mt-1 text-sm text-emerald-100">Pesan ke meja · Bayar di tempat (COD)</p>
          </div>
          {cartCount > 0 && (
            <Link href="/cart" className="relative shrink-0 rounded-2xl bg-white/20 backdrop-blur p-3 hover:bg-white/30 transition animate-bounce-in">
              <span className="text-xl">🛒</span>
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse-badge">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            </Link>
          )}
        </div>

        {/* Search */}
        <div className="relative mt-5">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            className="w-full rounded-2xl border-0 bg-white/95 py-3.5 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 shadow-lg focus:outline-none focus:ring-2 focus:ring-white/60 transition"
            placeholder="Cari tenant atau makanan..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            id="search-tenant"
          />
        </div>

        {/* Category Chips */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                cat === c
                  ? 'bg-white text-go-700 shadow-md'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </header>

      {/* ── Tenant List ──────────────────────────────────── */}
      <section className="space-y-4 px-4 pt-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide">
            {list.length} Tenant {cat !== 'Semua' ? `· ${cat}` : 'tersedia'}
          </h2>
        </div>

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-44 bg-slate-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 w-2/3 rounded bg-slate-200" />
                  <div className="h-3 w-full rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && list.map((t) => (
          <Link
            key={t.id}
            href={`/tenant/${t.id}`}
            className="card block group animate-fade-in"
            id={`tenant-card-${t.id}`}
          >
            <div className="relative h-44 bg-slate-200 overflow-hidden">
              {t.foto_banner ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={t.foto_banner}
                  alt={t.nama_tenant}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-go-50 text-5xl text-go-700">
                  🏪
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold shadow ${
                t.status === 'buka'
                  ? 'bg-go-500 text-white'
                  : 'bg-slate-700/90 text-white'
              }`}>
                {t.status === 'buka' ? '🟢 Buka' : '🔴 Tutup'}
              </span>
              <div className="absolute bottom-3 left-4">
                <p className="text-xs text-white/80">{t.kategori}</p>
                <h2 className="text-xl font-extrabold text-white drop-shadow-sm">{t.nama_tenant}</h2>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-slate-500 line-clamp-2 flex-1">{t.deskripsi}</p>
              </div>
              <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
                <span>⏰ {t.jam_buka}</span>
                <span>•</span>
                <span>🍽️ {t._count?.menu_items ?? 0} menu</span>
              </div>
            </div>
          </Link>
        ))}

        {!loading && !list.length && (
          <div className="py-20 text-center">
            <p className="text-4xl">🔍</p>
            <p className="mt-2 font-semibold text-slate-500">Tidak ada tenant yang ditemukan</p>
            <p className="text-sm text-slate-400">Coba ubah kata kunci atau kategori</p>
          </div>
        )}
      </section>

      <BottomNav />
    </main>
  );
}
