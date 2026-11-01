import {describe,expect,it,vi} from "vitest";
vi.mock("@/lib/academic/repositories/catalog",()=>({universities:vi.fn().mockResolvedValue([]),faculties:vi.fn().mockResolvedValue([]),programs:vi.fn().mockResolvedValue([]),courses:vi.fn().mockResolvedValue([]),rule:vi.fn().mockResolvedValue(null),versionById:vi.fn().mockResolvedValue(null)}));
import {GET,POST} from "../../app/api/v1/[resource]/route";
import {versionById} from "../../lib/academic/repositories/catalog";
const params=(resource:string)=>({params:Promise.resolve({resource})});
function request(body:unknown) {return new Request("http://localhost/api/v1/calculate",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});}
describe("academic API adapter",()=>{
  it("calculates custom input without a database",async()=>{
    const response=await POST(request({source:"CUSTOM",mode:"COURSE_GRADE",components:[{grade:80,weight:40}],finalWeight:60,finalGrade:60}),params("calculate"));
    expect(response.status).toBe(200);expect(await response.json()).toMatchObject({data:{value:68,source:"CUSTOM"}});expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it("does not accept an official claim from a custom client",async()=>{
    const response=await POST(request({source:"OFFICIAL_VERIFIED",mode:"COURSE_GRADE",components:[{grade:80,weight:40}],finalWeight:60,finalGrade:60}),params("calculate"));
    expect(response.status).toBe(400);
  });
  it("looks up official rule on the server and labels overrides custom",async()=>{
    vi.mocked(versionById).mockResolvedValueOnce({ruleId:"00000000-0000-4000-8000-000000000006",programId:"00000000-0000-4000-8000-000000000003",courseId:null,classYear:2,period:"ANNUAL",versionId:"00000000-0000-4000-8000-000000000007",status:"PUBLISHED",academicYearStart:2026,system:"COMMITTEE",passingGrade:"60.00",components:[{type:"COMMITTEE",position:1,weightPercent:"40.00"},{type:"FINAL",position:1,weightPercent:"60.00"}],sources:[{sourceUrl:"https://fictional.test",verifiedAt:"2026-01-01T00:00:00Z"}]});
    const response=await POST(request({ruleVersionId:"00000000-0000-4000-8000-000000000007",mode:"MINIMUM_FINAL",grades:[70],overrides:{passingGrade:60}}),params("calculate"));
    expect(response.status).toBe(200);expect(await response.json()).toMatchObject({data:{displayValue:53.34,source:"CUSTOM"}});
  });
  it("validates identifiers and body size",async()=>{
    expect((await GET(new Request("http://localhost/api/v1/faculties?universityId=invalid"),params("faculties"))).status).toBe(400);
    expect((await POST(request({source:"CUSTOM",junk:"x".repeat(20000)}),params("calculate"))).status).toBe(400);
  });
  it("rejects other browser origins",async()=>{
    expect((await GET(new Request("http://localhost/api/v1/universities",{headers:{origin:"https://other.example"}}),params("universities"))).status).toBe(403);
  });
});
