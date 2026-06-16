// Gerbang autentikasi untuk semua halaman terlindungi.
import { NextResponse, type NextRequest } from 'next/server';

const HALAMAN_PUBLIK = ['/', '/login'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Lewatkan aset, API, dan halaman publik.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') ||
    HALAMAN_PUBLIK.includes(pathname)
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get('shi_session')?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
