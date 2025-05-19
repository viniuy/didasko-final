import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/lib/prisma';
import { Role } from '@/lib/types';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      httpOptions: {
        timeout: 10000,
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) {
        console.error('SignIn Error: No email provided');
        return false;
      }

      try {
        // Check if user exists in our database
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (!dbUser) {
          console.error(
            `SignIn Error: User ${user.email} not found in database`,
          );
          return false;
        }

        if (dbUser.permission !== 'GRANTED') {
          console.error(
            `SignIn Error: User ${user.email} does not have GRANTED permission`,
          );
          return false;
        }

        // Set the user's role and id from the database
        user.role = dbUser.role;
        user.id = dbUser.id;
        console.log('SignIn Success - User authenticated:', {
          email: user.email,
          role: user.role,
        });

        // If this is a Google account, ensure it's linked
        if (account?.provider === 'google') {
          try {
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
              console.log(
                'Google account linked successfully for user:',
                user.email,
              );
            }
          } catch (error) {
            console.error('Error linking Google account:', error);
            // Don't fail the sign in if account linking fails
          }
        }

        return true;
      } catch (error) {
        console.error('Sign in error:', error);
        return false;
      }
    },
    async jwt({ token, user, account, trigger }) {
      try {
        if (user) {
          token.id = user.id;
          token.role = user.role;
          token.email = user.email;
          token.image = user.image;
        } else if (token?.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email },
            select: { name: true, id: true, role: true, image: true },
          });

          if (dbUser) {
            token.name = dbUser.name;
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.image = dbUser.image;
          } else {
            console.error(
              'JWT Error: User not found in database for token:',
              token.email,
            );
          }
        }

        return token;
      } catch (error) {
        console.error('JWT callback error:', error);
        return token;
      }
    },
    async session({ session, token }) {
      try {
        if (session.user?.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { name: true, id: true, role: true, image: true },
          });

          if (dbUser) {
            session.user.name = dbUser.name;
            session.user.id = dbUser.id;
            session.user.role = dbUser.role;
            session.user.image = dbUser.image || undefined;
          } else {
            console.error(
              'Session Error: User not found in database:',
              session.user.email,
            );
          }
        }
        return session;
      } catch (error) {
        console.error('Session callback error:', error);
        return session;
      }
    },
    async redirect({ url, baseUrl }) {
      try {
        if (
          url.includes('callbackUrl') ||
          url === baseUrl ||
          url === `${baseUrl}/`
        ) {
          const session = await getServerSession(authOptions);

          if (session?.user?.role) {
            const roleBasedRedirects = {
              ADMIN: `${baseUrl}/dashboard/admin`,
              ACADEMIC_HEAD: `${baseUrl}/dashboard/academic-head`,
              FACULTY: `${baseUrl}/dashboard/faculty`,
            };

            return (
              roleBasedRedirects[
                session.user.role as keyof typeof roleBasedRedirects
              ] || `${baseUrl}/dashboard`
            );
          }
        }
        return url;
      } catch (error) {
        console.error('Redirect callback error:', error);
        return baseUrl;
      }
    },
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === 'development',
});

export { handler as GET, handler as POST };
