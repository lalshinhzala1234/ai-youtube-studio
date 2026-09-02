import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AI YouTube Studio',
    short_name: 'AI YT Studio',
    description: 'Turn one YouTube video idea into a complete production-ready package with hooks, scripts, video prompts, and metadata.',
    start_url: '/',
    display: 'standalone',
    background_color: '#090c10',
    theme_color: '#dc2626',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
