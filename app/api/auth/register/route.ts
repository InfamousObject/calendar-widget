import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth-utils';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { log } from '@/lib/logger';

/**
 * Password schema with complexity requirements
 */
const passwordSchema = z.string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

/**
 * Registration schema validation
 */
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: passwordSchema,
  name: z.string().min(1, 'Name is required'),
  businessName: z.string().optional(),
});

/**
 * POST /api/auth/register
 * Register a new user
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const validatedData = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(validatedData.password);

    // Sequential writes to avoid implicit transactions (PgBouncer compatible)
    const userId = randomUUID();
    const user = await prisma.user.create({
      data: {
        id: userId,
        email: validatedData.email,
        name: validatedData.name,
        passwordHash,
        businessName: validatedData.businessName,
      },
      select: {
        id: true,
        email: true,
        name: true,
        widgetId: true,
      },
    });
    await prisma.widgetConfig.create({
      data: {
        userId,
        primaryColor: '#3b82f6',
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        borderRadius: 'medium',
        fontFamily: 'system',
        position: 'bottom-right',
        offsetX: 20,
        offsetY: 20,
        showOnMobile: true,
        delaySeconds: 0,
      },
    });

    return NextResponse.json(
      {
        message: 'User created successfully',
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    log.error('Registration error', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
