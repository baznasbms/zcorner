import { NextResponse } from 'next/server';
import { session } from '@/lib/auth';

export async function GET() {
  const s = await session();
  return s ? NextResponse.json(s) : new NextResponse('Unauthorized', { status: 401 });
}
