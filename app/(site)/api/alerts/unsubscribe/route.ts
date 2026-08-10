import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { siteConfig } from '@/lib/seo';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token');
  if (token && token.length <= 200) {
    const subscription = await prisma.alertSubscription.findFirst({
      where: { unsubscribe_token: token }
    });
    if (subscription) {
      await prisma.alertSubscription.update({
        where: { id: subscription.id },
        data: { status: 'UNSUBSCRIBED' }
      });
    }
  }
  return NextResponse.redirect(new URL('/compartir?alert=unsubscribed', siteConfig.url));
}
