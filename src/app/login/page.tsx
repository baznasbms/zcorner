'use client';

import { useEffect } from 'react';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbyDChjat_7ZUHuDglXh2U4cSRg2p-Rv8Sob38ijZO3h0kNMlGG2p_WHCsA5Q_rKy5CX/exec';

export default function LoginPage() {
  useEffect(() => {
    window.location.href = GAS_URL;
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="text-center">
        <div className="text-4xl animate-spin">⏳</div>
        <p className="mt-4 font-semibold text-slate-600">Mengarahkan ke Apps Script Tenant...</p>
      </div>
    </main>
  );
}
