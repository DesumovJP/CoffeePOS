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
    default: 'Smak',
    template: '%s | Smak',
  },
  description: 'Гнучка POS-система для HoReCa — ресторани, кафе, бари, готелі.',
  keywords: ['POS', 'HoReCa', 'ресторан', 'кафе', 'бар', 'готель', 'облік', 'бізнес'],
  authors: [{ name: 'Smak' }],
  creator: 'Smak',
  publisher: 'Smak',
  robots: {
    index: false,
    follow: false,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Smak',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'uk_UA',
    siteName: 'Smak',
    title: 'Smak — гнучка POS-система для HoReCa',
    description: 'Гнучка система для ведення бізнесу. Ресторани, кафе, бари, готелі.',
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
