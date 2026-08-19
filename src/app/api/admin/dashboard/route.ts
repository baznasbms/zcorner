import { NextResponse } from 'next/server';
import { callGAS } from '@/lib/appscript';
import { tenantGuard } from '@/lib/auth';

export async function GET() {
  const guard = await tenantGuard();
  if (!guard) return new NextResponse('Unauthorized', { status: 401 });
  const { tenant } = guard;

  const result = await callGAS<{
    harian?: { total?: number; omset?: number };
    bulanan?: { total?: number; omset?: number };
    chart?: { date: string; total: number }[];
    top_menu?: { nama: string; qty: number }[];
  }>('getDashboardData', { tenant });

  const data = result.data || {};

  // Normalize ke format yang diharapkan frontend dashboard
  const today = new Date().toISOString().slice(0, 10);
  const chart = Array.isArray(data.chart) ? data.chart : [];
  const top_menu = Array.isArray(data.top_menu)
    ? data.top_menu.map((t, i) => ({
        menu_item_id: i + 1,
        nama: t.nama || '',
        _sum: { qty: t.qty || 0 },
      }))
    : [];

  const todayData = chart.find((c) => c.date === today);

  return NextResponse.json({
    orders_today: data.harian?.total ?? 0,
    revenue_today: data.harian?.omset ?? todayData?.total ?? 0,
    top_menu,
    chart: chart.length ? chart : Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 864e5).toISOString().slice(0, 10),
      total: 0,
    })),
  });
}
