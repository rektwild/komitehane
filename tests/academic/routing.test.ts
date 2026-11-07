import {describe,expect,it} from "vitest";
import {NextRequest} from "next/server";
import proxy from "../../proxy";
import {academicPath} from "../../lib/academic/seo/paths";
const cases=[
  ["committeeGrade","komite-not-hesaplama","committee-grade-calculator"],
  ["committeeMinimumFinal","komite-minimum-final-notu","committee-minimum-final-grade"],
  ["midtermGrade","vize-not-hesaplama","midterm-grade-calculator"],
  ["midtermMinimumFinal","vize-minimum-final-notu","midterm-minimum-final-grade"],
] as const;
describe("academic localized routing",()=>{
  it("rewrites an existing Turkish general tool",()=>{
    const res=proxy(new NextRequest("http://127.0.0.1:3037/tr/araclar/komite-not-hesaplama"));
    expect(res.status).toBe(200);
    expect(res.headers.get("x-middleware-rewrite")).toContain("/tr/tools/committee-grade-calculator");
  });
  it.each(cases)("rewrites %s Turkish URL to the right internal route",(tool,tr,en)=>{
    const path=academicPath("tr",tool,"test-university","faculty","program",2);
    expect(path).toBe(`/tr/araclar/${tr}/test-university/faculty/program/2-sinif`);
    const res=proxy(new NextRequest(`https://example.com${path}`));
    expect(res.headers.get("x-middleware-rewrite")).toContain(`/tr/tools/${en}/test-university/faculty/program/2-sinif`);
    expect(academicPath("en",tool,"test-university","faculty","program",2)).toBe(`/en/tools/${en}/test-university/faculty/program/2-year`);
  });
});
