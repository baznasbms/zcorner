import { NextResponse } from 'next/server';
import { callGAS, type GasRekapHarian, type GasSetoran } from '@/lib/appscript';
import { tenantGuard } from '@/lib/auth';

export async function GET(req: Request) {
  const guard = await tenantGuard();
  if (!guard) return new NextResponse('Unauthorized', { status: 401 });
  const { tenant } = guard;
  const url = new URL(req.url);
  const bulan = url.searchParams.get('bulan') || undefined;

  const [rekapRes, setoranRes] = await Promise.all([
    callGAS<GasRekapHarian[]>('getRekapHarian', { tenant, bulan }),
    callGAS<GasSetoran[]>('getSetoran', { tenant, bulan }),
  ]);

  return NextResponse.json({
    rekap: Array.isArray(rekapRes.data) ? rekapRes.data : [],
    setoran: Array.isArray(setoranRes.data) ? setoranRes.data : [],
  });
}

export async function POST(req: Request) {
  const guard = await tenantGuard();
  if (!guard) return new NextResponse('Unauthorized', { status: 401 });
  const { tenant } = guard;
  const body = await req.json();
  const action = body.type === 'setoran' ? 'saveSetoran' : 'saveRekapHarian';

  const result = await callGAS(action, { ...body, tenant });
  if (!result.success) return new NextResponse(result.error || 'Gagal simpan', { status: 400 });
  return NextResponse.json(result.data || { ok: true }, { status: 201 });
}
