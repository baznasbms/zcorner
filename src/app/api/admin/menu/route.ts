import { NextResponse } from 'next/server';
import { callGAS, normalizeMenuItem } from '@/lib/appscript';
import { tenantGuard } from '@/lib/auth';

export async function GET() {
  const guard = await tenantGuard();
  if (!guard) return new NextResponse('Unauthorized', { status: 401 });
  const { tenant } = guard;
  const result = await callGAS<Record<string, unknown>[]>('getProduk', { tenant });
  const raw = Array.isArray(result.data) ? result.data : [];
  const items = raw.map((item, i) => normalizeMenuItem(item, i));
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const guard = await tenantGuard();
  if (!guard) return new NextResponse('Unauthorized', { status: 401 });
  const { tenant } = guard;
  const body = await req.json();
  const result = await callGAS('saveProduk', {
    tenant,
    nama_menu: body.nama_menu,
    nama: body.nama_menu,      // kompabilitas nama field AS
    prodNama: body.nama_menu,
    kategori: body.kategori || 'Umum',
    harga: Number(body.harga),
    prodHarga: Number(body.harga),
    foto_menu: body.foto_menu || '',
    stok: Number(body.stok ?? 99),
    status_aktif: body.status_aktif !== false,
  });
  if (!result.success) return new NextResponse(result.error || 'Gagal simpan', { status: 400 });
  return NextResponse.json(result.data || { ok: true }, { status: 201 });
}

export async function PUT(req: Request) {
  const guard = await tenantGuard();
  if (!guard) return new NextResponse('Unauthorized', { status: 401 });
  const { tenant } = guard;
  const body = await req.json();
  const result = await callGAS('saveProduk', {
    id: body.id,
    tenant,
    nama_menu: body.nama_menu,
    nama: body.nama_menu,
    prodNama: body.nama_menu,
    kategori: body.kategori || 'Umum',
    harga: Number(body.harga),
    prodHarga: Number(body.harga),
    foto_menu: body.foto_menu || '',
    stok: Number(body.stok ?? 99),
    status_aktif: body.status_aktif !== false,
  });
  if (!result.success) return new NextResponse(result.error || 'Gagal update', { status: 400 });
  return NextResponse.json(result.data || { ok: true });
}

export async function DELETE(req: Request) {
  const guard = await tenantGuard();
  if (!guard) return new NextResponse('Unauthorized', { status: 401 });
  const { tenant } = guard;
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return new NextResponse('ID wajib diisi', { status: 400 });
  const result = await callGAS('deleteProduk', { id, tenant });
  if (!result.success) return new NextResponse(result.error || 'Gagal hapus', { status: 400 });
  return NextResponse.json({ ok: true });
}
