'use client';
import { useEffect, useMemo, useState } from 'react';
import { money } from '@/lib/format';

type Order = {
  id: number | string; nomor_meja: string; status: string; total_harga: number;
  payment_status: string; created_at: string; metode_bayar: string;
  items: { qty: number; subtotal: number; menu_item: { nama_menu: string } }[];
};
type Rekap = { tenant: string; tanggal: string; modal: number; infak: number; zakat: number };
type Setoran = {
  tanggal: string; tenant: string; omset_harian: number; modal_harian: number;
  infak_harian: number; setoran_bersih: number; bulan: string; kode_bulan: string;
};

const today = new Date().toISOString().slice(0, 10);
const month = today.slice(0, 7);

export default function ReportsPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [bulan, setBulan] = useState(month);
  const [orders, setOrders] = useState<Order[]>([]);
  const [rekap, setRekap] = useState<Rekap[]>([]);
  const [setoran, setSetoran] = useState<Setoran[]>([]);
  const [form, setForm] = useState({ tanggal: today, modal: 0, infak: 0, zakat: 0 });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  async function load() {
    setLoading(true);
    const q = new URLSearchParams();
    if (from) q.set('from', from);
    if (to) q.set('to', to);
    const [ordersRes, rekapRes] = await Promise.all([
      fetch(`/api/admin/orders?${q}`),
      fetch(`/api/admin/rekap?bulan=${bulan}`),
    ]);
    if (ordersRes.ok) setOrders(await ordersRes.json());
    if (rekapRes.ok) {
      const data = await rekapRes.json();
      setRekap(data.rekap || []);
      setSetoran(data.setoran || []);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const summary = useMemo(() => {
    const total = orders.reduce((s, o) => s + o.total_harga, 0);
    const modal = setoran.reduce((s, r) => s + r.modal_harian, 0);
    const infak = setoran.reduce((s, r) => s + r.infak_harian, 0);
    const bersih = setoran.reduce((s, r) => s + r.setoran_bersih, 0);
    const topMap = new Map<string, number>();
    for (const o of orders) for (const it of o.items) topMap.set(it.menu_item.nama_menu, (topMap.get(it.menu_item.nama_menu) || 0) + it.qty);
    const top = Array.from(topMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return { total, modal, infak, bersih, count: orders.length, avg: orders.length ? total / orders.length : 0, top, topMax: top[0]?.[1] || 1 };
  }, [orders, setoran]);

  async function saveRekap(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    const res = await fetch('/api/admin/rekap', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, type: 'rekap' }),
    });
    setSaving(false);
    if (!res.ok) { setMsg(await res.text()); return; }
    setMsg('Rekap harian tersimpan. Setoran otomatis dihitung ulang di Apps Script.');
    load();
  }

  function exportCsv() {
    const rows = [['ID', 'Meja', 'Status', 'Total', 'Waktu', 'Item']];
    for (const o of orders) rows.push([String(o.id), o.nomor_meja, o.status, String(o.total_harga), new Date(o.created_at).toLocaleString('id-ID'), o.items.map((i) => `${i.qty}x ${i.menu_item.nama_menu}`).join('; ')]);
    const blob = new Blob([rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `laporan-zcorner-${from || 'all'}-${to || 'now'}.csv`;
    a.click();
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Laporan & Setoran</h1>
          <p className="text-sm text-slate-500 mt-0.5">Data sinkron dari Transaksi, RekapHarian, dan Setoran Google Sheets</p>
        </div>
        <span className="rounded-full bg-go-50 px-3 py-1.5 text-xs font-bold text-go-700">Google Sheets Sync</span>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[140px]"><label className="block text-xs font-bold text-slate-600 mb-1.5">Dari</label><input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} id="filter-from" /></div>
          <div className="flex-1 min-w-[140px]"><label className="block text-xs font-bold text-slate-600 mb-1.5">Sampai</label><input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} id="filter-to" /></div>
          <div className="flex-1 min-w-[140px]"><label className="block text-xs font-bold text-slate-600 mb-1.5">Bulan Rekap</label><input type="month" className="input" value={bulan} onChange={(e) => setBulan(e.target.value)} id="filter-month" /></div>
          <button className="btn" onClick={load} disabled={loading} id="filter-btn">{loading ? '⏳' : '🔍'} Filter</button>
          <button className="btn-ghost" onClick={exportCsv} id="export-csv-btn">Export CSV</button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-5 border-l-4 border-l-go-400"><p className="text-xs font-bold uppercase text-slate-400">Omzet</p><p className="text-2xl font-extrabold text-go-600">{money(summary.total)}</p></div>
        <div className="card p-5 border-l-4 border-l-blue-400"><p className="text-xs font-bold uppercase text-slate-400">Modal</p><p className="text-2xl font-extrabold text-blue-600">{money(summary.modal)}</p></div>
        <div className="card p-5 border-l-4 border-l-amber-400"><p className="text-xs font-bold uppercase text-slate-400">Infak</p><p className="text-2xl font-extrabold text-amber-600">{money(summary.infak)}</p></div>
        <div className="card p-5 border-l-4 border-l-emerald-400"><p className="text-xs font-bold uppercase text-slate-400">Setoran Bersih</p><p className="text-2xl font-extrabold text-emerald-600">{money(summary.bersih)}</p></div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px,1fr]">
        <form onSubmit={saveRekap} className="card p-5 space-y-3">
          <h2 className="font-extrabold text-slate-800">Input Rekap Harian</h2>
          <input type="date" className="input" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} id="rekap-tanggal" required />
          <input type="number" className="input" placeholder="Modal" value={form.modal || ''} onChange={(e) => setForm({ ...form, modal: Number(e.target.value) })} id="rekap-modal" min={0} />
          <input type="number" className="input" placeholder="Infak" value={form.infak || ''} onChange={(e) => setForm({ ...form, infak: Number(e.target.value) })} id="rekap-infak" min={0} />
          <input type="number" className="input" placeholder="Zakat" value={form.zakat || ''} onChange={(e) => setForm({ ...form, zakat: Number(e.target.value) })} id="rekap-zakat" min={0} />
          {msg && <p className={`text-sm font-semibold ${msg.startsWith('Rekap') ? 'text-go-600' : 'text-red-600'}`}>{msg}</p>}
          <button className="btn w-full" disabled={saving} id="save-rekap-btn">{saving ? 'Menyimpan...' : 'Simpan Rekap'}</button>
        </form>

        <div className="card overflow-hidden">
          <div className="border-b px-5 py-4"><h2 className="font-extrabold text-slate-800">Setoran Bulanan</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-400"><th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Omset</th><th className="px-4 py-3">Modal</th><th className="px-4 py-3">Infak</th><th className="px-4 py-3">Bersih</th></tr></thead>
              <tbody className="divide-y divide-slate-50">{setoran.map((r) => <tr key={`${r.tanggal}-${r.tenant}`} className="hover:bg-slate-50"><td className="px-4 py-3 font-semibold">{r.tanggal}</td><td className="px-4 py-3 text-go-600 font-bold">{money(r.omset_harian)}</td><td className="px-4 py-3">{money(r.modal_harian)}</td><td className="px-4 py-3">{money(r.infak_harian)}</td><td className="px-4 py-3 font-extrabold">{money(r.setoran_bersih)}</td></tr>)}</tbody>
            </table>
            {!setoran.length && <div className="py-12 text-center text-slate-400">Belum ada setoran bulan ini</div>}
          </div>
        </div>
      </div>

      {summary.top.length > 0 && <div className="card p-5"><h2 className="font-extrabold text-slate-800 mb-4">Menu Terlaris</h2><div className="space-y-3">{summary.top.map(([name, qty]) => <div key={name}><div className="flex justify-between text-sm mb-1"><span className="font-semibold">{name}</span><span className="font-bold">{qty} porsi</span></div><div className="h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-go-400" style={{ width: `${(qty / summary.topMax) * 100}%` }} /></div></div>)}</div></div>}

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b px-5 py-4"><h2 className="font-extrabold text-slate-800">Transaksi</h2><span className="text-xs text-slate-400">{orders.length} data</span></div>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-400"><th className="px-4 py-3">ID</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Item</th><th className="px-4 py-3">Waktu</th></tr></thead><tbody className="divide-y divide-slate-50">{orders.map((o) => <tr key={String(o.id)} className="hover:bg-slate-50"><td className="px-4 py-3 font-bold">#{o.id}</td><td className="px-4 py-3 font-bold text-go-600">{money(o.total_harga)}</td><td className="px-4 py-3 text-slate-500">{o.items.map((i) => `${i.qty}× ${i.menu_item.nama_menu}`).join(', ')}</td><td className="px-4 py-3 text-slate-400 whitespace-nowrap">{new Date(o.created_at).toLocaleString('id-ID')}</td></tr>)}</tbody></table>{!orders.length && <div className="py-12 text-center text-slate-400">Tidak ada transaksi</div>}</div>
      </div>
    </div>
  );
}
