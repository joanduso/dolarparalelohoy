'use client';

type ApiTryLinkProps = {
  href: string;
  label?: string;
};

export function ApiTryLink({ href, label = 'Probar la cotización actual en JSON' }: ApiTryLinkProps) {
  const trackClick = () => {
    const analyticsWindow = window as typeof window & {
      gtag?: (...args: unknown[]) => void;
    };
    analyticsWindow.gtag?.('event', 'api_try_click', {
      endpoint: new URL(href, window.location.origin).pathname
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
      {label}
    </a>
  );
}
