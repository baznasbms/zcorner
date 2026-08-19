import { NextResponse } from 'next/server';
import { loginViaGAS } from '@/lib/auth';

const APPSCRIPT_ADMIN_URL = 'https://script.google.com/macros/s/AKfycbyDChjat_7ZUHuDglXh2U4cSRg2p-Rv8Sob38ijZO3h0kNMlGG2p_WHCsA5Q_rKy5CX/exec';

export async function POST(req: Request) {
  const { username, password } = await req.json();

  if (!username || !password) {
    return new NextResponse('Username dan password wajib diisi', { status: 400 });
  }

  const result = await loginViaGAS(username, password);

  if (!result.success) {
    return new NextResponse(result.error || 'Username atau password salah', { status: 401 });
  }

  return NextResponse.json({ success: true, redirectUrl: APPSCRIPT_ADMIN_URL });
}
