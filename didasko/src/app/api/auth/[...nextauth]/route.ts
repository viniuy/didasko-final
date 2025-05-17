import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

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

        // Set the user's role and id from the database
        user.role = dbUser.role;
        user.id = dbUser.id;
        console.log('SignIn Callback - User with role and id:', user);

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
    async jwt({ token, user, account, trigger }) {
      console.log('JWT Callback - Incoming token:', token);
      console.log('JWT Callback - User:', user);

      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.email = user.email;
        token.image = user.image;
      } else if (token) {
        // If we have a token but no user, ensure the ID is preserved
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string },
          select: { name: true, id: true, role: true, image: true },
        });

        if (dbUser) {
          token.name = dbUser.name;
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.image = dbUser.image;
        }
      }

      console.log('JWT Callback - Final Token:', token);
      return token;
    },
    async session({ session, token }) {
      console.log('Session Callback - Incoming Token:', token);

      if (session.user && session.user.email) {
        try {
          // Query the user from database using email
          const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { name: true, id: true, role: true, image: true },
          });

          if (dbUser) {
            session.user.name = dbUser.name;
            session.user.id = dbUser.id;
            session.user.role = dbUser.role;
            session.user.image = dbUser.image || undefined;
            console.log('Found user in database:', dbUser);
          } else {
            console.log('User not found in database');
          }
        } catch (error) {
          console.error('Error fetching user in session callback:', error);
        }
      }

      console.log('Session Callback - Final Session:', session);
      return session;
    },
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      console.log('Redirect Callback - URL:', url);
      if (
        url.includes('callbackUrl') ||
        url === baseUrl ||
        url === `${baseUrl}/`
      ) {
        // Get the session from the token
        const session = await getServerSession(authOptions);

        console.log('Redirect Callback - Session:', session);

        if (session?.user?.role) {
          switch (session.user.role) {
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
