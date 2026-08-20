'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/login');
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="text-center">
        <div className="text-4xl animate-spin">⏳</div>
        <p className="mt-4 font-semibold text-slate-600">Mengarahkan ke Login Tenant...</p>
      </div>
    </main>
  );
}
