import {describe,expect,it} from "vitest";
import {calculateCourseGrade,calculateMinimumFinal} from "../../lib/tools/calculations";
import {calculate} from "../../lib/academic/calculations/engine";
const rows=[{grade:"70",weight:"40"}];
describe("manual UI calculation adapter",()=>{
  it("uses the shared engine for a grade and minimum final",()=>{
    expect(calculateCourseGrade(rows,"60","60")).toMatchObject({status:"CALCULATED",value:64});
    const result=calculateMinimumFinal(rows,"60","60");
    const engine=calculate({mode:"MINIMUM_FINAL",assessments:rows,finalWeight:"60",passingGrade:"60"});
    expect(result).toMatchObject({status:"CALCULATED",value:53.34});
    if(engine.status!=="INVALID_INPUT" && result.status==="CALCULATED") expect(result.value).toBe(engine.displayValue);
  });
  it("rejects a manual final weight when the total is incorrect",()=>{
    expect(calculateMinimumFinal(rows,"60","59.99")).toMatchObject({status:"INVALID_INPUT",errors:[{code:"totalWeightMismatch"}]});
  });
  it("accepts zero grades and a zero intermediate weight",()=>{
    expect(calculateCourseGrade([{grade:"0",weight:"0"}],"50","100")).toMatchObject({status:"CALCULATED",value:50});
  });
});
