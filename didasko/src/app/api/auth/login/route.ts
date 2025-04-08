import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateToken, setAuthCookie } from '@/lib/auth';
import { Role, WorkType } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permission: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: 'User not found',
          message: 'No account found with this email address.',
        },
        { status: 404 },
      );
    }

    // Check if user has permission
    if (user.permission !== 'GRANTED') {
      return NextResponse.json(
        {
          error: 'Access denied',
          message:
            'You do not have permission to login. Please contact your administrator.',
        },
        { status: 403 },
      );
    }

    // Generate JWT token
    if (!user.name || !user.email) {
      return NextResponse.json(
        { error: 'User data is incomplete' },
        { status: 400 },
      );
    }

    const token = generateToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    // Create response with cookie
    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      redirectPath: getRedirectPath(user.role),
    });

    // Set auth cookie
    setAuthCookie(token, response);

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 },
    );
  }
}

function getRedirectPath(role: Role): string {
  switch (role) {
    case 'ADMIN':
      return '/dashboard/admin';
    case 'FACULTY':
      return '/dashboard/faculty';
    case 'ACADEMIC_HEAD':
      return '/dashboard/academic-head';
    default:
      return '/dashboard';
  }
}
