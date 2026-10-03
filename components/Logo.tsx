import Link from 'next/link';

type LogoProps = {
  className?: string;
  href?: string;
};

export function Logo({ className = '', href = '/' }: LogoProps) {
  return (
    <Link href={href} className={`group flex items-center gap-3 ${className}`}>
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-night text-sun shadow-sm transition-transform group-hover:-rotate-3">
        <svg
          viewBox="0 0 40 40"
          aria-hidden="true"
          className="h-7 w-7"
          fill="none"
        >
          <circle cx="30.5" cy="9.5" r="3.4" fill="currentColor" />
          <path
            d="M9.5 29V11H18a7.5 7.5 0 010 15H9.5"
            stroke="currentColor"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M22 29c5.4 0 9.5-4.2 9.5-9.5"
            stroke="currentColor"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-base font-bold tracking-[-0.02em] text-ink sm:text-lg">
          Dólar Paralelo
        </span>
        <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-ink/50">
          Bolivia · Hoy
        </span>
      </span>
    </Link>
  );
}
