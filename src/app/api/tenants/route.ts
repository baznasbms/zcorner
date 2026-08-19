import { NextResponse } from 'next/server';
import { callGAS, normalizeMenuItem, type GasTenant } from '@/lib/appscript';

export async function GET() {
  const result = await callGAS<GasTenant[]>('getTenants');

  if (!result.success || !Array.isArray(result.data)) {
    // Fallback: kembalikan array kosong agar home page tidak crash
    return NextResponse.json([]);
  }

  // Tambah _count untuk kompatibilitas UI
  const tenants = result.data.map((t, i) => ({
    ...t,
    id: t.id ?? i + 1,
    _count: { menu_items: 0 }, // akan diisi saat klik tenant
  }));

  return NextResponse.json(tenants);
}
