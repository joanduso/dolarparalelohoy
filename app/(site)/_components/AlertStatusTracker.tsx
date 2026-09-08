'use client';

import { useEffect } from 'react';

export function AlertStatusTracker({ status }: { status?: string }) {
  useEffect(() => {
    if (status !== 'confirmed') return;

    const analyticsWindow = window as typeof window & {
      gtag?: (...args: unknown[]) => void;
    };
    analyticsWindow.gtag?.('event', 'alert_subscription_confirmed', {
      method: 'email',
      content_type: 'rate_alert'
    });
  }, [status]);

  return null;
}
