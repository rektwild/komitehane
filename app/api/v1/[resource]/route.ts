import {z} from "zod";
import {calculate} from "@/lib/academic/calculations/engine";
import {universities,faculties,programs,courses,rule,versionById} from "@/lib/academic/repositories/catalog";
import {classYear,manualCalculation,officialCalculation,period,uuid} from "@/lib/academic/api/validation";

const headers={"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"};
const fail=(code:string,status:number)=>Response.json({error:{code,message:code}},{status,headers});
const ok=(data:unknown)=>Response.json({data},{headers});
const key=(v:string|null)=>uuid.parse(v);
const rate=new Map<string,{count:number;until:number}>();
function guard(req:Request):Response|null {
  const origin=req.headers.get("origin");
  if (origin && origin!==new URL(req.url).origin) return fail("FORBIDDEN_ORIGIN",403);
  const now=Date.now();
  for (const [k,v] of rate) if (v.until < now) rate.delete(k);
  const address=req.headers.get("x-vercel-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (rate.size>5000 && !rate.has(address)) return fail("RATE_LIMITED",429);
  const entry=rate.get(address) ?? {count:0,until:now+60000}; entry.count++; rate.set(address,entry);
  return entry.count>120 ? fail("RATE_LIMITED",429) : null;
}
export async function GET(req:Request,{params}:{params:Promise<{resource:string}>}) {
  const blocked=guard(req);if(blocked)return blocked;
  const {resource}=await params; const q=new URL(req.url).searchParams;
  try {
    if(resource==="universities") {
      const search=z.string().max(100).parse(q.get("q")??"");
      const limit=z.coerce.number().int().min(1).max(100).parse(q.get("limit")??"25");
      const offset=z.coerce.number().int().min(0).max(10000).parse(q.get("offset")??"0");
      return ok(await universities(search,limit,offset));
    }
    if(resource==="faculties")return ok(await faculties(key(q.get("universityId"))));
    if(resource==="programs")return ok(await programs(key(q.get("facultyId"))));
    if(resource==="courses")return ok(await courses(key(q.get("programId")),classYear.parse(q.get("classYear")),period.parse(q.get("period"))));
    if(resource==="grading-rules") {
      if (q.has("versionId")) {
        if ([...q.keys()].some(k=>k!=="versionId" && k!=="includeHistorical") || (q.has("includeHistorical") && q.get("includeHistorical")!=="true")) return fail("INVALID_INPUT",400);
        const data=await versionById(key(q.get("versionId")),q.get("includeHistorical")==="true");
        return data?ok(data):fail("RULE_NOT_FOUND",404);
      }
      if (q.has("includeHistorical")) return fail("INVALID_INPUT",400);
      const program=key(q.get("programId"));const year=classYear.parse(q.get("classYear"));const term=period.parse(q.get("period"));const system=z.enum(["COMMITTEE","MIDTERM"]).parse(q.get("system"));
      const course=system==="MIDTERM"?key(q.get("courseId")):null;
      if(system==="COMMITTEE" && q.has("courseId"))return fail("INVALID_INPUT",400);
      const data=await rule(program,year,term,system,course);return data?ok(data):fail("RULE_NOT_FOUND",404);
    }
    return fail("NOT_FOUND",404);
  } catch(e) {if(e instanceof z.ZodError)return fail("INVALID_INPUT",400);return fail("DB_UNAVAILABLE",503);}
}
async function readLimited(req:Request):Promise<unknown> {
  if (!req.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new Error("INVALID_CONTENT_TYPE");
  const reader=req.body?.getReader();if(!reader)throw new Error("INVALID_JSON");
  const chunks:Uint8Array[]=[];let size=0;
  while(true) {const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>16384){await reader.cancel();throw new Error("BODY_TOO_LARGE");}chunks.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  return JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(bytes));
}
export async function POST(req:Request,{params}:{params:Promise<{resource:string}>}) {
  const blocked=guard(req);if(blocked)return blocked;
  if((await params).resource!=="calculate")return fail("NOT_FOUND",404);
  let body:unknown;
  try {body=await readLimited(req);} catch(e) {return fail(e instanceof Error && e.message==="BODY_TOO_LARGE"?"BODY_TOO_LARGE":"INVALID_JSON",400);}
  const custom=manualCalculation.safeParse(body);
  if(custom.success) {
    const data=custom.data;const result=calculate({mode:data.mode,assessments:data.components,finalWeight:data.finalWeight,finalGrade:data.finalGrade,passingGrade:data.passingGrade});
    return result.status==="INVALID_INPUT"?fail("INVALID_INPUT",422):ok({...result,source:"CUSTOM"});
  }
  const parsed=officialCalculation.safeParse(body);if(!parsed.success)return fail("INVALID_INPUT",400);
  try {
    const data=parsed.data;const version=await versionById(data.ruleVersionId,data.includeHistorical===true);if(!version)return fail("RULE_NOT_FOUND",404);
    const intermediate=version.components.filter(c=>c.type===version.system).sort((a,b)=>a.position-b.position);
    const finals=version.components.filter(c=>c.type==="FINAL");
    if(intermediate.length!==data.grades.length || intermediate.length<1 || intermediate.length>10 || finals.length!==1 || version.components.length!==intermediate.length+1 || (data.overrides?.weights && data.overrides.weights.length!==intermediate.length))return fail("UNSUPPORTED_RULE",422);
    const result=calculate({mode:data.mode,assessments:intermediate.map((c,i)=>({grade:data.grades[i],weight:data.overrides?.weights?.[i]??c.weightPercent})),finalWeight:data.overrides?.finalWeight??finals[0].weightPercent,passingGrade:data.overrides?.passingGrade??version.passingGrade,finalGrade:data.finalGrade});
    return result.status==="INVALID_INPUT"?fail("INVALID_INPUT",422):ok({...result,source:data.overrides?"CUSTOM":"OFFICIAL_VERIFIED",versionId:version.versionId,versionStatus:version.status,academicYearStart:version.academicYearStart});
  } catch {return fail("DB_UNAVAILABLE",503);}
}
