import {academicConnection} from "./connections";
import {validateForPublication} from "../../lib/academic/services/publish";
const id=process.argv[2];
if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) throw new Error("Usage: pnpm academic:validate <version-uuid>");
const pool=academicConnection("writer");
try {
  const row=await pool.query<{system_type:string;passing_grade:string;status:string}>("SELECT s.system_type,v.passing_grade,v.status FROM grading_scheme_versions v JOIN grading_schemes s ON s.id=v.scheme_id WHERE v.id=$1",[id]);
  if (!row.rowCount) throw new Error("VERSION_NOT_FOUND");
  const components=await pool.query<{component_type:string;position:number;weight_percent:string}>("SELECT component_type,position,weight_percent FROM assessment_components WHERE version_id=$1 ORDER BY component_type,position",[id]);
  const sources=await pool.query<{source_url:string;verified_at:Date}>("SELECT source_url,verified_at FROM grading_rule_sources WHERE version_id=$1",[id]);
  const errors=validateForPublication(row.rows[0].system_type,row.rows[0].passing_grade,components.rows,sources.rows);
  console.log(JSON.stringify({id,status:row.rows[0].status,errors,sourceReview:"Manual source review is still required"}));
  if(errors.length) process.exitCode=1;
} finally {await pool.end();}
