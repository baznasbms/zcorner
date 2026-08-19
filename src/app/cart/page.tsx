'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cartTotal, getCart, setCart, addItem, type Cart } from '@/lib/cart';
import { money } from '@/lib/format';
import { BottomNav } from '@/components/BottomNav';
import Link from 'next/link';

export default function CartPage() {
  const [cart, setC] = useState<Cart | null>(null);
  const [meja, setMeja] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const tick = () => setC(getCart());
    tick();
    window.addEventListener('cart', tick);
    return () => window.removeEventListener('cart', tick);
  }, []);

  function changeQty(menu_item_id: number, delta: number) {
    if (!cart) return;
    const updated = {
      ...cart,
      items: cart.items
        .map((i) => i.menu_item_id === menu_item_id ? { ...i, qty: i.qty + delta } : i)
        .filter((i) => i.qty > 0),
    };
    if (!updated.items.length) setCart(null);
    else setCart(updated);
  }

  async function checkout() {
    setErr('');
    if (!customerName.trim()) { setErr('Nama pemesan wajib diisi'); return; }
    if (!meja.trim()) { setErr('Nomor meja wajib diisi'); return; }
    if (!cart || !cart.items.length) return;

    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_name: cart.tenant_name,
          customer_name: customerName,
          nomor_meja: meja,
          items: cart.items.map((i) => ({
            menu_item_id: i.menu_item_id,
            nama_menu: i.nama_menu,
            qty: i.qty,
            harga: i.harga,
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const orderId = data.orderId || data.id || ('ORD-' + Date.now());
        setCart(null);
        router.push(`/orders/${orderId}`);
      } else {
        const text = await res.text();
        setErr(text || 'Gagal membuat pesanan');
      }
    } catch (e: any) {
      console.error('Checkout error:', e);
      setErr(e.message || 'Gagal terhubung ke server');
    } finally {
      setLoading(false);
    }
  }

  if (!cart || !cart.items.length) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
        <div className="text-center space-y-3">
          <div className="text-5xl">🛒</div>
          <h1 className="text-xl font-bold text-slate-800">Keranjang Kosong</h1>
          <p className="text-slate-500 text-sm">Pilih menu favoritmu terlebih dahulu</p>
          <Link href="/" className="btn inline-block mt-4">
            Lihat Tenant
          </Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  const total = cartTotal(cart);

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* ── Top Bar ────────────────────────────── */}
      <header className="sticky top-0 bg-white/90 backdrop-blur border-b border-slate-100 z-30 px-4 py-3 flex items-center justify-between">
        <button onClick={() => router.back()} className="text-slate-600 font-semibold text-sm">
          ← Kembali
        </button>
        <h1 className="font-bold text-slate-800 text-base">Keranjang Pesanan</h1>
        <div className="w-12"></div>
      </header>

      <main className="p-4 space-y-4 max-w-lg mx-auto">
        {/* ── Tenant Info ───────────────────────── */}
        <div className="card p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Pesanan untuk Tenant</p>
            <p className="font-bold text-slate-800">{cart.tenant_name}</p>
          </div>
          <span className="badge badge-success">COD Meja</span>
        </div>

        {/* ── Items List ────────────────────────── */}
        <div className="card divide-y divide-slate-100">
          {cart.items.map((item) => (
            <div key={item.menu_item_id} className="p-4 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-800 text-sm truncate">{item.nama_menu}</h3>
                <p className="text-xs text-go-600 font-bold mt-0.5">{money(item.harga)}</p>
              </div>
              <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => changeQty(item.menu_item_id, -1)}
                  className="w-7 h-7 rounded bg-white font-bold text-slate-700 shadow-sm flex items-center justify-center active:scale-95"
                >
                  -
                </button>
                <span className="w-6 text-center font-bold text-slate-800 text-sm">{item.qty}</span>
                <button
                  onClick={() => changeQty(item.menu_item_id, 1)}
                  className="w-7 h-7 rounded bg-white font-bold text-slate-700 shadow-sm flex items-center justify-center active:scale-95"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ── Customer Name Input ──────────────── */}
        <div className="card p-4 space-y-2">
          <label className="block text-sm font-bold text-slate-700">
            Nama Pemesan <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className={`input w-full ${err && !customerName ? 'border-red-400 ring-2 ring-red-200' : ''}`}
            placeholder="Masukkan nama Anda"
            value={customerName}
            onChange={(e) => { setCustomerName(e.target.value); setErr(''); }}
          />
        </div>

        {/* ── Table Input ───────────────────────── */}
        <div className="card p-4 space-y-2">
          <label className="block text-sm font-bold text-slate-700">
            Nomor Meja <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className={`input w-full uppercase font-bold tracking-wider ${err && !meja ? 'border-red-400 ring-2 ring-red-200' : ''}`}
            placeholder="Contoh: A12, Meja 5, B-03"
            value={meja}
            onChange={(e) => { setMeja(e.target.value); setErr(''); }}
          />
          {err && <p className="text-sm text-red-600 font-medium mt-1">⚠️ {err}</p>}
        </div>

        {/* ── Order Summary ─────────────────────── */}
        <div className="card p-4 space-y-2">
          <h2 className="font-bold text-slate-800">Ringkasan Pesanan</h2>
          {cart.items.map((item) => (
            <div key={item.menu_item_id} className="flex justify-between text-sm text-slate-600">
              <span>{item.qty}× {item.nama_menu}</span>
              <span>{money(item.harga * item.qty)}</span>
            </div>
          ))}
          <div className="border-t border-slate-100 pt-2 flex justify-between font-extrabold text-lg">
            <span>Total</span>
            <span className="text-go-600">{money(total)}</span>
          </div>
        </div>

        {/* ── Checkout Button ──────────────────── */}
        <button
          id="checkout-btn"
          className="btn w-full text-base py-4"
          disabled={loading}
          onClick={checkout}
        >
          {loading ? 'Mengirim Pesanan...' : 'Pesan Sekarang (COD)'}
        </button>
      </main>

      <BottomNav />
    </div>
  );
}