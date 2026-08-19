import { NextResponse } from 'next/server';
import { callGAS, normalizeOrder } from '@/lib/appscript';
import { superGuard } from '@/lib/auth';

export async function GET() {
  const s = await superGuard();
  if (!s) return new NextResponse('Unauthorized', { status: 401 });


  const tenantsRes = await callGAS<{ id: number; nama_tenant: string }[]>('getTenants');
  const tenants = Array.isArray(tenantsRes.data) ? tenantsRes.data : [];

  // Ambil orders semua tenant untuk hitung omzet
  const allOrderPromises = tenants.map(async (t) => {
    const res = await callGAS<Record<string, unknown>[]>('getHistoryTransaksi', {
      tenant: t.nama_tenant,
    });
    return {
      tenant: t,
      orders: Array.isArray(res.data) ? res.data.map(normalizeOrder) : [],
    };
  });

  const tenantOrders = await Promise.all(allOrderPromises);

  const tenantStats = tenantOrders.map(({ tenant, orders }) => ({
    id: tenant.id,
    nama_tenant: (tenant as Record<string, unknown>).nama_tenant as string,
    kategori: (tenant as Record<string, unknown>).kategori as string || 'Kuliner',
    status: (tenant as Record<string, unknown>).status as string || 'buka',
    jam_buka: (tenant as Record<string, unknown>).jam_buka as string || '',
    omzet: orders.reduce((s, o) => s + o.total_harga, 0),
    _count: { orders: orders.length, menu_items: 0 },
  }));

  const total_omzet = tenantStats.reduce((s, t) => s + t.omzet, 0);
  const total_pesanan = tenantStats.reduce((s, t) => s + t._count.orders, 0);

  return NextResponse.json({
    total_tenant: tenants.length,
    total_pesanan,
    total_omzet,
    tenants: tenantStats,
  });
}
