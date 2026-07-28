'use client';

import Link from 'next/link';

type ShareCtaLinkProps = {
  href: string;
  placement: string;
  className?: string;
  children: React.ReactNode;
};

// Small isolated client component: only this link needs a click handler for
// the GA4 event, so only it (not the whole card or page) ships client JS.
export function ShareCtaLink({ href, placement, className, children }: ShareCtaLinkProps) {
  const track = () => {
    const analyticsWindow = window as typeof window & {
      gtag?: (...args: unknown[]) => void;
    };
    analyticsWindow.gtag?.('event', 'share_cta_click', {
      placement,
      destination: 'compartir'
    });
  };

  return (
    <Link href={href} onClick={track} className={className}>
      {children}
    </Link>
  );
}
