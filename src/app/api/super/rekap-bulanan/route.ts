import { NextResponse } from 'next/server';
import { callGAS, type GasRekapBulanan } from '@/lib/appscript';
import { superGuard } from '@/lib/auth';

export async function GET() {
  const s = await superGuard();
  if (!s) return new NextResponse('Unauthorized', { status: 401 });

  const result = await callGAS<GasRekapBulanan[]>('getRekapBulanan');
  return NextResponse.json(Array.isArray(result.data) ? result.data : []);
}
