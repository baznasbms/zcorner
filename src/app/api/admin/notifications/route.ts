import { NextResponse } from 'next/server';
import { callGAS } from '@/lib/appscript';
import { tenantGuard } from '@/lib/auth';

export async function GET() {
  const guard = await tenantGuard();
  if (!guard) return new NextResponse('Unauthorized', { status: 401 });
  const { tenant } = guard;

  // GAS doPost handler menerima 'getPendingOrders' atau 'fetchPendingOrders'
  const result = await callGAS('getPendingOrders', { tenant });
  return NextResponse.json(Array.isArray(result.data) ? result.data : []);
}
