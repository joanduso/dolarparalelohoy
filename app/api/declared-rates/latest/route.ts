import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limitParam = Number(searchParams.get('limit') ?? '20');
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 50) : 20;

  const rows = await prisma.declaredRate.findMany({
    where: { status: { in: ['ACCEPTED', 'FLAGGED'] } },
    orderBy: { created_at: 'desc' },
    take: limit,
    select: {
      id: true,
      kind: true,
      side: true,
      value: true,
      city: true,
      source_type: true,
      deviation_pct: true,
      status: true,
      created_at: true
    }
  });

  return NextResponse.json({
    data: rows.map((row) => ({
      id: row.id,
      kind: row.kind,
      side: row.side,
      value: row.value,
      city: row.city,
      source_type: row.source_type,
      deviation_pct: row.deviation_pct,
      status: row.status,
      created_at: row.created_at
    }))
  });
}
