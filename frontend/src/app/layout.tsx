import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'SHI Dashboard',
  description: 'PT Smart Home Inovasi - Project Management Dashboard',
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
