import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { patients, patientUserAccess } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';
import { updatePatientSchema } from '@/lib/validations';

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET /api/patients/[id] - Get a single patient
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Check if user has access to this patient
    const patient = await db
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
      )
      .where(
        and(
          eq(patients.id, id),
          user.role !== 'admin'
            ? or(
                eq(patients.institutionId, user.institutionId),
                eq(patientUserAccess.userId, user.id)
              )
            : undefined
        )
      )
      .limit(1);

    if (patient.length === 0) {
      throw new Error('Patient not found or access denied');
    }

    return successResponse(patient[0].patient);
  } catch (error) {
    return errorResponse(error);
  }
}

// PATCH /api/patients/[id] - Update a patient
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Check permissions
    if (!['admin', 'radiologist', 'clinician'].includes(user.role)) {
      // Check if user has write access
      const access = await db
        .select()
        .from(patientUserAccess)
        .where(
          and(
            eq(patientUserAccess.patientId, id),
            eq(patientUserAccess.userId, user.id),
            eq(patientUserAccess.accessLevel, 'write')
          )
        )
        .limit(1);

      if (access.length === 0) {
        throw new Error('Forbidden: Insufficient permissions');
      }
    }

    const body = await request.json();
    const validatedData = updatePatientSchema.parse(body);

    // Check if patient exists and user has access
    const existingPatient = await db
      .select()
      .from(patients)
      .where(
        and(
          eq(patients.id, id),
          user.role !== 'admin'
            ? eq(patients.institutionId, user.institutionId)
            : undefined
        )
      )
      .limit(1);

    if (existingPatient.length === 0) {
      throw new Error('Patient not found');
    }

    // Update patient
    const updateData: Partial<typeof patients.$inferInsert> = {
      ...validatedData,
      updatedAt: new Date(),
    };

    if (validatedData.dateOfBirth) {
      updateData.dateOfBirth = new Date(validatedData.dateOfBirth);
    }

    const [updatedPatient] = await db
      .update(patients)
      .set(updateData)
      .where(eq(patients.id, id))
      .returning();

    return successResponse(updatedPatient);
  } catch (error) {
    return errorResponse(error);
  }
}

// DELETE /api/patients/[id] - Delete a patient (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Only admins can delete patients
    if (user.role !== 'admin') {
      throw new Error('Forbidden: Only administrators can delete patients');
    }

    // Check if patient exists
    const existingPatient = await db
      .select()
      .from(patients)
      .where(eq(patients.id, id))
      .limit(1);

    if (existingPatient.length === 0) {
      throw new Error('Patient not found');
    }

    // For now, we'll do a hard delete. In production, you might want to implement soft delete
    await db.delete(patients).where(eq(patients.id, id));

    return successResponse({ message: 'Patient deleted successfully' });
  } catch (error) {
    return errorResponse(error);
  }
}