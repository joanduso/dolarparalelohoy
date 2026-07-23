import Link from 'next/link';
import { JsonLd } from '@/app/(site)/_components/JsonLd';
import { siteConfig } from '@/lib/seo';

type BreadcrumbItem = {
  name: string;
  href: string;
};

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const allItems = [{ name: 'Inicio', href: '/' }, ...items];
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: allItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${siteConfig.url}${item.href === '/' ? '' : item.href}`
    }))
  };

  return (
    <>
      <JsonLd data={structuredData} />
      <nav aria-label="Ruta de navegación" className="mb-6 text-sm text-ink/60">
        <ol className="flex flex-wrap items-center gap-2">
          {allItems.map((item, index) => {
            const isCurrent = index === allItems.length - 1;
            return (
              <li key={item.href} className="flex items-center gap-2">
                {index > 0 ? <span aria-hidden="true">/</span> : null}
                {isCurrent ? (
                  <span aria-current="page">{item.name}</span>
                ) : (
                  <Link href={item.href} className="underline underline-offset-4 hover:text-ink">
                    {item.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
