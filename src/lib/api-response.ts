import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
};

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json<ApiResponse<T>>(
    { success: true, data },
    { status }
  );
}

export function errorResponse(error: unknown, status = 400) {
  // Handle ZodError specifically
  if (error instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    error.errors?.forEach((err) => {
      const path = err.path.join('.');
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(err.message);
    });
    
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Validation failed',
        errors,
      },
      { status: 400 }
    );
  }

  // Handle object with ZodError-like structure (from safeParse)
  if (error && typeof error === 'object' && 'issues' in error) {
    const zodError = error as { issues: any[] };
    const errors: Record<string, string[]> = {};
    zodError.issues?.forEach((err) => {
      const path = err.path?.join('.') || 'unknown';
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(err.message || 'Validation error');
    });
    
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Validation failed',
        errors,
      },
      { status: 400 }
    );
  }

  if (error instanceof Error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    if (error.message.startsWith('Forbidden')) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json<ApiResponse>(
      { success: false, error: error.message },
      { status }
    );
  }

  return NextResponse.json<ApiResponse>(
    { success: false, error: 'An unexpected error occurred' },
    { status: 500 }
  );
}