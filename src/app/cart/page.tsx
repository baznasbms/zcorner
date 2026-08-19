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
  const [customerName, setCustomerName] = useState(''); // New state for customer name
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
    if (!meja.trim()) { setErr('Nomor meja wajib diisi'); return; }
    if (!customerName.trim()) { setErr('Nama pembeli wajib diisi'); return; } // New validation
    if (!cart?.items.length) { setErr('Keranjang kosong'); return; }
    setLoading(true);

    const total = cartTotal(cart);
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'createOrder', // New: specify action for Apps Script
        customer_name: customerName.trim(), // New: send customer name
        tenant_id: cart.tenant_id,
        tenant_name: cart.tenant_name,
        nomor_meja: meja.trim(),
        total_harga: total,
        items: cart.items.map((i) => ({
          nama_menu: i.nama_menu,
          harga: i.harga,
          qty: i.qty,
          total: i.harga * i.qty, // Ensure total is sent per item
        })),
      }),
    });

    setLoading(false);
    if (!res.ok) { setErr(await res.text()); return; }
    const o = await res.json();
    const orderId = String(o.id || o.orderId);

    // Cache data order lengkap di localStorage agar halaman tracking bisa baca
    localStorage.setItem('zcorner_last_order', orderId);
    localStorage.setItem('zcorner_last_order_data', JSON.stringify({
      id: orderId,
      tenant_name: cart.tenant_name,
      nomor_meja: meja.trim(),
      total_harga: total,
      created_at: new Date().toISOString(),
      items: cart.items.map((i) => ({
        qty: i.qty,
        subtotal: i.harga * i.qty,
        menu_item: { nama_menu: i.nama_menu },
      })),
    }));
    localStorage.setItem(`zcorner_order_${orderId}`, JSON.stringify({
      id: orderId,
      nomor_meja: meja.trim(),
      status: 'diterima',
      total_harga: total,
      metode_bayar: 'COD',
      payment_status: 'belum_lunas',
      created_at: new Date().toISOString(),
      tenant: { nama_tenant: cart.tenant_name },
      items: cart.items.map((i) => ({
        qty: i.qty,
        subtotal: i.harga * i.qty,
        menu_item: { nama_menu: i.nama_menu },
      })),
    }));

    setCart(null);
    router.push(`/orders/${orderId}`);
  }

  if (!cart?.items.length) {
    return (
      <main className="mx-auto max-w-lg min-h-screen flex flex-col items-center justify-center pb-24 px-6 text-center">
        <div className="text-7xl mb-4">🛒</div>
        <h1 className="text-2xl font-extrabold text-slate-800">Keranjang masih kosong</h1>
        <p className="mt-2 text-slate-500">Yuk pilih menu dari tenant favoritmu!</p>
        <Link href="/" className="btn mt-6">Browse Tenant</Link>
        <BottomNav />
      </main>
    );
  }

  const total = cartTotal(cart);

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-slate-50 pb-28">
      {/* ── Header ─────────────────────────────────── */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 py-4 flex items-center gap-3 shadow-sm">
        <Link href="/" className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition">
          ←
        </Link>
        <div>
          <h1 className="text-lg font-extrabold">Keranjang</h1>
          <p className="text-xs text-slate-500">{cart.tenant_name}</p>
        </div>
      </header>

      <div className="px-4 pt-5 space-y-4">
        {/* ── Item List ───────────────────────────── */}
        <div className="space-y-3">
          {cart.items.map((item) => (
            <div key={item.menu_item_id} className="card flex items-center gap-3 p-3 animate-fade-in">
              {item.foto_menu ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.foto_menu} alt={item.nama_menu} className="h-16 w-16 rounded-2xl object-cover shrink-0" />
              ) : (
                <div className="h-16 w-16 rounded-2xl bg-go-50 flex items-center justify-center text-2xl shrink-0">🍽️</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm leading-snug truncate">{item.nama_menu}</p>
                <p className="text-xs text-slate-400 mt-0.5">{money(item.harga)} / porsi</p>
                <p className="text-sm font-bold text-go-600 mt-0.5">{money(item.harga * item.qty)}</p>
              </div>
              {/* Qty Stepper */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => changeQty(item.menu_item_id, -1)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition"
                  id={`qty-minus-${item.menu_item_id}`}
                >
                  −
                </button>
                <span className="w-5 text-center font-bold">{item.qty}</span>
                <button
                  onClick={() => changeQty(item.menu_item_id, 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-go-500 text-white font-bold hover:bg-go-600 transition"
                  id={`qty-plus-${item.menu_item_id}`}
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ── COD Banner ──────────────────────────── */}
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-4 flex gap-3">
          <span className="text-2xl shrink-0">💵</span>
          <div>
            <p className="font-bold text-amber-900 text-sm">Bayar di Tempat (COD)</p>
            <p className="text-xs text-amber-700 mt-0.5">Pembayaran dilakukan ke pelayan/kasir saat makanan diantar ke meja. Tidak ada pembayaran online.</p>
          </div>
        </div>

        {/* ── Nama Pembeli ──────────────────────────── */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">👤</span>
            <label htmlFor="customer-name" className="font-bold text-slate-800">Nama Pembeli <span className="text-red-500">*</span></label>
          </div>
          <input
            id="customer-name"
            className={`input text-lg font-bold tracking-wider ${err && !customerName ? 'border-red-400 ring-2 ring-red-200' : ''}`}
            placeholder="Contoh: Budi, Meja 12A"
            value={customerName}
            onChange={(e) => { setCustomerName(e.target.value); setErr(''); }}
          />
          {err && !customerName && <p className="text-sm text-red-600 font-medium">⚠️ {err}</p>}
        </div>

        {/* ── Nomor Meja ──────────────────────────── */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🪑</span>
            <label htmlFor="nomor-meja" className="font-bold text-slate-800">Nomor Meja <span className="text-red-500">*</span></label>
          </div>
          <input
            id="nomor-meja"
            className={`input text-lg font-bold tracking-wider ${err && !meja ? 'border-red-400 ring-2 ring-red-200' : ''}`}
            placeholder="Contoh: A12, Meja 5, B-03"
            value={meja}
            onChange={(e) => { setMeja(e.target.value); setErr(''); }}
          />
          {err && !meja && <p className="text-sm text-red-600 font-medium">⚠️ {err}</p>}
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
          {loading ? (
            <><span className="animate-spin">⏳</span> Mengirim pesanan...</>
          ) : (
            <>🛒 Pesan Sekarang · {money(total)}</>
          )}
        </button>
      </div>

      <BottomNav />
    </main>
  );
}
