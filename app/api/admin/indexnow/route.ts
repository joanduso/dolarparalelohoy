import { NextResponse } from 'next/server';
import { siteConfig, siteRoutes } from '@/lib/seo';

export const runtime = 'nodejs';

// Not a secret: this key is intentionally public (served at
// /{key}.txt) so IndexNow-compatible search engines can verify it.
const INDEXNOW_KEY = 'f6d6709dab0f0cb511aed871eb722064';

function errorDetails(error: unknown) {
  if (!error || typeof error !== 'object') return { message: String(error) };
  const maybe = error as { message?: string; code?: string };
  return { message: maybe.message ?? String(error), code: maybe.code };
}

export async function POST(request: Request) {
  const adminKey = request.headers.get('x-admin-key') ?? '';
  if (!process.env.ADMIN_KEY || adminKey !== process.env.ADMIN_KEY) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const host = new URL(siteConfig.url).host;
  const urlList = siteRoutes.map((path) => `${siteConfig.url}${path}`);

  try {
    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host,
        key: INDEXNOW_KEY,
        keyLocation: `${siteConfig.url}/${INDEXNOW_KEY}.txt`,
        urlList
      })
    });

    return NextResponse.json({
      ok: response.ok,
      status: response.status,
      submitted: urlList.length,
      urlList
    });
  } catch (error) {
    console.error('[admin/indexnow] failed', errorDetails(error));
    return NextResponse.json(
      { ok: false, error: 'internal_error', message: String(error) },
      { status: 500 }
    );
  }
}
