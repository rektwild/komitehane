import type {Metadata} from "next";
import type {Locale} from "next-intl";
import {notFound} from "next/navigation";
import {getTranslations} from "next-intl/server";
import {BoxIcon} from "lucide-react";
import {JsonLd} from "@/components/json-ld";
import {PageBreadcrumb} from "@/components/layout/page-breadcrumb";
import {PageWithAside} from "@/components/layout/page-with-aside";
import {GradeCalculator} from "@/components/tools/grade-calculator";
import {getPathname} from "@/i18n/navigation";
import {academicPath} from "@/lib/academic/seo/paths";
import {landing} from "@/lib/academic/repositories/catalog";
import {getToolBySlug} from "@/lib/tools";
import {getDynamicLocalizedMetadata} from "@/lib/seo/metadata";
import {getWebPageJsonLd} from "@/lib/seo/structured-data";
import {socialImagePath} from "@/lib/seo/social-image-keys";
import {absoluteUrl} from "@/lib/seo/urls";

export const revalidate = 300;

type Params={locale:Locale;slug:string;university:string;faculty:string;program:string;classYear:string};
async function load(params:Promise<Params>) {
  const p=await params;const tool=getToolBySlug(p.slug);
  if(!tool || !["tr","en"].includes(p.locale) || ![p.university,p.faculty,p.program].every(s=>/^[a-z0-9-]{1,120}$/.test(s)))notFound();
  const suffix=p.locale==="tr"?"sinif":"year";const match=new RegExp(`^([1-9]|1[0-2])-${suffix}$`).exec(p.classYear);if(!match)notFound();
  const year=Number(match[1]);const entry=await landing(p.university,p.faculty,p.program,year,tool.category==="midterm"?"MIDTERM":"COMMITTEE");if(!entry)notFound();
  return {p,tool,entry,year};
}
async function textFor(p:Params,toolKey:Parameters<typeof academicPath>[1],entry:NonNullable<Awaited<ReturnType<typeof landing>>>,year:number) {
  const t=await getTranslations({locale:p.locale,namespace:"Academic"}); const toolsT=await getTranslations({locale:p.locale,namespace:"Tools"});
  const title=t("landingTitle",{university:entry.universityName,faculty:entry.facultyName,program:entry.programName,year:String(year),tool:toolsT(`items.${toolKey}.title`)});
  const start=entry.rules[0].rule.academicYearStart;
  const academicYear=`${start}–${start+1}`;
  return {t,toolsT,title,description:t("landingDescription",{university:entry.universityName,faculty:entry.facultyName,program:entry.programName,year:String(year),academicYear})};
}
export async function generateMetadata({params}:{params:Promise<Params>}):Promise<Metadata> {
  const {p,tool,entry,year}=await load(params);const {title,description}=await textFor(p,tool.key,entry,year);
  const paths={tr:academicPath("tr",tool.key,p.university,p.faculty,p.program,year),en:academicPath("en",tool.key,p.university,p.faculty,p.program,year)};
  return getDynamicLocalizedMetadata({locale:p.locale,canonicalPath:paths[p.locale],localizedPaths:paths,title,description,image:{url:socialImagePath(p.locale,tool.key),alt:title}});
}
export default async function AcademicLandingPage({params}:{params:Promise<Params>}) {
  const {p,tool,entry,year}=await load(params);const {t,toolsT,title,description}=await textFor(p,tool.key,entry,year);
  const pageUrl=absoluteUrl(academicPath(p.locale,tool.key,p.university,p.faculty,p.program,year));
  const toolsUrl=absoluteUrl(await getPathname({href:"/tools",locale:p.locale}));
  const toolUrl=absoluteUrl(await getPathname({href:tool.href,locale:p.locale}));
  const toolTitle=toolsT(`items.${tool.key}.title`);
  const initial={universityId:entry.universityId,facultyId:entry.facultyId,programId:entry.programId,classYear:String(year),period:entry.rules[0].period,courseId:tool.category==="midterm"?(entry.rules[0].courseId??""):"",rule:null};
  return <>
    <PageBreadcrumb items={[{label:toolsT("title"),href:"/tools",icon:BoxIcon},{label:toolTitle,href:tool.href},{label:title}]} className="shrink-0 py-4" />
    <PageWithAside><section className="flex min-w-0 flex-1 flex-col gap-6">
    <JsonLd data={getWebPageJsonLd({locale:p.locale,url:pageUrl,name:title,description,breadcrumbItems:[{name:toolsT("title"),url:toolsUrl},{name:toolTitle,url:toolUrl},{name:title,url:pageUrl}]})} />
    <header className="flex max-w-3xl flex-col gap-3"><h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{title}</h1><p className="text-pretty text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">{description}</p><p className="text-sm leading-6 text-muted-foreground">{t("landingDisclaimer")}</p></header>
    <h2 className="text-xl font-semibold tracking-tight">{t("landingRules")}</h2>
    {entry.rules.map(({rule,courseName,period})=><section key={rule.versionId} className="flex flex-col gap-1 rounded-lg border p-4 text-sm leading-6"><p>{t("landingAcademicYear",{year:String(rule.academicYearStart),nextYear:String(rule.academicYearStart+1)})}</p>{courseName?<p>{t("landingCourse",{course:courseName})}</p>:null}<p>{t("period")}: {t(period==="FALL"?"fall":period==="SPRING"?"spring":"annual")}</p><p>{t("landingWeights")}: {rule.components.map((c:{type:string;position:number;weightPercent:string})=>`${c.type} ${c.position}: %${c.weightPercent}`).join(" · ")}</p><p>{t("landingTarget",{grade:String(rule.passingGrade)})}</p>{rule.sources.map((source:{sourceUrl:string},i:number)=><a className="font-medium underline underline-offset-4" href={source.sourceUrl} target="_blank" rel="noreferrer" key={i}>{t("source")}</a>)}</section>)}
    <GradeCalculator toolKey={tool.key} initialAcademicContext={initial} />
  </section></PageWithAside>
  </>;
}
