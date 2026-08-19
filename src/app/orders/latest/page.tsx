'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LatestOrderPage() {
  const router = useRouter();
  useEffect(() => {
    const id = localStorage.getItem('zcorner_last_order');
    if (id) router.replace(`/orders/${id}`);
  }, [router]);
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6">
      <div className="text-5xl">📋</div>
      <h1 className="text-xl font-extrabold text-slate-800">Belum ada pesanan</h1>
      <p className="text-slate-500 text-sm">Pesan makanan terlebih dahulu</p>
      <Link href="/" className="btn">Mulai Pesan</Link>
    </main>
  );
}
