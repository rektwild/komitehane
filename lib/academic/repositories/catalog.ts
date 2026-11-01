import "server-only";
import {academicPool, academicYear} from "@/lib/academic/db/client";

export class AcademicUnavailable extends Error {}
function db() { const pool = academicPool(); if (!pool) throw new AcademicUnavailable("ACADEMIC_UNAVAILABLE"); return pool; }
export async function universities(search: string, limit: number, offset: number) {
  return (await db().query("SELECT id,name,slug FROM universities WHERE is_active AND name ILIKE $1 ORDER BY name,id LIMIT $2 OFFSET $3",[`%${search.replace(/[\\%_]/g,"\\$&")}%`,limit,offset])).rows;
}
export async function faculties(universityId: string) {
  return (await db().query("SELECT id,name,slug FROM faculties WHERE university_id=$1 AND is_active ORDER BY name,id LIMIT 100",[universityId])).rows;
}
export async function programs(facultyId: string) {
  return (await db().query("SELECT id,name,slug,duration_years AS \"durationYears\" FROM programs WHERE faculty_id=$1 AND is_active ORDER BY name,id LIMIT 100",[facultyId])).rows;
}
export async function courses(programId: string, classYear: number, period: string) {
  return (await db().query(`SELECT DISTINCT c.id,c.name,c.slug FROM courses c JOIN grading_schemes s ON s.program_id=c.program_id AND s.course_id=c.id JOIN grading_scheme_versions v ON v.scheme_id=s.id WHERE c.program_id=$1 AND c.is_active AND s.academic_year_start=$2 AND s.class_year=$3 AND s.period=$4 AND s.system_type='MIDTERM' AND v.status='PUBLISHED' AND EXISTS (SELECT 1 FROM grading_rule_sources src WHERE src.version_id=v.id) ORDER BY c.name,c.id LIMIT 100`,[programId,academicYear(),classYear,period])).rows;
}
export async function rule(programId: string, classYear: number, period: string, system: string, courseId: string | null) {
  const result = await db().query(`SELECT s.id AS "ruleId", v.id AS "versionId",s.academic_year_start AS "academicYearStart",s.class_year AS "classYear",s.period,s.system_type AS system,v.passing_grade AS "passingGrade", COALESCE((SELECT json_agg(json_build_object('type', c.component_type,'position', c.position,'weightPercent', c.weight_percent) ORDER BY c.component_type,c.position) FROM assessment_components c WHERE c.version_id=v.id),'[]'::json) AS components, COALESCE((SELECT json_agg(json_build_object('sourceUrl', r.source_url,'sourceType',r.source_type,'verifiedAt',r.verified_at)) FROM grading_rule_sources r WHERE r.version_id=v.id),'[]'::json) AS sources FROM grading_schemes s JOIN grading_scheme_versions v ON v.scheme_id=s.id JOIN programs p ON p.id=s.program_id JOIN faculties f ON f.id=p.faculty_id JOIN universities u ON u.id=f.university_id WHERE s.program_id=$1 AND s.class_year=$2 AND s.period=$3 AND s.system_type=$4 AND s.course_id IS NOT DISTINCT FROM $5::uuid AND s.academic_year_start=$6 AND v.status='PUBLISHED' AND p.is_active AND f.is_active AND u.is_active AND EXISTS (SELECT 1 FROM grading_rule_sources src WHERE src.version_id=v.id) LIMIT 1`,[programId,classYear,period,system,courseId,academicYear()]);
  return result.rows[0] ?? null;
}
