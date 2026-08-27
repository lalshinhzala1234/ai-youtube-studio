import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProviders } from '@/components/providers/AppProviders';

export const dynamic = 'force-dynamic';

export const viewport: Viewport = {
  themeColor: '#090c10',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'AI YouTube Studio | Turn One Idea into a Production Package',
  description: 'Turn one YouTube video idea into a complete production-ready YouTube package with hooks, scripts, video prompts, thumbnail concepts, and SEO metadata.',
  applicationName: 'AI YouTube Studio',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AI YouTube Studio',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-[#090c10] text-[#f0f6fc] min-h-screen antialiased flex flex-col selection:bg-red-500 selection:text-white">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

