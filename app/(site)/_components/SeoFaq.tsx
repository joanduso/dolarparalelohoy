import { JsonLd } from '@/app/(site)/_components/JsonLd';

export type SeoFaqItem = {
  question: string;
  answer: string;
};

export function SeoFaq({ items }: { items: SeoFaqItem[] }) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer
      }
    }))
  };

  return (
    <section className="card p-6 grid gap-4" aria-labelledby="preguntas-frecuentes">
      <JsonLd data={structuredData} />
      <h2 id="preguntas-frecuentes" className="font-serif text-2xl">
        Preguntas frecuentes
      </h2>
      <dl className="grid gap-4 text-ink/70">
        {items.map((item) => (
          <div key={item.question} className="grid gap-1">
            <dt className="font-semibold text-ink">{item.question}</dt>
            <dd>{item.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
