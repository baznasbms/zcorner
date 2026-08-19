import { NextResponse } from 'next/server';
import { callGAS, normalizeOrder } from '@/lib/appscript';
import { tenantGuard } from '@/lib/auth';

export async function GET(req: Request) {
  const guard = await tenantGuard();
  if (!guard) return new NextResponse('Unauthorized', { status: 401 });
  const { tenant } = guard;
  const url = new URL(req.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');

  const result = await callGAS<Record<string, unknown>[]>('getHistoryTransaksi', { tenant });
  const raw = Array.isArray(result.data) ? result.data : [];

  let orders = raw.map((o) => {
    const normalized = normalizeOrder(o);
    return {
      id: normalized.id,
      nomor_meja: normalized.nomor_meja,
      status: 'diterima',   // simplified — hanya diterima
      total_harga: normalized.total_harga,
      metode_bayar: 'COD',
      payment_status: 'belum_lunas',
      created_at: normalized.created_at,
      items: normalized.items.map((i) => ({
        qty: i.qty,
        subtotal: i.subtotal,
        menu_item: { nama_menu: i.nama_menu },
      })),
    };
  });

  // Filter tanggal jika ada
  if (from) orders = orders.filter((o) => (o.created_at ?? '') >= from);
  if (to)   orders = orders.filter((o) => (o.created_at ?? '') <= to + 'T23:59:59');

  // Sort terbaru dulu
  orders.sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime());

  return NextResponse.json(orders.slice(0, 200));
}
