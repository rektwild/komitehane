import type {Locale} from "next-intl";
import type {ToolKey} from "@/lib/tools";
const slugs:Record<ToolKey,{tr:string;en:string}>={
  committeeGrade:{tr:"komite-not-hesaplama",en:"committee-grade-calculator"},committeeMinimumFinal:{tr:"komite-minimum-final-notu",en:"committee-minimum-final-grade"},midtermGrade:{tr:"vize-not-hesaplama",en:"midterm-grade-calculator"},midtermMinimumFinal:{tr:"vize-minimum-final-notu",en:"midterm-minimum-final-grade"},
};
export function academicPath(locale:Locale,tool:ToolKey,university:string,faculty:string,program:string,year:number) {
  const parts=[locale,locale==="tr"?"araclar":"tools",slugs[tool][locale],university,faculty,program,`${year}-${locale==="tr"?"sinif":"year"}`];
  return "/"+parts.map(encodeURIComponent).join("/");
}
