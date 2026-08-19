'use client';
import { useState } from 'react';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbyDChjat_7ZUHuDglXh2U4cSRg2p-Rv8Sob38ijZO3h0kNMlGG2p_WHCsA5Q_rKy5CX/exec';

export default function SetupGASPage() {
  const [testResult, setTestResult] = useState('');
  const [testing, setTesting] = useState(false);

  async function testConnection() {
    setTesting(true);
    setTestResult('');
    try {
      const r = await fetch('/api/setup/test-gas');
      const d = await r.json();
      setTestResult(d.success
        ? `✅ Koneksi berhasil! ${d.message || ''}`
        : `❌ Gagal: ${d.error || 'Unknown error'}`
      );
    } catch (e) {
      setTestResult(`❌ Error: ${e}`);
    }
    setTesting(false);
  }

  const steps = [
    {
      step: 1,
      title: 'Buka Apps Script Editor',
      desc: 'Pergi ke script.google.com → pilih project Z-CORNER BAZNAS Banyumas',
      icon: '🔗',
    },
    {
      step: 2,
      title: 'Buat file baru: zcorner_api.gs',
      desc: 'Klik tombol "+ File" → pilih "Script" → beri nama "zcorner_api"',
      icon: '📄',
    },
    {
      step: 3,
      title: 'Copy-paste kode doPost handler',
      desc: 'Copy isi file docs/appscript_dopost_handler.gs ke file zcorner_api.gs',
      icon: '📋',
      code: 'A:\\zcorner2\\docs\\appscript_dopost_handler.gs',
    },
    {
      step: 4,
      title: 'Sesuaikan nama Sheet Tenant',
      desc: 'Di fungsi handleGetTenants(), ganti "Tenant" dengan nama tab/sheet yang berisi daftar tenant Anda',
      icon: '✏️',
    },
    {
      step: 5,
      title: 'Deploy ulang sebagai Web App',
      desc: 'Klik Deploy → Manage deployments → Edit → Version: New version → Deploy. Pastikan "Execute as: Me" dan "Who has access: Anyone"',
      icon: '🚀',
    },
    {
      step: 6,
      title: 'Update APPSCRIPT_URL di .env (opsional)',
      desc: 'Jika URL deployment berubah setelah re-deploy, update nilai APPSCRIPT_URL di file .env',
      icon: '⚙️',
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="card p-6 border-l-4 border-l-go-500">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">🔗</span>
            <div>
              <h1 className="text-xl font-extrabold text-slate-800">Setup Integrasi Apps Script</h1>
              <p className="text-sm text-slate-500">Panduan menghubungkan ZCORNER dengan Google Sheets</p>
            </div>
          </div>
          <div className="rounded-2xl bg-slate-100 px-4 py-2.5 text-xs font-mono text-slate-600 break-all">
            {GAS_URL}
          </div>
        </div>

        {/* Test Connection */}
        <div className="card p-5">
          <h2 className="font-bold text-slate-800 mb-3">🧪 Test Koneksi Apps Script</h2>
          <button
            onClick={testConnection}
            disabled={testing}
            className="btn"
            id="test-gas-btn"
          >
            {testing ? '⏳ Testing...' : '🔍 Test Koneksi Sekarang'}
          </button>
          {testResult && (
            <div className={`mt-3 rounded-2xl p-3 text-sm font-semibold ${
              testResult.startsWith('✅') ? 'bg-go-50 text-go-700' : 'bg-red-50 text-red-700'
            }`}>
              {testResult}
            </div>
          )}
          {!testResult && (
            <p className="mt-2 text-xs text-slate-400">
              Jika gagal, ikuti langkah-langkah di bawah untuk menambahkan doPost handler ke Apps Script
            </p>
          )}
        </div>

        {/* Steps */}
        <div className="card p-5">
          <h2 className="font-bold text-slate-800 mb-4">📋 Langkah-Langkah Setup</h2>
          <div className="space-y-4">
            {steps.map((s) => (
              <div key={s.step} className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-go-500 text-sm font-extrabold text-white">
                  {s.step}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span>{s.icon}</span>
                    <p className="font-bold text-sm text-slate-800">{s.title}</p>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{s.desc}</p>
                  {s.code && (
                    <code className="mt-1.5 block rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-700 break-all">
                      {s.code}
                    </code>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="rounded-3xl bg-amber-50 border border-amber-100 p-5 text-sm text-amber-800">
          <p className="font-bold mb-2">⚠️ Catatan Penting</p>
          <ul className="space-y-1.5 text-xs leading-relaxed list-disc list-inside">
            <li>Setiap re-deploy akan menghasilkan URL baru. Catat URL-nya.</li>
            <li>Pastikan fungsi <code className="bg-amber-100 px-1 rounded">getSS()</code>, <code className="bg-amber-100 px-1 rounded">checkLogin()</code>, <code className="bg-amber-100 px-1 rounded">getProduk()</code>, dll sudah ada di kode Apps Script Anda.</li>
            <li>Nama sheet Tenant harus disesuaikan di fungsi <code className="bg-amber-100 px-1 rounded">handleGetTenants()</code></li>
            <li>Jika ada error CORS, pastikan deployment Access: &quot;Anyone&quot;</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <a href="/admin" className="btn flex-1 text-center">→ Ke Admin Dashboard</a>
          <a href="/" className="btn-ghost flex-1 text-center">🏠 Customer App</a>
        </div>
      </div>
    </main>
  );
}
