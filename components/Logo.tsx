import Link from 'next/link';

type LogoProps = {
  className?: string;
  href?: string;
};

export function Logo({ className = '', href = '/' }: LogoProps) {
  return (
    <Link href={href} className={`flex items-center gap-3 ${className}`}>
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-[0.6rem] bg-ink text-sun">
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
      <span className="flex flex-col leading-tight">
        <span className="font-serif text-2xl text-ink">Dólar Paralelo Hoy</span>
        <span className="text-xs text-ink/60">Datos diarios en Bolivia</span>
      </span>
    </Link>
  );
}
