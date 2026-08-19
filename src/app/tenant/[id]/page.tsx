'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { addItem, getCart } from '@/lib/cart';
import { money } from '@/lib/format';
import { BottomNav } from '@/components/BottomNav';

type Menu = { id: number; nama_menu: string; kategori: string; harga: number; foto_menu: string; stok: number };
type Tenant = { id: number; nama_tenant: string; foto_banner: string; deskripsi: string; jam_buka: string; kategori: string; status: string; menu_items: Menu[] };

export default function TenantMenuPage() {
  const { id } = useParams<{ id: string }>();
  const [t, setT] = useState<Tenant | null>(null);
  const [activeCat, setActiveCat] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [addedId, setAddedId] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/tenants/${id}/menu`).then((r) => r.json()).then((data) => {
      setT(data);
      if (data?.menu_items?.length) setActiveCat(data.menu_items[0].kategori);
    });
  }, [id]);

  useEffect(() => {
    const update = () => {
      const c = getCart();
      setCartCount(c?.items.reduce((s, i) => s + i.qty, 0) ?? 0);
    };
    update();
    window.addEventListener('cart', update);
    return () => window.removeEventListener('cart', update);
  }, []);

  const groups = useMemo(() => {
    const m = new Map<string, Menu[]>();
    for (const it of t?.menu_items || []) {
      if (!m.has(it.kategori)) m.set(it.kategori, []);
      m.get(it.kategori)!.push(it);
    }
    return Array.from(m.entries());
  }, [t]);

  const categories = useMemo(() => groups.map(([cat]) => cat), [groups]);

  function handleAdd(menu: Menu) {
    if (!t) return;
    addItem(t.id, t.nama_tenant, {
      menu_item_id: menu.id,
      nama_menu: menu.nama_menu,
      harga: menu.harga,
      foto_menu: menu.foto_menu,
    });
    setAddedId(menu.id);
    setTimeout(() => setAddedId(null), 1200);
  }

  if (!t) return (
    <main className="mx-auto min-h-screen max-w-lg">
      <div className="h-48 bg-slate-200 animate-pulse" />
      <div className="p-4 space-y-4">
        {[1,2,3].map(i => <div key={i} className="card p-3 flex gap-3 animate-pulse">
          <div className="h-24 w-24 rounded-2xl bg-slate-200" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 w-3/4 rounded bg-slate-200" />
            <div className="h-3 w-1/2 rounded bg-slate-100" />
          </div>
        </div>)}
      </div>
    </main>
  );

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-slate-50 pb-28">
      {/* ── Banner ─────────────────────────────────── */}
      <div className="relative h-52">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={t.foto_banner || '/uploads/placeholder.png'} alt={t.nama_tenant} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Back button */}
        <Link
          href="/"
          className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow font-bold hover:bg-white transition"
        >
          ←
        </Link>

        {/* Cart button */}
        {cartCount > 0 && (
          <Link
            href="/cart"
            className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-sm font-bold text-go-700 shadow hover:bg-white transition"
          >
            🛒 <span>{cartCount}</span>
          </Link>
        )}

        {/* Tenant info */}
        <div className="absolute bottom-4 left-4 right-4">
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold mb-1.5 ${
            t.status === 'buka' ? 'bg-go-500 text-white' : 'bg-slate-700 text-white'
          }`}>
            {t.status === 'buka' ? '🟢 Buka' : '🔴 Tutup'}
          </span>
          <h1 className="text-2xl font-extrabold text-white">{t.nama_tenant}</h1>
          <p className="text-xs text-white/70 mt-0.5">{t.kategori} · ⏰ {t.jam_buka}</p>
        </div>
      </div>

      {/* ── Sticky Category Tabs ─────────────────── */}
      {categories.length > 1 && (
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-100 shadow-sm">
          <div className="flex gap-1 overflow-x-auto px-4 py-2 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCat(cat);
                  document.getElementById(`cat-${cat}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                  activeCat === cat
                    ? 'bg-go-500 text-white shadow-glow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Menu Groups ──────────────────────────── */}
      <div className="space-y-6 px-4 pt-4">
        {groups.map(([cat, items]) => (
          <section key={cat} id={`cat-${cat}`}>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase tracking-widest text-go-600">
              <span className="flex-1 border-b border-go-100 pb-2">{cat}</span>
            </h2>
            <div className="space-y-3">
              {items.map((m) => {
                const outOfStock = m.stok === 0;
                return (
                  <div
                    key={m.id}
                    className={`card flex gap-3 p-3 ${outOfStock ? 'opacity-60' : ''}`}
                    id={`menu-item-${m.id}`}
                  >
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl">
                      {m.foto_menu || t.foto_banner ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={m.foto_menu || t.foto_banner}
                          alt={m.nama_menu}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-go-50 text-2xl text-go-700">
                          🍽️
                        </div>
                      )}
                      {outOfStock && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
                          <span className="text-[10px] font-bold text-white">Habis</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-1">
                      <h3 className="font-bold leading-snug">{m.nama_menu}</h3>
                      <p className="text-xs text-slate-400">Stok: {m.stok}</p>
                      <div className="mt-auto flex items-center justify-between">
                        <span className="font-extrabold text-go-600">{money(m.harga)}</span>
                        <button
                          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-bold transition-all duration-200 ${
                            addedId === m.id
                              ? 'bg-go-600 text-white scale-95'
                              : outOfStock
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              : 'bg-go-500 text-white hover:bg-go-600 hover:-translate-y-0.5 shadow-glow-sm'
                          }`}
                          onClick={() => !outOfStock && handleAdd(m)}
                          disabled={outOfStock}
                          id={`add-to-cart-${m.id}`}
                        >
                          {addedId === m.id ? '✓ Ditambah' : '+ Tambah'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* ── Floating Cart Button ─────────────────── */}
      {cartCount > 0 && (
        <Link
          href="/cart"
          className="fixed bottom-20 left-1/2 z-30 w-[min(92%,28rem)] -translate-x-1/2 btn shadow-glow animate-slide-up"
          id="floating-cart-btn"
        >
          <span>🛒</span>
          <span>Lihat Keranjang ({cartCount} item)</span>
        </Link>
      )}

      <BottomNav />
    </main>
  );
}
