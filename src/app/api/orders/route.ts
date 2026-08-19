import { NextResponse } from 'next/server';
import { callGAS } from '@/lib/appscript';

export async function POST(req: Request) {
  const body = await req.json();

  console.log('📦 [orders/POST] Body diterima:', JSON.stringify(body, null, 2));

  // Validasi wajib
  if (!String(body.nomor_meja || '').trim()) {
    return new NextResponse('Nomor meja wajib diisi', { status: 400 });
  }
  if (!Array.isArray(body.items) || !body.items.length) {
    return new NextResponse('Keranjang kosong', { status: 400 });
  }
  if (!body.tenant_id && !body.tenant_name) {
    return new NextResponse('Tenant tidak dikenali', { status: 400 });
  }

  // Hitung total
  const total = body.items.reduce(
    (s: number, i: { harga: number; qty: number }) => s + i.harga * i.qty,
    0
  );

  // Payload yang akan dikirim ke GAS
  const gasPayload = {
    tenant: body.tenant_name || String(body.tenant_id),
    customer_name: String(body.customer_name || '').trim(),
    nomor_meja: String(body.nomor_meja).trim(),
    items: body.items.map((i: { menu_item_id?: number; nama_menu: string; harga: number; qty: number }) => ({
      nama: i.nama_menu,
      nama_menu: i.nama_menu,
      qty: i.qty,
      harga: i.harga,
      subtotal: i.harga * i.qty,
      total: i.harga * i.qty,
    })),
    total_harga: total,
    total,
    metode_bayar: 'COD',
    timestamp: new Date().toISOString(),
  };

  console.log('🚀 [orders/POST] Mengirim ke GAS action=createOrder:', JSON.stringify(gasPayload, null, 2));

  const result = await callGAS('createOrder', gasPayload);

  console.log('📨 [orders/POST] Response dari GAS:', JSON.stringify(result, null, 2));

  if (!result.success) {
    console.error('❌ [orders/POST] GAS gagal:', result.error);
    return new NextResponse(result.error || 'Gagal membuat pesanan', { status: 400 });
  }

  // Return order dalam format yang dikenali frontend
  const orderId = result.orderId || `ORD-${Date.now()}`;
  console.log('✅ [orders/POST] Sukses, orderId:', orderId);

  return NextResponse.json({
    id: orderId,
    orderId,
    tenant_name: body.tenant_name || '',
    nomor_meja: body.nomor_meja,
    status: 'diterima',
    total_harga: total,
    metode_bayar: 'COD',
    created_at: new Date().toISOString(),
  }, { status: 201 });
}
