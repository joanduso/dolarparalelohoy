'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  {
    href: '/',
    label: 'Inicio',
    icon: <path d="M3 10.8 12 3l9 7.8v8.7a1.5 1.5 0 0 1-1.5 1.5H15v-6H9v6H4.5A1.5 1.5 0 0 1 3 19.5v-8.7Z" />
  },
  {
    href: '/paralelo',
    label: 'Paralelo',
    icon: <path d="M5 16.5 9 12l3 3 7-8M15 7h4v4" />
  },
  {
    href: '/oficial',
    label: 'Oficial',
    icon: <path d="M4 9h16M6 9v9m4-9v9m4-9v9m4-9v9M3 21h18M12 3l9 4H3l9-4Z" />
  },
  {
    href: '/historico/paralelo',
    label: 'Histórico',
    icon: <path d="M12 7v5l3 2m6-2a9 9 0 1 1-2.64-6.36M21 3v6h-6" />
  },
  {
    href: '/exchanges',
    label: 'Comparar',
    icon: <path d="m7 7-4 4 4 4m-4-4h14m0-2 4 4-4 4m4-4H7" />
  }
];

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación principal móvil"
      className="fixed inset-x-3 bottom-3 z-50 rounded-[1.6rem] border border-white/80 bg-white/80 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_18px_55px_rgba(15,23,42,0.2)] backdrop-blur-2xl lg:hidden"
    >
      <div className="grid grid-cols-5 gap-1">
        {items.map((item) => {
          const active = item.href === '/'
            ? pathname === '/'
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[0.62rem] font-semibold transition active:scale-95 ${
                active ? 'bg-[#007aff]/10 text-[#007aff]' : 'text-ink/45 hover:text-ink/70'
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {item.icon}
              </svg>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
