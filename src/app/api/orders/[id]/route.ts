import { NextResponse } from 'next/server';
import { callGAS, normalizeOrder } from '@/lib/appscript';

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Ambil dari localStorage di client side tidak bisa dari server
  // Kita coba dari query string atau cari order berdasarkan ID
  const result = await callGAS('getOrderById', { orderId: id });

  if (result.success && result.data) {
    const order = normalizeOrder(result.data as Record<string, unknown>);
    return NextResponse.json({
      id: order.id,
      nomor_meja: order.nomor_meja,
      status: 'diterima',  // selalu diterima
      total_harga: order.total_harga,
      metode_bayar: 'COD',
      payment_status: 'belum_lunas',
      created_at: order.created_at,
      tenant: { nama_tenant: order.tenant },
      items: order.items.map((i) => ({
        qty: i.qty,
        subtotal: i.subtotal,
        menu_item: { nama_menu: i.nama_menu },
      })),
    });
  }

  // Fallback: kembalikan data minimal dari ID yang disimpan localStorage
  // (ID mungkin berupa string ORD-timestamp atau nomor)
  return NextResponse.json({
    id,
    nomor_meja: '-',
    status: 'diterima',
    total_harga: 0,
    metode_bayar: 'COD',
    payment_status: 'belum_lunas',
    created_at: new Date().toISOString(),
    tenant: { nama_tenant: 'Tenant' },
    items: [],
  });
}
