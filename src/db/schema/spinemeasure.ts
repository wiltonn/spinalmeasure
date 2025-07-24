import { pgTable, uuid, text, timestamp, pgEnum, boolean, integer, jsonb, decimal, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { patients, users, institutions } from './base';

// Enums
export const studyStatusEnum = pgEnum('study_status', ['pending', 'processing', 'completed', 'failed', 'archived']);
export const imageStatusEnum = pgEnum('image_status', ['uploaded', 'validating', 'processing', 'processed', 'failed']);
export const severityLevelEnum = pgEnum('severity_level', ['normal', 'mild', 'moderate', 'severe']);
export const jobStatusEnum = pgEnum('job_status', ['queued', 'running', 'completed', 'failed', 'cancelled']);
export const reportStatusEnum = pgEnum('report_status', ['draft', 'final', 'amended', 'cancelled']);

// Study table
export const studies = pgTable('studies', {
  id: uuid('id').primaryKey().defaultRandom(),
  patientId: uuid('patient_id').notNull().references(() => patients.id),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  studyDate: timestamp('study_date', { withTimezone: true }).notNull(),
  accessionNumber: text('accession_number'),
  description: text('description'),
  status: studyStatusEnum('status').notNull().default('pending'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  accessionNumberIdx: uniqueIndex('accession_number_idx').on(table.accessionNumber),
}));

// Image table
export const images = pgTable('images', {
  id: uuid('id').primaryKey().defaultRandom(),
  studyId: uuid('study_id').notNull().references(() => studies.id),
  fileName: text('file_name').notNull(),
  fileSize: integer('file_size').notNull(),
  mimeType: text('mime_type').notNull(),
  s3Key: text('s3_key').notNull(),
  s3Bucket: text('s3_bucket').notNull(),
  width: integer('width'),
  height: integer('height'),
  dicomMetadata: jsonb('dicom_metadata'),
  status: imageStatusEnum('status').notNull().default('uploaded'),
  processingError: text('processing_error'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Measurement table
export const measurements = pgTable('measurements', {
  id: uuid('id').primaryKey().defaultRandom(),
  imageId: uuid('image_id').notNull().references(() => images.id),
  studyId: uuid('study_id').notNull().references(() => studies.id),
  modelVersion: text('model_version').notNull(),
  primaryAngle: decimal('primary_angle', { precision: 5, scale: 2 }),
  secondaryAngle: decimal('secondary_angle', { precision: 5, scale: 2 }),
  primaryConfidence: decimal('primary_confidence', { precision: 5, scale: 2 }),
  secondaryConfidence: decimal('secondary_confidence', { precision: 5, scale: 2 }),
  severity: severityLevelEnum('severity'),
  vertebraeDetected: jsonb('vertebrae_detected'),
  measurementData: jsonb('measurement_data'),
  needsReview: boolean('needs_review').notNull().default(false),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  reviewNotes: text('review_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Inference Job table
export const inferenceJobs = pgTable('inference_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  imageId: uuid('image_id').notNull().references(() => images.id),
  runpodJobId: text('runpod_job_id'),
  status: jobStatusEnum('status').notNull().default('queued'),
  modelName: text('model_name').notNull(),
  modelVersion: text('model_version').notNull(),
  input: jsonb('input'),
  output: jsonb('output'),
  error: text('error'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Report table
export const reports = pgTable('reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  studyId: uuid('study_id').notNull().references(() => studies.id),
  templateId: uuid('template_id').references(() => reportTemplates.id),
  generatedBy: uuid('generated_by').notNull().references(() => users.id),
  status: reportStatusEnum('status').notNull().default('draft'),
  pdfUrl: text('pdf_url'),
  pdfS3Key: text('pdf_s3_key'),
  reportData: jsonb('report_data'),
  fhirResource: jsonb('fhir_resource'),
  signedBy: uuid('signed_by').references(() => users.id),
  signedAt: timestamp('signed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Report Template table
export const reportTemplates = pgTable('report_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  institutionId: uuid('institution_id').notNull().references(() => institutions.id),
  name: text('name').notNull(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  templateData: jsonb('template_data').notNull(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Audit Log table
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  institutionId: uuid('institution_id').notNull().references(() => institutions.id),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: uuid('entity_id'),
  metadata: jsonb('metadata'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// System Configuration table
export const systemConfig = pgTable('system_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: text('key').notNull().unique(),
  value: jsonb('value').notNull(),
  description: text('description'),
  updatedBy: uuid('updated_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Relations
export const studiesRelations = relations(studies, ({ one, many }) => ({
  patient: one(patients, {
    fields: [studies.patientId],
    references: [patients.id],
  }),
  createdByUser: one(users, {
    fields: [studies.createdBy],
    references: [users.id],
  }),
  images: many(images),
  measurements: many(measurements),
  reports: many(reports),
}));

export const imagesRelations = relations(images, ({ one, many }) => ({
  study: one(studies, {
    fields: [images.studyId],
    references: [studies.id],
  }),
  measurements: many(measurements),
  inferenceJobs: many(inferenceJobs),
}));

export const measurementsRelations = relations(measurements, ({ one }) => ({
  image: one(images, {
    fields: [measurements.imageId],
    references: [images.id],
  }),
  study: one(studies, {
    fields: [measurements.studyId],
    references: [studies.id],
  }),
  reviewedByUser: one(users, {
    fields: [measurements.reviewedBy],
    references: [users.id],
  }),
}));

export const inferenceJobsRelations = relations(inferenceJobs, ({ one }) => ({
  image: one(images, {
    fields: [inferenceJobs.imageId],
    references: [images.id],
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  study: one(studies, {
    fields: [reports.studyId],
    references: [studies.id],
  }),
  template: one(reportTemplates, {
    fields: [reports.templateId],
    references: [reportTemplates.id],
  }),
  generatedByUser: one(users, {
    fields: [reports.generatedBy],
    references: [users.id],
  }),
  signedByUser: one(users, {
    fields: [reports.signedBy],
    references: [users.id],
  }),
}));

export const reportTemplatesRelations = relations(reportTemplates, ({ one, many }) => ({
  institution: one(institutions, {
    fields: [reportTemplates.institutionId],
    references: [institutions.id],
  }),
  createdByUser: one(users, {
    fields: [reportTemplates.createdBy],
    references: [users.id],
  }),
  reports: many(reports),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
  institution: one(institutions, {
    fields: [auditLogs.institutionId],
    references: [institutions.id],
  }),
}));