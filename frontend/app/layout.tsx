import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import { ThemeProvider } from '@/design-system/providers';
import { PreferencesSync } from '@/design-system/providers/PreferencesSync';
import { QueryProvider, AuthProvider } from '@/lib/providers';
import { AppShell, ErrorBoundary } from '@/components';
import { ToastProvider } from '@/components/atoms/Toast';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-manrope',
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
    <html lang="uk" className={manrope.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var prefs = localStorage.getItem('paradise-pos-preferences');
                  var theme = 'system';
                  var density = 'default';
                  if (prefs) {
                    var p = JSON.parse(prefs);
                    if (p.state) { theme = p.state.theme || 'system'; density = p.state.uiDensity || 'default'; }
                  }
                  var dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  var cl = document.documentElement.classList;
                  cl.add(dark ? 'dark' : 'light');
                  cl.add('density-' + density);
                  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
                } catch (e) {
                  document.documentElement.classList.add('light', 'density-default');
                }
              })();
            `,
          }}
        />
      </head>
      <body>
        <QueryProvider>
          <AuthProvider>
            <ThemeProvider defaultMode="system">
              <PreferencesSync />
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
