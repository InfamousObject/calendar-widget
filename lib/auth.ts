import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { Redis } from '@upstash/redis';
import { log } from '@/lib/logger';

// Initialize Redis for account lockout tracking
let redis: Redis | null = null;
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = Redis.fromEnv();
  }
} catch (error) {
  log.error('[Auth] Redis initialization failed', error);
}

/**
 * Check if account is locked due to failed login attempts
 */
async function isAccountLocked(email: string): Promise<boolean> {
  if (!redis) return false; // No Redis = no lockout in development

  const attempts = await redis.get(`login:attempts:${email}`);
  const locked = (attempts as number) >= 5;

  if (locked) {
    log.warn('[Auth] Account locked', { email, attempts }); // Auto-redacted
  }

  return locked;
}

/**
 * Record a failed login attempt
 */
async function recordFailedLogin(email: string): Promise<void> {
  if (!redis) return; // No Redis = no tracking in development

  const attempts = await redis.incr(`login:attempts:${email}`);

  if (attempts === 1) {
    // Set 15-minute expiration on first failed attempt
    await redis.expire(`login:attempts:${email}`, 900);
  }

  log.warn('[Auth] Failed login attempt', { email, attempts, maxAttempts: 5 }); // Auto-redacted
}

/**
 * Clear failed login attempts after successful login
 */
async function clearFailedAttempts(email: string): Promise<void> {
  if (!redis) return;

  await redis.del(`login:attempts:${email}`);
  log.info('[Auth] Cleared failed attempts', { email }); // Auto-redacted
}

/**
 * NextAuth configuration
 */
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        // Check if account is locked due to too many failed attempts
        const locked = await isAccountLocked(credentials.email);
        if (locked) {
          throw new Error('Account locked due to too many failed login attempts. Please try again in 15 minutes.');
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user || !user.passwordHash) {
          // Record failed attempt even if user doesn't exist (prevents user enumeration timing attacks)
          await recordFailedLogin(credentials.email);
          throw new Error('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          // Record failed login attempt
          await recordFailedLogin(credentials.email);
          throw new Error('Invalid credentials');
        }

        // Clear failed attempts on successful login
        await clearFailedAttempts(credentials.email);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};
