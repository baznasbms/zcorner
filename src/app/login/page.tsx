'use client';

import { useEffect } from 'react';

const TENANT_URL = 'https://zcorner-chi.vercel.app';

export default function LoginPage() {
  useEffect(() => {
    window.location.href = TENANT_URL;
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="text-center">
        <div className="text-4xl animate-spin">⏳</div>
        <p className="mt-4 font-semibold text-slate-600">Mengarahkan ke Login Tenant...</p>
      </div>
    </main>
  );
}
