import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { studies, patients, patientUserAccess, images, measurements } from '@/db/schema';
import { eq, and, or, desc, sql } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';
import { createStudySchema, searchSchema } from '@/lib/validations';

// GET /api/studies - List studies with pagination
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    
    const params = searchSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      sortBy: searchParams.get('sortBy') || 'studyDate',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    });

    const patientId = searchParams.get('patientId');
    const status = searchParams.get('status');
    const offset = (params.page - 1) * params.limit;

    // Build base query
    let baseQuery = db
      .select({
        study: studies,
        patient: patients,
        imageCount: sql<number>`count(distinct ${images.id})::int`,
        measurementCount: sql<number>`count(distinct ${measurements.id})::int`,
      })
      .from(studies)
      .innerJoin(patients, eq(patients.id, studies.patientId))
      .leftJoin(images, eq(images.studyId, studies.id))
      .leftJoin(measurements, eq(measurements.studyId, studies.id))
      .groupBy(studies.id, patients.id);

    // Apply filters
    const conditions = [];

    // Patient filter
    if (patientId) {
      conditions.push(eq(studies.patientId, patientId));
    }

    // Status filter
    if (status) {
      conditions.push(eq(studies.status, status as 'pending' | 'processing' | 'completed' | 'failed' | 'archived'));
    }

    // Access control
    if (user.role !== 'admin') {
      // User can see studies for patients in their institution or patients they have access to
      const accessiblePatients = db
        .select({ patientId: patientUserAccess.patientId })
        .from(patientUserAccess)
        .where(eq(patientUserAccess.userId, user.id));

      conditions.push(
        or(
          eq(patients.institutionId, user.institutionId),
          sql`${studies.patientId} IN (${accessiblePatients})`
        )
      );
    }

    if (conditions.length > 0) {
      baseQuery = baseQuery.where(and(...conditions));
    }

    // Apply sorting
    if (params.sortOrder === 'desc') {
      baseQuery = baseQuery.orderBy(desc(studies[params.sortBy as keyof typeof studies]));
    } else {
      baseQuery = baseQuery.orderBy(studies[params.sortBy as keyof typeof studies]);
    }

    // Execute query with pagination
    const results = await baseQuery
      .limit(params.limit)
      .offset(offset);

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(distinct ${studies.id})` })
      .from(studies)
      .innerJoin(patients, eq(patients.id, studies.patientId))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const totalCount = Number(countResult[0].count);
    const totalPages = Math.ceil(totalCount / params.limit);

    return successResponse({
      studies: results,
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

// POST /api/studies - Create a new study
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    
    // Only certain roles can create studies
    if (!['admin', 'radiologist', 'clinician'].includes(user.role)) {
      throw new Error('Forbidden: Insufficient permissions');
    }

    const body = await request.json();
    const validatedData = createStudySchema.parse(body);

    // Verify patient exists and user has access
    const patient = await db
      .select()
      .from(patients)
      .where(eq(patients.id, validatedData.patientId))
      .limit(1);

    if (patient.length === 0) {
      throw new Error('Patient not found');
    }

    // Check if user has access to this patient
    if (user.role !== 'admin' && patient[0].institutionId !== user.institutionId) {
      const access = await db
        .select()
        .from(patientUserAccess)
        .where(
          and(
            eq(patientUserAccess.patientId, validatedData.patientId),
            eq(patientUserAccess.userId, user.id)
          )
        )
        .limit(1);

      if (access.length === 0) {
        throw new Error('Forbidden: No access to this patient');
      }
    }

    // Create study
    const [newStudy] = await db
      .insert(studies)
      .values({
        ...validatedData,
        studyDate: new Date(validatedData.studyDate),
        createdBy: user.id,
        status: 'pending',
      })
      .returning();

    return successResponse(newStudy, 201);
  } catch (error) {
    return errorResponse(error);
  }
}