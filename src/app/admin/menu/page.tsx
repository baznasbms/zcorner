'use client';
import { useEffect, useState, useRef } from 'react';
import { money } from '@/lib/format';

type Menu = {
  id: number; nama_menu: string; kategori: string; harga: number;
  foto_menu: string; stok: number; status_aktif: boolean;
};

const CATEGORIES = ['Makanan', 'Minuman', 'Snack', 'Dessert', 'Kopi', 'Pastry', 'Seafood', 'Vegetarian', 'Lainnya'];
const empty = { nama_menu: '', kategori: 'Makanan', harga: 0, stok: 10, foto_menu: '', status_aktif: true };

export default function AdminMenuPage() {
  const [items, setItems] = useState<Menu[]>([]);
  const [form, setForm] = useState<typeof empty & { id?: number }>({ ...empty });
  const [preview, setPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [delId, setDelId] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [filterCat, setFilterCat] = useState('Semua');
  const [successMsg, setSuccessMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const r = await fetch('/api/admin/menu');
    if (r.ok) setItems(await r.json());
  }

  useEffect(() => { load(); }, []);

  async function upload(file: File) {
    if (!file.type.startsWith('image/')) { alert('File harus berupa gambar'); return; }
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const r = await fetch('/api/upload', { method: 'POST', body: fd });
    setUploading(false);
    if (!r.ok) { alert(await r.text()); return; }
    const { url } = await r.json();
    setForm((f) => ({ ...f, foto_menu: url }));
    setPreview(url);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const method = form.id ? 'PUT' : 'POST';
    await fetch('/api/admin/menu', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setForm({ ...empty });
    setPreview('');
    setSuccessMsg(form.id ? 'Menu berhasil diupdate!' : 'Menu berhasil ditambahkan!');
    setTimeout(() => setSuccessMsg(''), 3000);
    load();
  }

  async function del(id: number) {
    if (!confirm('Hapus menu ini?')) return;
    setDelId(id);
    await fetch(`/api/admin/menu?id=${id}`, { method: 'DELETE' });
    setDelId(null);
    load();
  }

  function editItem(m: Menu) {
    setForm(m);
    setPreview(m.foto_menu);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function reset() {
    setForm({ ...empty });
    setPreview('');
  }

  const usedCategories = ['Semua', ...Array.from(new Set(items.map((i) => i.kategori)))];
  const filtered = filterCat === 'Semua' ? items : items.filter((i) => i.kategori === filterCat);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Kelola Menu</h1>
          <p className="text-sm text-slate-500 mt-0.5">{items.length} item menu · {items.filter(i => i.status_aktif).length} aktif</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px,1fr]">
        {/* ── Form Panel ──────────────────────────── */}
        <div className="space-y-4">
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-slate-800">{form.id ? '✏️ Edit Menu' : '➕ Tambah Menu Baru'}</h2>
              {form.id && (
                <button onClick={reset} className="text-xs text-slate-400 hover:text-slate-600">
                  Batal edit
                </button>
              )}
            </div>

            {successMsg && (
              <div className="rounded-2xl bg-go-50 border border-go-200 p-3 text-sm text-go-700 font-semibold text-center animate-slide-up">
                ✅ {successMsg}
              </div>
            )}

            <form onSubmit={save} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Nama Menu *</label>
                <input
                  id="menu-nama"
                  className="input"
                  placeholder="Contoh: Nasi Goreng Spesial"
                  value={form.nama_menu}
                  onChange={(e) => setForm({ ...form, nama_menu: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Kategori</label>
                <select
                  className="input"
                  value={form.kategori}
                  onChange={(e) => setForm({ ...form, kategori: e.target.value })}
                  id="menu-kategori"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Harga (Rp) *</label>
                  <input
                    id="menu-harga"
                    className="input"
                    type="number"
                    placeholder="0"
                    value={form.harga || ''}
                    onChange={(e) => setForm({ ...form, harga: Number(e.target.value) })}
                    required
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Stok</label>
                  <input
                    id="menu-stok"
                    className="input"
                    type="number"
                    placeholder="0"
                    value={form.stok || ''}
                    onChange={(e) => setForm({ ...form, stok: Number(e.target.value) })}
                    min={0}
                  />
                </div>
              </div>

              {/* ── Upload Zone ─────────────────── */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Foto Menu</label>
                <div
                  className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-200 ${
                    isDragging
                      ? 'border-go-400 bg-go-50 scale-[1.02]'
                      : 'border-slate-200 bg-slate-50 hover:border-go-300 hover:bg-go-50/50'
                  }`}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const f = e.dataTransfer.files?.[0];
                    if (f) upload(f);
                  }}
                >
                  {uploading ? (
                    <><span className="text-2xl animate-spin">⏳</span><p className="mt-2 text-sm text-go-600 font-semibold">Mengupload foto...</p></>
                  ) : (
                    <>
                      <span className="text-3xl">📷</span>
                      <p className="mt-2 text-sm font-semibold text-slate-600">Drag & drop foto di sini</p>
                      <p className="text-xs text-slate-400">atau klik untuk pilih file (JPG, PNG, WEBP)</p>
                    </>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="menu-foto-input"
                    onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
                  />
                </div>

                {(preview || form.foto_menu) && (
                  <div className="relative mt-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview || form.foto_menu}
                      alt="Preview"
                      className="h-40 w-full rounded-2xl object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => { setPreview(''); setForm((f) => ({ ...f, foto_menu: '' })); }}
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white text-xs hover:bg-black/70"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* ── Status Toggle ───────────────── */}
              <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 hover:bg-slate-50">
                <div>
                  <p className="font-semibold text-sm">Status Menu</p>
                  <p className="text-xs text-slate-400">{form.status_aktif ? 'Tampil di halaman pelanggan' : 'Disembunyikan dari pelanggan'}</p>
                </div>
                <div className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${form.status_aktif ? 'bg-go-500' : 'bg-slate-300'}`}
                  onClick={() => setForm({ ...form, status_aktif: !form.status_aktif })}>
                  <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${form.status_aktif ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
              </label>

              <button
                id="save-menu-btn"
                type="submit"
                className="btn w-full"
                disabled={saving}
              >
                {saving ? '⏳ Menyimpan...' : form.id ? '💾 Update Menu' : '➕ Tambah Menu'}
              </button>
            </form>
          </div>
        </div>

        {/* ── Menu List ─────────────────────────── */}
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex gap-2 flex-wrap">
            {usedCategories.map((c) => (
              <button
                key={c}
                onClick={() => setFilterCat(c)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                  filterCat === c
                    ? 'bg-go-500 text-white shadow-glow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-go-300'
                }`}
              >
                {c} {c !== 'Semua' && `(${items.filter(i => i.kategori === c).length})`}
              </button>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="card py-16 text-center text-slate-400">
              <p className="text-3xl mb-2">🍽️</p>
              <p className="font-medium">Belum ada menu di kategori ini</p>
            </div>
          )}

          <div className="space-y-3">
            {filtered.map((m) => (
              <div key={m.id} className={`card flex gap-3 p-3 transition-all ${!m.status_aktif ? 'opacity-60' : ''}`} id={`menu-row-${m.id}`}>
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.foto_menu || '/uploads/placeholder.png'}
                    alt={m.nama_menu}
                    className="h-full w-full object-cover bg-slate-100"
                  />
                  {!m.status_aktif && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40">
                      <span className="text-[9px] font-bold text-white bg-slate-700/80 px-1.5 py-0.5 rounded">nonaktif</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 justify-between">
                    <p className="font-bold text-slate-800 leading-snug">{m.nama_menu}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${m.status_aktif ? 'bg-go-100 text-go-700' : 'bg-slate-100 text-slate-500'}`}>
                      {m.status_aktif ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{m.kategori} · Stok: {m.stok}</p>
                  <p className="text-sm font-extrabold text-go-600 mt-1">{money(m.harga)}</p>
                  <div className="mt-2 flex gap-2">
                    <button
                      className="btn-ghost text-xs !py-1.5 !px-3"
                      onClick={() => editItem(m)}
                      id={`edit-menu-${m.id}`}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="btn-ghost text-xs !py-1.5 !px-3 text-red-500 border-red-100 hover:bg-red-50"
                      onClick={() => del(m.id)}
                      disabled={delId === m.id}
                      id={`delete-menu-${m.id}`}
                    >
                      {delId === m.id ? '⏳' : '🗑️'} Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
