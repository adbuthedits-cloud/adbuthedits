import { NextResponse } from 'next/server';

export function middleware(request) {
    const token = request.cookies.get('admin_token')?.value;
    const { pathname } = request.nextUrl;

    // Check if the user is trying to access the login page
    if (pathname.startsWith('/login')) {
        // If they already have a token, redirect them to the dashboard
        if (token) {
            return NextResponse.redirect(new URL('/', request.url));
        }
        // Otherwise, let them proceed to the login page
        return NextResponse.next();
    }

    // Protect all other dashboard routes (excluding public/api routes in matcher)
    // If no token and not on the logout page, redirect to login
    if (!token && !pathname.startsWith('/logout')) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    // Matcher configures which paths the middleware should run on.
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - images/ (public images)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|images).*)',
    ],
};
