import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { studies, patients, patientUserAccess, images, measurements } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';
import { updateStudySchema } from '@/lib/validations';

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET /api/studies/[id] - Get a single study with images and measurements
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Get study with patient info
    const studyResult = await db
      .select({
        study: studies,
        patient: patients,
      })
      .from(studies)
      .innerJoin(patients, eq(patients.id, studies.patientId))
      .where(eq(studies.id, id))
      .limit(1);

    if (studyResult.length === 0) {
      throw new Error('Study not found');
    }

    const { study, patient } = studyResult[0];

    // Check access
    if (user.role !== 'admin' && patient.institutionId !== user.institutionId) {
      const access = await db
        .select()
        .from(patientUserAccess)
        .where(
          and(
            eq(patientUserAccess.patientId, patient.id),
            eq(patientUserAccess.userId, user.id)
          )
        )
        .limit(1);

      if (access.length === 0) {
        throw new Error('Forbidden: No access to this study');
      }
    }

    // Get images for this study
    const studyImages = await db
      .select()
      .from(images)
      .where(eq(images.studyId, id))
      .orderBy(images.createdAt);

    // Get measurements for this study
    const studyMeasurements = await db
      .select()
      .from(measurements)
      .where(eq(measurements.studyId, id))
      .orderBy(measurements.createdAt);

    return successResponse({
      ...study,
      patient,
      images: studyImages,
      measurements: studyMeasurements,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

// PATCH /api/studies/[id] - Update a study
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Check if user can update studies
    if (!['admin', 'radiologist', 'clinician'].includes(user.role)) {
      throw new Error('Forbidden: Insufficient permissions');
    }

    const body = await request.json();
    const validatedData = updateStudySchema.parse(body);

    // Get study with patient info
    const studyResult = await db
      .select({
        study: studies,
        patient: patients,
      })
      .from(studies)
      .innerJoin(patients, eq(patients.id, studies.patientId))
      .where(eq(studies.id, id))
      .limit(1);

    if (studyResult.length === 0) {
      throw new Error('Study not found');
    }

    const { patient } = studyResult[0];

    // Check access
    if (user.role !== 'admin' && patient.institutionId !== user.institutionId) {
      const access = await db
        .select()
        .from(patientUserAccess)
        .where(
          and(
            eq(patientUserAccess.patientId, patient.id),
            eq(patientUserAccess.userId, user.id),
            or(
              eq(patientUserAccess.accessLevel, 'owner'),
              eq(patientUserAccess.accessLevel, 'write')
            )
          )
        )
        .limit(1);

      if (access.length === 0) {
        throw new Error('Forbidden: No write access to this study');
      }
    }

    // Update study
    const [updatedStudy] = await db
      .update(studies)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(studies.id, id))
      .returning();

    return successResponse(updatedStudy);
  } catch (error) {
    return errorResponse(error);
  }
}

// DELETE /api/studies/[id] - Delete a study
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Only admins can delete studies
    if (user.role !== 'admin') {
      throw new Error('Forbidden: Only administrators can delete studies');
    }

    // Check if study exists
    const existingStudy = await db
      .select()
      .from(studies)
      .where(eq(studies.id, id))
      .limit(1);

    if (existingStudy.length === 0) {
      throw new Error('Study not found');
    }

    // Delete study (this will cascade to related images and measurements due to foreign keys)
    await db.delete(studies).where(eq(studies.id, id));

    return successResponse({ message: 'Study deleted successfully' });
  } catch (error) {
    return errorResponse(error);
  }
}