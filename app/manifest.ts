import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AvisLoop',
    short_name: 'AvisLoop',
    description: 'Managed Google review service for home service businesses',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFBF5',
    theme_color: '#CD7242',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  }
}
