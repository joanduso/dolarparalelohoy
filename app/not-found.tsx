import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="section-shell py-16">
      <div className="card p-6">
        <h1 className="font-serif text-3xl">Página no encontrada</h1>
        <p className="text-ink/70 mt-2">
          La página que buscabas no existe o fue movida.
        </p>
        <Link href="/" className="underline underline-offset-4 text-sm">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
