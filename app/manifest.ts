import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Dólar Paralelo Hoy Bolivia',
    short_name: 'Dólar Bolivia',
    start_url: '/',
    display: 'standalone',
    background_color: '#f7f3ee',
    theme_color: '#f6c453',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml'
      }
    ]
  };
}
