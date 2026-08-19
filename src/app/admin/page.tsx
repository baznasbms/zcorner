'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { money } from '@/lib/format';

type Order = {
  rowIdx: number;
  orderId: string;
  order_id: string;
  created_at: string;
  customer_name: string;
  table_number: string;
  items: { nama_menu: string; qty: number; subtotal: number }[];
  total: number;
};

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/pending-orders');
      if (res.status === 401) router.push('/login');
      else if (res.ok) setOrders(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function confirmOrder(rowIdx: number, action: 'APPROVE' | 'REJECT') {
    const res = await fetch('/api/admin/pending-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rowIdx, statusAction: action }),
    });
    if (res.ok) fetchOrders();
    else alert('Gagal memproses pesanan');
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 pb-24 max-w-lg mx-auto">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-slate-800">Dashboard Admin</h1>
        <button onClick={fetchOrders} className="text-sm font-bold text-go-600">Refresh</button>
      </header>

      {loading ? (
        <p className="text-center text-slate-500">Memuat pesanan...</p>
      ) : orders.length === 0 ? (
        <div className="text-center py-10 text-slate-400">Tidak ada pesanan masuk</div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.orderId} className="card p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{o.customer_name} • Meja {o.table_number}</p>
                  <p className="text-sm font-bold text-slate-800">{o.orderId}</p>
                </div>
                <p className="font-extrabold text-go-600 text-lg">{money(o.total)}</p>
              </div>

              <div className="text-sm text-slate-600 border-t border-slate-100 pt-2">
                {o.items.map((item, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{item.qty}× {item.nama_menu}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => confirmOrder(o.rowIdx, 'REJECT')}
                  className="flex-1 py-2 rounded-xl bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100 transition"
                >
                  Tolak
                </button>
                <button
                  onClick={() => confirmOrder(o.rowIdx, 'APPROVE')}
                  className="flex-1 py-2 rounded-xl bg-go-500 text-white font-bold text-sm hover:bg-go-600 transition"
                >
                  Setujui
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
