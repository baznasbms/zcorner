import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { tenantGuard } from '@/lib/auth';

export async function POST(req: Request) {
  await tenantGuard();
  const form = await req.formData();
  const file = form.get('file') as File | null;
  if (!file) return new NextResponse('No file', { status: 400 });
  const buf = Buffer.from(await file.arrayBuffer());
  const dir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(dir, { recursive: true });
  const name = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  await writeFile(path.join(dir, name), buf);
  return NextResponse.json({ url: `/uploads/${name}` });
}
