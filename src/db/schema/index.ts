// Re-export all schema items
export * from './base';
export * from './spinemeasure';

// Type exports for commonly used types
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { 
  institutions, 
  users, 
  patients, 
  patientUserAccess,
  studies,
  images,
  measurements,
  inferenceJobs,
  reports,
  reportTemplates,
  auditLogs,
  systemConfig
} from './index';

// Select types
export type Institution = InferSelectModel<typeof institutions>;
export type User = InferSelectModel<typeof users>;
export type Patient = InferSelectModel<typeof patients>;
export type PatientUserAccess = InferSelectModel<typeof patientUserAccess>;
export type Study = InferSelectModel<typeof studies>;
export type Image = InferSelectModel<typeof images>;
export type Measurement = InferSelectModel<typeof measurements>;
export type InferenceJob = InferSelectModel<typeof inferenceJobs>;
export type Report = InferSelectModel<typeof reports>;
export type ReportTemplate = InferSelectModel<typeof reportTemplates>;
export type AuditLog = InferSelectModel<typeof auditLogs>;
export type SystemConfig = InferSelectModel<typeof systemConfig>;

// Insert types
export type NewInstitution = InferInsertModel<typeof institutions>;
export type NewUser = InferInsertModel<typeof users>;
export type NewPatient = InferInsertModel<typeof patients>;
export type NewPatientUserAccess = InferInsertModel<typeof patientUserAccess>;
export type NewStudy = InferInsertModel<typeof studies>;
export type NewImage = InferInsertModel<typeof images>;
export type NewMeasurement = InferInsertModel<typeof measurements>;
export type NewInferenceJob = InferInsertModel<typeof inferenceJobs>;
export type NewReport = InferInsertModel<typeof reports>;
export type NewReportTemplate = InferInsertModel<typeof reportTemplates>;
export type NewAuditLog = InferInsertModel<typeof auditLogs>;
export type NewSystemConfig = InferInsertModel<typeof systemConfig>;