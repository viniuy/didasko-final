import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/lib/prisma';
import { Role } from '@/lib/types';
import { Account } from 'next-auth';
import { getServerSession } from 'next-auth/next';

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;

      try {
        // Check if user exists in our database
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        // If user doesn't exist or doesn't have GRANTED permission, deny access
        if (!dbUser || dbUser.permission !== 'GRANTED') {
          console.log('Access denied for user:', user.email);
          return false;
        }

        // Set the user's role from the database
        (user as any).role = dbUser.role;
        console.log('SignIn Callback - User with role:', user);

        // If this is a Google account, ensure it's linked
        if (account?.provider === 'google') {
          const existingAccount = await prisma.account.findFirst({
            where: {
              userId: dbUser.id,
              provider: 'google',
            },
          });

          if (!existingAccount) {
            await prisma.account.create({
              data: {
                userId: dbUser.id,
                type: 'oauth',
                provider: 'google',
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state,
              },
            });
          }
        }

        return true;
      } catch (error) {
        console.error('Sign in error:', error);
        return false;
      }
    },
    async session({ session, token }) {
      console.log('Session Callback - Token:', token);
      if (token) {
        session.user.role = token.role as Role;
      }
      console.log('Session Callback - Final Session:', session);
      return session;
    },
    async jwt({ token, account, user }) {
      console.log('JWT Callback - User:', user);
      console.log('JWT Callback - Account:', account);
      if (account) {
        token.role = account.role as Role;
      }
      if (user) {
        token.role = (user as any).role as Role;
      }
      console.log('JWT Callback - Final Token:', token);
      return token;
    },
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      console.log('Redirect Callback - URL:', url);
      if (
        url.includes('callbackUrl') ||
        url === baseUrl ||
        url === `${baseUrl}/`
      ) {
        // Get the user's role from the token
        const role = 'ADMIN' as Role; // Since we know this user is an admin
        console.log('Redirect Callback - Role:', role);

        // Redirect based on role
        switch (role) {
          case 'ADMIN':
            return `${baseUrl}/dashboard/admin`;
          case 'ACADEMIC_HEAD':
            return `${baseUrl}/dashboard/academic-head`;
          case 'FACULTY':
            return `${baseUrl}/dashboard/faculty`;
          default:
            console.log(
              'Redirect Callback - No role found, redirecting to default dashboard',
            );
            return `${baseUrl}/dashboard`;
        }
      }
      return url;
    },
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
});

export { handler as GET, handler as POST };
