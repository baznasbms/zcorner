import { NextResponse } from 'next/server';
import { callGAS, type GasWebOrder } from '@/lib/appscript';
import { tenantGuard } from '@/lib/auth';

export async function GET() {
  const guard = await tenantGuard();
  if (!guard) return new NextResponse('Unauthorized', { status: 401 });
  const { tenant } = guard;

  const result = await callGAS<GasWebOrder[]>('getPendingOrders', { tenant });
  return NextResponse.json(Array.isArray(result.data) ? result.data : []);
}

export async function POST(req: Request) {
  const guard = await tenantGuard();
  if (!guard) return new NextResponse('Unauthorized', { status: 401 });
  const body = await req.json();

  const result = await callGAS<Record<string, unknown>>('confirmOrder', {
    rowIdx: body.rowIdx,
    statusAction: 'APPROVE', // Hardcode to APPROVE for now
    tenantName: guard.tenant,
  });

  if (!result.success) return new NextResponse(result.error || 'Gagal menyetujui pesanan', { status: 400 });
  const responseData = (result.data && typeof result.data === 'object') ? result.data : {};
  return NextResponse.json({ ok: true, ...responseData });
}
