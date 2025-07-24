import { pgTable, uuid, text, timestamp, pgEnum, boolean, date, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'radiologist', 'clinician', 'researcher', 'viewer']);
export const patientSexEnum = pgEnum('patient_sex', ['male', 'female', 'other', 'unknown']);
export const accessLevelEnum = pgEnum('access_level', ['owner', 'read', 'write']);

// Institution table
export const institutions = pgTable('institutions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  address: text('address'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// User table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  institutionId: uuid('institution_id').notNull().references(() => institutions.id),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  firstName: text('first_name'),
  lastName: text('last_name'),
  role: userRoleEnum('role').notNull().default('viewer'),
  mfaEnabled: boolean('mfa_enabled').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Patient table
export const patients = pgTable('patients', {
  id: uuid('id').primaryKey().defaultRandom(),
  institutionId: uuid('institution_id').notNull().references(() => institutions.id),
  mrn: text('mrn').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  dateOfBirth: date('date_of_birth').notNull(),
  sex: patientSexEnum('sex').notNull().default('unknown'),
  primaryLanguage: text('primary_language').default('en'),
  isDeceased: boolean('is_deceased').notNull().default(false),
  dateOfDeath: date('date_of_death'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  mrnInstitutionIdx: uniqueIndex('mrn_institution_idx').on(table.mrn, table.institutionId),
}));

// Patient-User Access table
export const patientUserAccess = pgTable('patient_user_access', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  patientId: uuid('patient_id').notNull().references(() => patients.id),
  accessLevel: accessLevelEnum('access_level').notNull().default('read'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Relations
export const institutionsRelations = relations(institutions, ({ many }) => ({
  users: many(users),
  patients: many(patients),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  institution: one(institutions, {
    fields: [users.institutionId],
    references: [institutions.id],
  }),
  patientAccess: many(patientUserAccess),
}));

export const patientsRelations = relations(patients, ({ one, many }) => ({
  institution: one(institutions, {
    fields: [patients.institutionId],
    references: [institutions.id],
  }),
  userAccess: many(patientUserAccess),
}));

export const patientUserAccessRelations = relations(patientUserAccess, ({ one }) => ({
  user: one(users, {
    fields: [patientUserAccess.userId],
    references: [users.id],
  }),
  patient: one(patients, {
    fields: [patientUserAccess.patientId],
    references: [patients.id],
  }),
}));