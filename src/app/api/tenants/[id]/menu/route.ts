import { NextResponse } from 'next/server';
import { callGAS, normalizeMenuItem } from '@/lib/appscript';

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // id bisa berupa angka (index) atau nama tenant (slug)
  // Kita ambil semua tenant dulu, lalu temukan yang sesuai
  const tenantsRes = await callGAS<{ id: number; nama_tenant: string }[]>('getTenants');
  const tenants = Array.isArray(tenantsRes.data) ? tenantsRes.data : [];

  // Cari tenant berdasarkan id (angka) atau nama
  const tenant = tenants.find((t) =>
    String(t.id) === String(id) || t.nama_tenant === id
  );

  if (!tenant) {
    return new NextResponse('Tenant tidak ditemukan', { status: 404 });
  }

  // Ambil produk dari Apps Script berdasarkan nama tenant
  const produkRes = await callGAS<Record<string, unknown>[]>('getProduk', {
    tenant: tenant.nama_tenant,
  });

  const rawItems = Array.isArray(produkRes.data) ? produkRes.data : [];
  const menu_items = rawItems.map((item, i) => normalizeMenuItem(item, i));

  return NextResponse.json({
    id: tenant.id,
    nama_tenant: tenant.nama_tenant,
    foto_banner: (tenant as Record<string, unknown>).foto_banner || '',
    deskripsi: (tenant as Record<string, unknown>).deskripsi || '',
    jam_buka: (tenant as Record<string, unknown>).jam_buka || '',
    kategori: (tenant as Record<string, unknown>).kategori || '',
    status: (tenant as Record<string, unknown>).status || 'buka',
    menu_items,
  });
}
