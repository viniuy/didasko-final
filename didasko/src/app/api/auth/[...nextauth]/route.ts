import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { Account } from 'next-auth';

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
    async session({ session }) {
      if (session.user?.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email },
          });

          if (dbUser) {
            session.user.role = dbUser.role;
          }
        } catch (error) {
          console.error('Session error:', error);
        }
      }
      return session;
    },
    async jwt({ token, account }) {
      if (account) {
        token.role = account.role;
      }
      return token;
    },
    async redirect({ url, baseUrl }) {
      if (
        url.includes('callbackUrl') ||
        url === baseUrl ||
        url === `${baseUrl}/`
      ) {
        return `${baseUrl}/dashboard/academic-head`;
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
