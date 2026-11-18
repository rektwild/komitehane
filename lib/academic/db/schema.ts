import {sql} from "drizzle-orm";
import {boolean, check, foreignKey, integer, numeric, pgTable, smallint, text, timestamp, unique, uniqueIndex, uuid} from "drizzle-orm/pg-core";

const id = () => uuid("id").defaultRandom().primaryKey();
const createdAt = () => timestamp("created_at", {withTimezone: true}).defaultNow().notNull();
const active = () => boolean("is_active").default(true).notNull();

export const universities = pgTable("universities", {
  id: id(), name: text("name").notNull(), slug: text("slug").notNull().unique(), officialCode: text("official_code").unique(), isActive: active(), createdAt: createdAt(), updatedAt: timestamp("updated_at", {withTimezone:true}),
});
export const faculties = pgTable("faculties", {
  id: id(), universityId: uuid("university_id").notNull().references(() => universities.id), name: text("name").notNull(), slug: text("slug").notNull(), isActive: active(), createdAt: createdAt(), updatedAt: timestamp("updated_at", {withTimezone:true}),
}, t => [unique("faculties_university_slug_unique").on(t.universityId,t.slug)]);
export const programs = pgTable("programs", {
  id: id(), facultyId: uuid("faculty_id").notNull().references(() => faculties.id), name: text("name").notNull(), slug: text("slug").notNull(), durationYears: integer("duration_years").notNull(), isActive: active(), createdAt: createdAt(), updatedAt: timestamp("updated_at", {withTimezone:true}),
}, t => [unique("programs_faculty_slug_unique").on(t.facultyId,t.slug), check("program_duration_check",sql`${t.durationYears} between 1 and 12`)]);
export const courses = pgTable("courses", {
  id: id(), programId: uuid("program_id").notNull().references(() => programs.id), name: text("name").notNull(), slug: text("slug").notNull(), courseCode: text("course_code"), isActive: active(), createdAt: createdAt(), updatedAt: timestamp("updated_at", {withTimezone:true}),
}, t => [unique("courses_program_slug_unique").on(t.programId,t.slug),unique("courses_program_id_unique").on(t.programId,t.id)]);
export const gradingSchemes = pgTable("grading_schemes", {
  id: id(), programId: uuid("program_id").notNull().references(() => programs.id), courseId: uuid("course_id"), academicYearStart: integer("academic_year_start").notNull(), classYear: smallint("class_year").notNull(), period: text("period").notNull(), systemType: text("system_type").notNull(), createdAt: createdAt(),
}, t => [
  foreignKey({name:"scheme_course_program_fk",columns:[t.programId,t.courseId],foreignColumns:[courses.programId,courses.id]}),
  check("scheme_course_system_check",sql`(${t.systemType} = 'COMMITTEE' and ${t.courseId} is null) or (${t.systemType} = 'MIDTERM' and ${t.courseId} is not null)`),
  check("scheme_period_check",sql`${t.period} in ('ANNUAL','FALL','SPRING')`),
  check("scheme_year_check",sql`${t.academicYearStart} between 1900 and 2200 and ${t.classYear} between 1 and 12`),
  uniqueIndex("grading_schemes_committee_unique").on(t.programId,t.academicYearStart,t.classYear,t.period).where(sql`${t.systemType} = 'COMMITTEE'`),
  uniqueIndex("grading_schemes_midterm_unique").on(t.programId,t.academicYearStart,t.classYear,t.period,t.courseId).where(sql`${t.systemType} = 'MIDTERM'`),
]);
export const gradingSchemeVersions = pgTable("grading_scheme_versions", {
  id:id(), schemeId:uuid("scheme_id").notNull().references(() => gradingSchemes.id), versionNumber:integer("version_number").notNull(), passingGrade:numeric("passing_grade",{precision:5,scale:2}).notNull(), status:text("status").notNull().default("DRAFT"), recordedAt:timestamp("recorded_at",{withTimezone:true}).notNull().defaultNow(), publishedAt:timestamp("published_at",{withTimezone:true}), supersededAt:timestamp("superseded_at",{withTimezone:true}), effectiveFrom:timestamp("effective_from",{withTimezone:true}), effectiveUntil:timestamp("effective_until",{withTimezone:true}), changeNote:text("change_note"),
}, t => [unique("version_scheme_number_unique").on(t.schemeId,t.versionNumber), uniqueIndex("grading_scheme_one_published_version").on(t.schemeId).where(sql`${t.status} = 'PUBLISHED'`), check("version_status_check",sql`${t.status} in ('DRAFT','PUBLISHED','SUPERSEDED')`),check("version_grade_check",sql`${t.passingGrade} between 0 and 100 and ${t.versionNumber} > 0`)]);
export const assessmentComponents = pgTable("assessment_components", {
  id:id(), versionId:uuid("version_id").notNull().references(() => gradingSchemeVersions.id), componentType:text("component_type").notNull(), position:smallint("position").notNull(), weightPercent:numeric("weight_percent",{precision:5,scale:2}).notNull(),
},t => [unique("component_position_unique").on(t.versionId,t.componentType,t.position),check("component_type_check",sql`${t.componentType} in ('COMMITTEE','MIDTERM','FINAL')`),check("component_weight_check",sql`${t.weightPercent} > 0 and ${t.weightPercent} <= 100 and ${t.position} > 0`)]);
export const gradingRuleSources = pgTable("grading_rule_sources", {
  id:id(), versionId:uuid("version_id").notNull().references(() => gradingSchemeVersions.id), sourceUrl:text("source_url").notNull(), sourceType:text("source_type").notNull(), verifiedAt:timestamp("verified_at",{withTimezone:true}).notNull(), sourceTitle:text("source_title"), sourceNote:text("source_note"),
});
