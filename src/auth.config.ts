import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAdmin = nextUrl.pathname.startsWith('/admin');
      const isOnKitchen = nextUrl.pathname.startsWith('/kitchen');
      const isOnWaiter = nextUrl.pathname.startsWith('/waiter');
      const isOnLogin = nextUrl.pathname === '/login';

      if (isOnLogin && isLoggedIn) {
        // Redirect to their dashboard if already logged in
        const role = (auth.user as any).role;
        if (role === 'ADMIN') return Response.redirect(new URL('/admin', nextUrl));
        if (role === 'KITCHEN') return Response.redirect(new URL('/kitchen', nextUrl));
        if (role === 'WAITER') return Response.redirect(new URL('/waiter', nextUrl));
      }

      if (isOnAdmin || isOnKitchen || isOnWaiter) {
        if (isLoggedIn) {
          const userRole = (auth.user as any).role;
          if (isOnAdmin && userRole !== 'ADMIN') {
            return Response.redirect(new URL('/unauthorized', nextUrl));
          }
          if (isOnKitchen && userRole !== 'KITCHEN' && userRole !== 'ADMIN') {
            return Response.redirect(new URL('/unauthorized', nextUrl));
          }
          if (isOnWaiter && userRole !== 'WAITER' && userRole !== 'ADMIN') {
            return Response.redirect(new URL('/unauthorized', nextUrl));
          }
          return true;
        }
        return false; // Redirect to login
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role as string;
        (session.user as any).id = token.id as string;
      }
      return session;
    },
  },
  providers: [], // Configured in src/auth.ts
} satisfies NextAuthConfig;
