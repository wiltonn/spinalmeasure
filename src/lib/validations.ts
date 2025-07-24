import { z } from 'zod';

// Patient schemas
export const createPatientSchema = z.object({
  mrn: z.string().min(1, 'MRN is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
  sex: z.enum(['male', 'female', 'other', 'unknown']).default('unknown'),
  primaryLanguage: z.string().default('en'),
});

export const updatePatientSchema = createPatientSchema.partial();

// Study schemas
export const createStudySchema = z.object({
  patientId: z.string().uuid('Invalid patient ID'),
  studyDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
  accessionNumber: z.string().optional(),
  description: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const updateStudySchema = z.object({
  description: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'archived']).optional(),
});

// Image upload schema
export const uploadImageSchema = z.object({
  studyId: z.string().uuid('Invalid study ID'),
  fileName: z.string().min(1, 'File name is required'),
  fileSize: z.number().positive('File size must be positive'),
  mimeType: z.enum(['image/jpeg', 'image/png', 'application/dicom']),
});

// Measurement schemas
export const createMeasurementSchema = z.object({
  imageId: z.string().uuid('Invalid image ID'),
  studyId: z.string().uuid('Invalid study ID'),
  modelVersion: z.string().min(1, 'Model version is required'),
  primaryAngle: z.number().optional(),
  secondaryAngle: z.number().optional(),
  primaryConfidence: z.number().min(0).max(100).optional(),
  secondaryConfidence: z.number().min(0).max(100).optional(),
  severity: z.enum(['normal', 'mild', 'moderate', 'severe']).optional(),
  vertebraeDetected: z.record(z.string(), z.any()).optional(),
  measurementData: z.record(z.string(), z.any()).optional(),
  needsReview: z.boolean().default(false),
});

export const reviewMeasurementSchema = z.object({
  reviewNotes: z.string().optional(),
  primaryAngle: z.number().optional(),
  secondaryAngle: z.number().optional(),
});

// Report schemas
export const generateReportSchema = z.object({
  studyId: z.string().uuid('Invalid study ID'),
  templateId: z.string().uuid('Invalid template ID').optional(),
  reportData: z.record(z.string(), z.any()).optional(),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Search schema
export const searchSchema = z.object({
  query: z.string().optional(),
  filters: z.record(z.string(), z.any()).optional(),
}).merge(paginationSchema);