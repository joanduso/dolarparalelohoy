import { NextResponse } from 'next/server';
import { getLatestBrecha } from '@/lib/queries';

export const revalidate = 600;

export async function GET() {
  const brecha = await getLatestBrecha();
  const errors = [];
  if (!brecha) errors.push({ source: 'BRECHA', error: 'unavailable' });
  return NextResponse.json({
    updatedAt: new Date().toISOString(),
    brecha,
    errors
  });
}
