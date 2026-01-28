import { NextResponse } from 'next/server';
import { getLatestBrecha } from '@/lib/queries';
import { prisma } from '@/lib/db';
import { ensureFreshRates } from '@/lib/ingest/ensureFresh';

export const revalidate = 600;
export const dynamic = 'force-dynamic';

export async function GET() {
  await ensureFreshRates(prisma, 10 * 60_000);
  const brecha = await getLatestBrecha();
  const errors = [];
  if (!brecha) errors.push({ source: 'BRECHA', error: 'unavailable' });
  return NextResponse.json({
    updatedAt: new Date().toISOString(),
    brecha,
    errors
  });
}
