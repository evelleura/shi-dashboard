import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'SHI Dashboard',
  description: 'PT Smart Home Inovasi - Project Management Dashboard',
  // Set favicon lengkap di public/ (favicon.ico + svg + png + apple + manifest).
  // Next.js menyuntik <link> yang sesuai ke <head>.
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-96x96.png', type: 'image/png', sizes: '96x96' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  manifest: '/site.webmanifest',
};

// Inline script to prevent flash of wrong theme (runs before React hydrates).
// Mode tersimpan: 'light' | 'dark' | 'system' (default 'system' = ikut OS).
const themeScript = `(function(){try{var m=localStorage.getItem('shi-theme');var d=window.matchMedia('(prefers-color-scheme:dark)').matches;if(m==='dark'||((m==='system'||!m)&&d)){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
