import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { patients, patientUserAccess } from '@/db/schema';
import { eq, and, or, ilike } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';
import { createPatientSchema, searchSchema } from '@/lib/validations';

// GET /api/patients - List patients with search and pagination
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    
    const params = searchSchema.parse({
      query: searchParams.get('query') || undefined,
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    });

    const offset = (params.page - 1) * params.limit;

    // Build query based on user role
    let baseQuery = db
      .select({
        patient: patients,
        access: patientUserAccess,
      })
      .from(patients)
      .leftJoin(
        patientUserAccess,
        and(
          eq(patientUserAccess.patientId, patients.id),
          eq(patientUserAccess.userId, user.id)
        )
      );

    // Apply institution filter for non-admin users
    if (user.role !== 'admin') {
      baseQuery = baseQuery.where(
        or(
          eq(patients.institutionId, user.institutionId),
          eq(patientUserAccess.userId, user.id)
        )
      );
    }

    // Apply search filter
    if (params.query) {
      const searchPattern = `%${params.query}%`;
      baseQuery = baseQuery.where(
        or(
          ilike(patients.firstName, searchPattern),
          ilike(patients.lastName, searchPattern),
          ilike(patients.mrn, searchPattern)
        )
      );
    }

    // Execute query with pagination
    const results = await baseQuery
      .limit(params.limit)
      .offset(offset);

    // Get total count
    const countQuery = await db
      .select({ count: patients.id })
      .from(patients)
      .where(
        user.role !== 'admin'
          ? or(
              eq(patients.institutionId, user.institutionId),
              eq(patientUserAccess.userId, user.id)
            )
          : undefined
      );

    const totalCount = countQuery.length;
    const totalPages = Math.ceil(totalCount / params.limit);

    return successResponse({
      patients: results.map(r => r.patient),
      pagination: {
        page: params.page,
        limit: params.limit,
        totalCount,
        totalPages,
        hasNextPage: params.page < totalPages,
        hasPreviousPage: params.page > 1,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

// POST /api/patients - Create a new patient
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    
    // Only admins, radiologists, and clinicians can create patients
    if (!['admin', 'radiologist', 'clinician'].includes(user.role)) {
      throw new Error('Forbidden: Insufficient permissions');
    }

    const body = await request.json();
    const validatedData = createPatientSchema.parse(body);

    // Check if MRN already exists for this institution
    const existingPatient = await db
      .select()
      .from(patients)
      .where(
        and(
          eq(patients.mrn, validatedData.mrn),
          eq(patients.institutionId, user.institutionId)
        )
      )
      .limit(1);

    if (existingPatient.length > 0) {
      throw new Error('Patient with this MRN already exists');
    }

    // Create patient
    const [newPatient] = await db
      .insert(patients)
      .values({
        ...validatedData,
        institutionId: user.institutionId,
        dateOfBirth: new Date(validatedData.dateOfBirth),
      })
      .returning();

    // Create access record for the creating user
    await db.insert(patientUserAccess).values({
      patientId: newPatient.id,
      userId: user.id,
      accessLevel: 'owner',
    });

    return successResponse(newPatient, 201);
  } catch (error) {
    return errorResponse(error);
  }
}