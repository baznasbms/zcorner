import { NextResponse } from 'next/server';
import { callGAS, normalizeMenuItem, type GasTenant } from '@/lib/appscript';

export async function GET() {
  const result = await callGAS<GasTenant[]>('getTenants');

  if (!result.success || !Array.isArray(result.data)) {
    // Fallback: kembalikan array kosong agar home page tidak crash
    return NextResponse.json([]);
  }

  // Ambil produk tiap tenant secara paralel untuk hitung jumlah menu aktual
  const tenants = await Promise.all(
    result.data.map(async (t, i) => {
      const nama = t.nama_tenant || '';
      let menuCount = 0;

      try {
        const produkRes = await callGAS<Record<string, unknown>[]>('getProduk', { tenant: nama });
        if (produkRes.success && Array.isArray(produkRes.data)) {
          menuCount = produkRes.data.length;
        }
      } catch {
        menuCount = 0;
      }

      return {
        ...t,
        id: t.id ?? i + 1,
        _count: { menu_items: menuCount },
      };
    })
  );

  return NextResponse.json(tenants);
}
