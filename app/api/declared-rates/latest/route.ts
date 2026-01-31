import { NextResponse } from 'next/server';
import { getDeclaredAggregate } from '@/lib/queries';

export async function GET() {
  const declared = await getDeclaredAggregate('PARALELO');
  return NextResponse.json({ ok: true, declared });
}
