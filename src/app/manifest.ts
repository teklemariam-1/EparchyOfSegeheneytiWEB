import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Catholic Eparchy of Segeneyti',
    short_name: 'Eparchy Segeneyti',
    description:
      'Official website of the Catholic Eparchy of Segeneyti in Eritrea — serving God\'s people through faith, community, and mission.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fdf8f3',
    theme_color: '#7a1e2e',
    orientation: 'portrait-primary',
    categories: ['religion', 'education', 'news'],
    lang: 'en',
    dir: 'ltr',
  }
}
