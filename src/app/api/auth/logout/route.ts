import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  // Hapus kedua cookie (session baru dan legacy token)
  res.cookies.set('zcorner_session', '', { httpOnly: true, path: '/', maxAge: 0 });
  res.cookies.set('token', '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}
