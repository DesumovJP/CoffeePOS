import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/design-system/providers';
import { QueryProvider } from '@/lib/providers';
import { AppShell } from '@/components';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'ParadisePOS',
    template: '%s | ParadisePOS',
  },
  description: 'Modern POS platform for HoReCa - cafes, restaurants, and coffee shops',
  keywords: ['POS', 'point of sale', 'restaurant', 'cafe', 'HoReCa', 'inventory', 'management'],
  authors: [{ name: 'ParadisePOS Team' }],
  creator: 'ParadisePOS',
  publisher: 'ParadisePOS',
  robots: {
    index: true,
    follow: true,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ParadisePOS',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'uk_UA',
    siteName: 'ParadisePOS',
    title: 'ParadisePOS - Modern POS for HoReCa',
    description: 'Modern POS platform for HoReCa - cafes, restaurants, and coffee shops',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk" className={`light ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('paradise-pos-theme');
                  if (saved) {
                    var parsed = JSON.parse(saved);
                    if (parsed.mode === 'dark' || parsed.mode === 'system') {
                      parsed.mode = 'light';
                      localStorage.setItem('paradise-pos-theme', JSON.stringify(parsed));
                    }
                  }
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                  document.documentElement.style.colorScheme = 'light';
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <QueryProvider>
          <ThemeProvider defaultMode="light">
            <AppShell>
              <main id="main-content">
                {children}
              </main>
            </AppShell>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
