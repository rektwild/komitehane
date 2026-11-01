"use client";
import {useEffect,useState} from "react";
import {useLocale,useTranslations} from "next-intl";
import {Field,FieldLabel} from "@/components/ui/field";
import type {ToolKey} from "@/lib/tools";
import {academicPath} from "@/lib/academic/seo/paths";

type Item={id:string;name:string;slug?:string;durationYears?:number};
type Component={type:string;position:number;weightPercent:string};
export type AcademicRule={versionId:string;academicYearStart:number;passingGrade:string;components:Component[];sources:{sourceUrl:string;sourceTitle?:string}[]};
export type AcademicContext={universityId:string;facultyId:string;programId:string;classYear:string;period:string;courseId:string;rule:AcademicRule|null};
export const emptyAcademicContext:AcademicContext={universityId:"",facultyId:"",programId:"",classYear:"",period:"ANNUAL",courseId:"",rule:null};
type Payload<T>={data:T};
async function getData<T>(url:string,signal:AbortSignal):Promise<T> {
  const res=await fetch(url,{signal});if(!res.ok)throw Error("unavailable");return ((await res.json()) as Payload<T>).data;
}
export function AcademicContextFields({toolKey,context,onChange}:{toolKey:ToolKey;context:AcademicContext;onChange:(context:AcademicContext)=>void}) {
  const t=useTranslations("Academic");const locale=useLocale();const midterm=toolKey.startsWith("midterm");
  const [universities,setUniversities]=useState<Item[]>([]);const [faculties,setFaculties]=useState<Item[]>([]);const [programs,setPrograms]=useState<Item[]>([]);const [courses,setCourses]=useState<Item[]>([]);const [unavailable,setUnavailable]=useState(false);
  useEffect(()=>{const c=new AbortController();
    async function loadAll() {const all:Item[]=[];for(let offset=0;offset<10000;offset+=100){const page=await getData<Item[]>(`/api/v1/universities?limit=100&offset=${offset}`,c.signal);all.push(...page);if(page.length<100)break;}return all;}
    loadAll().then(data=>{setUniversities(data);setUnavailable(false);}).catch(e=>{if(e.name!=="AbortError")setUnavailable(true);});return()=>c.abort();},[]);
  useEffect(()=>{const c=new AbortController();if(context.universityId)getData<Item[]>(`/api/v1/faculties?universityId=${encodeURIComponent(context.universityId)}`,c.signal).then(setFaculties).catch(()=>{});return()=>c.abort();},[context.universityId]);
  useEffect(()=>{const c=new AbortController();if(context.facultyId)getData<Item[]>(`/api/v1/programs?facultyId=${encodeURIComponent(context.facultyId)}`,c.signal).then(data=>{setPrograms(data);if(data.length===1 && !context.programId)onChange({...context,programId:data[0].id,rule:null});}).catch(()=>{});return()=>c.abort();
  // The selected program is intentionally not a trigger for another catalog request.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[context.facultyId,onChange]);
  useEffect(()=>{const c=new AbortController();if(midterm && context.programId && context.classYear)getData<Item[]>(`/api/v1/courses?programId=${encodeURIComponent(context.programId)}&classYear=${context.classYear}&period=${context.period}`,c.signal).then(setCourses).catch(()=>{});return()=>c.abort();},[context.programId,context.classYear,context.period,midterm]);
  useEffect(()=>{
    const c=new AbortController();if(!context.programId || !context.classYear || (midterm && !context.courseId))return()=>c.abort();
    const qs=new URLSearchParams({programId:context.programId,classYear:context.classYear,period:context.period,system:midterm?"MIDTERM":"COMMITTEE"});if(midterm)qs.set("courseId",context.courseId);
    getData<AcademicRule>(`/api/v1/grading-rules?${qs}`,c.signal).then(rule=>onChange({...context,rule})).catch(()=>{});return()=>c.abort();
  // onChange is stable; rule is intentionally excluded to avoid refetch after loading.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[context.programId,context.classYear,context.period,context.courseId,midterm,onChange]);
  const choose=(changes:Partial<AcademicContext>)=>{
    if ("universityId" in changes) {setFaculties([]);setPrograms([]);setCourses([]);}
    else if ("facultyId" in changes) {setPrograms([]);setCourses([]);}
    else if ("programId" in changes || "classYear" in changes || "period" in changes) setCourses([]);
    onChange({...context,...changes,rule:null});
  };
  const selectClass="h-10 w-full rounded-md border border-input bg-background px-3 text-sm";
  const select=(name:string,label:string,value:string,items:Item[],change:(v:string)=>void)=><Field><FieldLabel htmlFor={`academic-${name}`}>{label}</FieldLabel><select id={`academic-${name}`} className={selectClass} value={value} onChange={e=>change(e.target.value)}><option value="">{t("select")}</option>{items.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>;
  const selectedProgram=programs.find(x=>x.id===context.programId);
  const selectedFaculty=faculties.find(x=>x.id===context.facultyId);
  const selectedUniversity=universities.find(x=>x.id===context.universityId);
  const pagePath=context.rule && selectedProgram?.slug && selectedFaculty?.slug && selectedUniversity?.slug && context.classYear ? academicPath(locale,toolKey,selectedUniversity.slug,selectedFaculty.slug,selectedProgram.slug,Number(context.classYear)) : null;
  return <div className="space-y-3"><p className="text-sm text-muted-foreground">{unavailable?t("unavailable"):context.rule?t("verified",{year:String(context.rule.academicYearStart),nextYear:String(context.rule.academicYearStart+1)}):t("manual")}</p>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {select("university",t("university"),context.universityId,universities,v=>choose({universityId:v,facultyId:"",programId:"",classYear:"",courseId:""}))}
      {context.universityId && select("faculty",t("faculty"),context.facultyId,faculties,v=>choose({facultyId:v,programId:"",classYear:"",courseId:""}))}
      {context.facultyId && select("program",t("program"),context.programId,programs,v=>choose({programId:v,classYear:"",courseId:""}))}
      {context.programId && select("class",t("class"),context.classYear,Array.from({length:selectedProgram?.durationYears??6},(_,i)=>({id:String(i+1),name:String(i+1)})),v=>choose({classYear:v,courseId:""}))}
      {context.classYear && select("period",t("period"),context.period,[{id:"ANNUAL",name:t("annual")},{id:"FALL",name:t("fall")},{id:"SPRING",name:t("spring")}],v=>choose({period:v,courseId:""}))}
      {midterm && context.classYear && select("course",t("course"),context.courseId,courses,v=>choose({courseId:v}))}
    </div>
    {pagePath ? <p className="text-sm"><a href={pagePath} className="underline">{t("viewUniversityPage")}</a></p> : null}
    {context.rule?.sources?.map((source,i)=><p className="text-xs" key={`${source.sourceUrl}-${i}`}><a className="underline" href={source.sourceUrl} target="_blank" rel="noreferrer">{t("source")}</a></p>)}
  </div>;
}
