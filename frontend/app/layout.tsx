import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/design-system/providers';
import { QueryProvider, AuthProvider } from '@/lib/providers';
import { AppShell, ErrorBoundary } from '@/components';
import { ToastProvider } from '@/components/atoms/Toast';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'CoffeePOS',
    template: '%s | CoffeePOS',
  },
  description: 'Modern POS platform for HoReCa - cafes, restaurants, and coffee shops',
  keywords: ['POS', 'point of sale', 'restaurant', 'cafe', 'HoReCa', 'inventory', 'management'],
  authors: [{ name: 'CoffeePOS Team' }],
  creator: 'CoffeePOS',
  publisher: 'CoffeePOS',
  robots: {
    index: false,
    follow: false,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CoffeePOS',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'uk_UA',
    siteName: 'CoffeePOS',
    title: 'CoffeePOS - Modern POS for HoReCa',
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
          <AuthProvider>
            <ThemeProvider defaultMode="light">
              <ToastProvider>
                <ErrorBoundary>
                  <AppShell>
                    <main id="main-content">
                      {children}
                    </main>
                  </AppShell>
                </ErrorBoundary>
              </ToastProvider>
            </ThemeProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
