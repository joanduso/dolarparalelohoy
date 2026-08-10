import { NextResponse } from 'next/server';
import { hashAlertValue } from '@/lib/alerts';
import { prisma } from '@/lib/db';
import { siteConfig } from '@/lib/seo';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token');
  if (!token || token.length > 200) {
    return NextResponse.redirect(new URL('/compartir?alert=invalid', siteConfig.url));
  }

  const subscription = await prisma.alertSubscription.findFirst({
    where: {
      confirmation_token_hash: hashAlertValue(token),
      status: 'PENDING'
    }
  });
  if (!subscription) {
    return NextResponse.redirect(new URL('/compartir?alert=invalid', siteConfig.url));
  }

  await prisma.alertSubscription.update({
    where: { id: subscription.id },
    data: {
      status: 'ACTIVE',
      confirmed_at: new Date(),
      confirmation_token_hash: null
    }
  });
  return NextResponse.redirect(new URL('/compartir?alert=confirmed', siteConfig.url));
}
