import Link from 'next/link';

type LogoProps = {
  className?: string;
  href?: string;
};

export function Logo({ className = '', href = '/' }: LogoProps) {
  return (
    <Link href={href} className={`flex items-center gap-3 ${className}`}>
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white">
        <svg
          viewBox="0 0 40 40"
          aria-hidden="true"
          className="h-6 w-6"
          fill="none"
        >
          <circle cx="30" cy="10" r="3" fill="currentColor" />
          <path
            d="M9 28V12h9a7 7 0 010 14H9z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M22 28c5 0 9-4 9-9"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="flex flex-col leading-tight">
        <span className="font-serif text-2xl text-ink">Dólar Paralelo Hoy</span>
        <span className="text-xs text-ink/60">Datos diarios en Bolivia</span>
      </span>
    </Link>
  );
}
