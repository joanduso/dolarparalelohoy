'use client';

type ApiTryLinkProps = {
  href: string;
};

export function ApiTryLink({ href }: ApiTryLinkProps) {
  const trackClick = () => {
    const analyticsWindow = window as typeof window & {
      gtag?: (...args: unknown[]) => void;
    };
    analyticsWindow.gtag?.('event', 'api_try_click', {
      endpoint: '/api/v1/rates/current'
    });
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={trackClick}
      className="justify-self-start underline underline-offset-4"
    >
      Probar la cotización actual en JSON
    </a>
  );
}
