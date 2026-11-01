import "server-only";
import {academicPool, academicYear} from "@/lib/academic/db/client";
import {validateForPublication} from "@/lib/academic/services/publish";

export class AcademicUnavailable extends Error {}
function db() { const pool = academicPool(); if (!pool) throw new AcademicUnavailable("ACADEMIC_UNAVAILABLE"); return pool; }
export async function universities(search: string, limit: number, offset: number) {
  return (await db().query("SELECT id,name,slug FROM academic_read_universities WHERE is_active AND name ILIKE $1 ORDER BY name,id LIMIT $2 OFFSET $3",[`%${search.replace(/[\\%_]/g,"\\$&")}%`,limit,offset])).rows;
}
export async function faculties(universityId: string) {
  return (await db().query("SELECT id,name,slug FROM academic_read_faculties WHERE university_id=$1 AND is_active AND EXISTS (SELECT 1 FROM academic_read_universities u WHERE u.id=academic_read_faculties.university_id AND u.is_active) ORDER BY name,id LIMIT 100",[universityId])).rows;
}
export async function programs(facultyId: string) {
  return (await db().query("SELECT id,name,slug,duration_years AS \"durationYears\" FROM academic_read_programs WHERE faculty_id=$1 AND is_active AND EXISTS (SELECT 1 FROM academic_read_faculties f JOIN academic_read_universities u ON u.id=f.university_id WHERE f.id=academic_read_programs.faculty_id AND f.is_active AND u.is_active) ORDER BY name,id LIMIT 100",[facultyId])).rows;
}
export async function courses(programId: string, classYear: number, period: string) {
  const candidates=(await db().query<{id:string;name:string;slug:string}>(`SELECT DISTINCT c.id,c.name,c.slug FROM academic_read_courses c JOIN academic_read_grading_schemes s ON s.program_id=c.program_id AND s.course_id=c.id JOIN academic_read_grading_scheme_versions v ON v.scheme_id=s.id WHERE c.program_id=$1 AND c.is_active AND s.academic_year_start=$2 AND s.class_year=$3 AND s.period=$4 AND s.system_type='MIDTERM' AND v.status='PUBLISHED' ORDER BY c.name,c.id LIMIT 100`,[programId,academicYear(),classYear,period])).rows;
  const checked=await Promise.all(candidates.map(async course=>({course,eligible:await rule(programId,classYear,period,"MIDTERM",course.id)})));
  return checked.filter(x=>x.eligible).map(x=>x.course);
}
export async function rule(programId: string, classYear: number, period: string, system: string, courseId: string | null) {
  const result = await db().query(`SELECT s.id AS "ruleId", v.id AS "versionId",s.academic_year_start AS "academicYearStart",s.class_year AS "classYear",s.period,s.system_type AS system,v.passing_grade AS "passingGrade", COALESCE((SELECT json_agg(json_build_object('type', c.component_type,'position', c.position,'weightPercent', c.weight_percent::text) ORDER BY c.component_type,c.position) FROM academic_read_assessment_components c WHERE c.version_id=v.id),'[]'::json) AS components, COALESCE((SELECT json_agg(json_build_object('sourceUrl', r.source_url,'sourceType',r.source_type,'verifiedAt',r.verified_at,'sourceTitle',r.source_title)) FROM academic_read_grading_rule_sources r WHERE r.version_id=v.id),'[]'::json) AS sources FROM academic_read_grading_schemes s JOIN academic_read_grading_scheme_versions v ON v.scheme_id=s.id JOIN academic_read_programs p ON p.id=s.program_id JOIN academic_read_faculties f ON f.id=p.faculty_id JOIN academic_read_universities u ON u.id=f.university_id WHERE s.program_id=$1 AND s.class_year=$2 AND s.period=$3 AND s.system_type=$4 AND s.course_id IS NOT DISTINCT FROM $5::uuid AND s.academic_year_start=$6 AND v.status='PUBLISHED' AND p.is_active AND f.is_active AND u.is_active AND s.class_year<=p.duration_years AND (s.course_id IS NULL OR EXISTS (SELECT 1 FROM academic_read_courses cr WHERE cr.id=s.course_id AND cr.is_active)) AND EXISTS (SELECT 1 FROM academic_read_grading_rule_sources src WHERE src.version_id=v.id) LIMIT 1`,[programId,classYear,period,system,courseId,academicYear()]);
  const row=result.rows[0];
  if (!row || !isEligible(row.system,row.passingGrade,row.components,row.sources)) return null;
  return row;
}
function isEligible(system:string,passingGrade:string,components:{type:string;position:number;weightPercent:string}[],sources:{sourceUrl:string;verifiedAt:string}[]) {
  return validateForPublication(system,passingGrade,components.map(c=>({component_type:c.type,position:c.position,weight_percent:String(c.weightPercent)})),sources.map(s=>({source_url:s.sourceUrl,verified_at:new Date(s.verifiedAt)}))).length===0;
}
export type PublishedVersion = {
  ruleId:string; programId:string; courseId:string|null; classYear:number; period:string; versionId:string; status:"PUBLISHED"|"SUPERSEDED"; academicYearStart:number; passingGrade:string;
  system:string; components:{type:string;position:number;weightPercent:string}[]; sources:{sourceUrl:string;verifiedAt:string;sourceType?:string;sourceTitle?:string|null}[];
};
export async function versionById(id:string, historical:boolean):Promise<PublishedVersion | null> {
  if (historical) {
    const result=await db().query<PublishedVersion>(`SELECT h.rule_id AS "ruleId",h.program_id AS "programId",h.course_id AS "courseId",h.class_year AS "classYear",h.period,h.version_id AS "versionId",h.status,h.academic_year_start AS "academicYearStart",h.passing_grade AS "passingGrade",h.system_type AS system,
      COALESCE((SELECT json_agg(json_build_object('type',c.component_type,'position',c.position,'weightPercent',c.weight_percent::text) ORDER BY c.component_type,c.position) FROM academic_read_assessment_components c WHERE c.version_id=h.version_id),'[]'::json) AS components,
      COALESCE((SELECT json_agg(json_build_object('sourceUrl',r.source_url,'verifiedAt',r.verified_at,'sourceType',r.source_type,'sourceTitle',r.source_title)) FROM academic_read_grading_rule_sources r WHERE r.version_id=h.version_id),'[]'::json) AS sources
      FROM academic_read_version_scopes h WHERE h.version_id=$1`,[id]);
    const row=result.rows[0];return row && isEligible(row.system,row.passingGrade,row.components,row.sources)?row:null;
  }
  const result=await db().query<PublishedVersion>(`SELECT s.id AS "ruleId",s.program_id AS "programId",s.course_id AS "courseId",s.class_year AS "classYear",s.period,v.id AS "versionId",v.status,s.academic_year_start AS "academicYearStart",v.passing_grade AS "passingGrade",s.system_type AS system,
    COALESCE((SELECT json_agg(json_build_object('type',c.component_type,'position',c.position,'weightPercent',c.weight_percent::text) ORDER BY c.component_type,c.position) FROM academic_read_assessment_components c WHERE c.version_id=v.id),'[]'::json) AS components
    , COALESCE((SELECT json_agg(json_build_object('sourceUrl',src.source_url,'verifiedAt',src.verified_at,'sourceType',src.source_type,'sourceTitle',src.source_title)) FROM academic_read_grading_rule_sources src WHERE src.version_id=v.id),'[]'::json) AS sources
    FROM academic_read_grading_scheme_versions v JOIN academic_read_grading_schemes s ON s.id=v.scheme_id JOIN academic_read_programs p ON p.id=s.program_id JOIN academic_read_faculties f ON f.id=p.faculty_id JOIN academic_read_universities u ON u.id=f.university_id LEFT JOIN academic_read_courses course ON course.id=s.course_id
    WHERE v.id=$1 AND (v.status='PUBLISHED' OR ($2 AND v.status='SUPERSEDED')) AND ($2 OR s.academic_year_start=$3) AND u.is_active AND f.is_active AND p.is_active AND s.class_year<=p.duration_years AND (s.course_id IS NULL OR course.is_active) AND EXISTS(SELECT 1 FROM academic_read_grading_rule_sources src WHERE src.version_id=v.id)`,[id,historical,academicYear()]);
  const row=result.rows[0];
  return row && isEligible(row.system,row.passingGrade,row.components,row.sources) ? row : null;
}
export type AcademicLanding={universityId:string;facultyId:string;programId:string;universityName:string;facultyName:string;programName:string;universitySlug:string;facultySlug:string;programSlug:string;classYear:number;system:"MIDTERM"|"COMMITTEE";rules:Array<{courseId:string|null;courseName:string|null;period:string;rule:NonNullable<Awaited<ReturnType<typeof rule>>>}>};
export async function landing(universitySlug:string,facultySlug:string,programSlug:string,classYear:number,system:"MIDTERM"|"COMMITTEE"):Promise<AcademicLanding|null> {
  if(!academicPool())return null;
  const found=await db().query<Omit<AcademicLanding,"classYear"|"system"|"rules">>(`SELECT u.id AS "universityId",f.id AS "facultyId",p.id AS "programId",u.name AS "universityName",f.name AS "facultyName",p.name AS "programName",u.slug AS "universitySlug",f.slug AS "facultySlug",p.slug AS "programSlug" FROM academic_read_programs p JOIN academic_read_faculties f ON f.id=p.faculty_id JOIN academic_read_universities u ON u.id=f.university_id WHERE u.slug=$1 AND f.slug=$2 AND p.slug=$3 AND u.is_active AND f.is_active AND p.is_active AND $4 BETWEEN 1 AND p.duration_years`,[universitySlug,facultySlug,programSlug,classYear]);
  const base=found.rows[0];if(!base)return null;
  const matches=await db().query<{period:string;courseId:string|null;courseName:string|null}>(`SELECT s.period,s.course_id AS "courseId",c.name AS "courseName" FROM academic_read_grading_schemes s JOIN academic_read_grading_scheme_versions v ON v.scheme_id=s.id LEFT JOIN academic_read_courses c ON c.id=s.course_id WHERE s.program_id=$1 AND s.class_year=$2 AND s.academic_year_start=$3 AND s.system_type=$4 AND v.status='PUBLISHED' AND (s.course_id IS NULL OR c.is_active) ORDER BY s.period,c.name`,[base.programId,classYear,academicYear(),system]);
  const checked=await Promise.all(matches.rows.map(async item=>({...item,rule:await rule(base.programId,classYear,item.period,system,item.courseId)})));
  const rules=checked.filter((item):item is typeof item & {rule:NonNullable<typeof item.rule>}=>Boolean(item.rule));
  return rules.length?{...base,classYear,system,rules}:null;
}
export async function landingCandidates():Promise<AcademicLanding[]> {
  if(!academicPool())return [];
  const result=await db().query(`SELECT u.id AS "universityId",f.id AS "facultyId",p.id AS "programId",u.name AS "universityName",f.name AS "facultyName",p.name AS "programName",u.slug AS "universitySlug",f.slug AS "facultySlug",p.slug AS "programSlug",s.class_year AS "classYear",s.system_type AS system,s.period,s.course_id AS "courseId",c.name AS "courseName",s.id AS "ruleId",v.id AS "versionId",s.academic_year_start AS "academicYearStart",v.passing_grade AS "passingGrade",
    COALESCE((SELECT json_agg(json_build_object('type',a.component_type,'position',a.position,'weightPercent',a.weight_percent::text) ORDER BY a.component_type,a.position) FROM academic_read_assessment_components a WHERE a.version_id=v.id),'[]'::json) AS components,
    COALESCE((SELECT json_agg(json_build_object('sourceUrl',r.source_url,'sourceType',r.source_type,'verifiedAt',r.verified_at,'sourceTitle',r.source_title)) FROM academic_read_grading_rule_sources r WHERE r.version_id=v.id),'[]'::json) AS sources
    FROM academic_read_grading_schemes s JOIN academic_read_grading_scheme_versions v ON v.scheme_id=s.id JOIN academic_read_programs p ON p.id=s.program_id JOIN academic_read_faculties f ON f.id=p.faculty_id JOIN academic_read_universities u ON u.id=f.university_id LEFT JOIN academic_read_courses c ON c.id=s.course_id
    WHERE s.academic_year_start=$1 AND v.status='PUBLISHED' AND s.class_year BETWEEN 1 AND p.duration_years AND (s.course_id IS NULL OR c.is_active)
    ORDER BY u.name,f.name,p.name,s.class_year,s.system_type,s.period,c.name`,[academicYear()]);
  const grouped=new Map<string,AcademicLanding>();
  for(const row of result.rows) {
    if(!isEligible(row.system,row.passingGrade,row.components,row.sources))continue;
    const key=`${row.programId}:${row.classYear}:${row.system}`;
    const existing:AcademicLanding=grouped.get(key) ?? {universityId:row.universityId,facultyId:row.facultyId,programId:row.programId,universityName:row.universityName,facultyName:row.facultyName,programName:row.programName,universitySlug:row.universitySlug,facultySlug:row.facultySlug,programSlug:row.programSlug,classYear:row.classYear,system:row.system,rules:[]};
    existing.rules.push({courseId:row.courseId,courseName:row.courseName,period:row.period,rule:{ruleId:row.ruleId,versionId:row.versionId,academicYearStart:row.academicYearStart,classYear:row.classYear,period:row.period,system:row.system,passingGrade:row.passingGrade,components:row.components,sources:row.sources}});
    grouped.set(key,existing);
  }
  return [...grouped.values()];
}
