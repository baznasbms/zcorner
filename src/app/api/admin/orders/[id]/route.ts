import { NextResponse } from 'next/server';

// Status update tidak diperlukan dalam integrasi Apps Script
// Semua status dikelola langsung di Google Sheets / sistem kasir Apps Script
export async function PATCH() {
  return NextResponse.json({
    ok: true,
    message: 'Status dikelola di Google Sheets via Apps Script',
  });
}
