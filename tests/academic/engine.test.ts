import {describe, expect, it} from "vitest";
import {calculate} from "../../lib/academic/calculations/engine";

describe("academic calculation engine", () => {
  it("calculates a weighted course grade", () => {
    expect(calculate({mode:"COURSE_GRADE",assessments:[{grade:80,weight:40}],finalWeight:60,finalGrade:60})).toMatchObject({status:"CALCULATED",value:68});
  });
  it("rounds the required final upwards", () => {
    expect(calculate({mode:"MINIMUM_FINAL",assessments:[{grade:70,weight:40}],finalWeight:60,passingGrade:60})).toMatchObject({status:"CALCULATED",displayValue:53.34});
  });
  it("distinguishes an already reached target and an impossible target", () => {
    expect(calculate({mode:"MINIMUM_FINAL",assessments:[{grade:100,weight:65}],finalWeight:35,passingGrade:60}).status).toBe("TARGET_ALREADY_MET");
    expect(calculate({mode:"MINIMUM_FINAL",assessments:[{grade:0,weight:80}],finalWeight:20,passingGrade:60}).status).toBe("IMPOSSIBLE_WITH_MAX_100");
  });
  it("accepts zero and Turkish decimals but rejects invalid totals and values", () => {
    expect(calculate({mode:"COURSE_GRADE",assessments:[{grade:"0",weight:"33,33"}],finalWeight:"66,67",finalGrade:"100"})).toMatchObject({status:"CALCULATED",value:66.67});
    for (const grade of ["", "NaN", "Infinity", "-1", "100.01"]) expect(calculate({mode:"COURSE_GRADE",assessments:[{grade,weight:40}],finalWeight:60,finalGrade:60}).status).toBe("INVALID_INPUT");
    expect(calculate({mode:"MINIMUM_FINAL",assessments:[{grade:80,weight:40}],finalWeight:59.99,passingGrade:60}).status).toBe("INVALID_INPUT");
    expect(calculate({mode:"MINIMUM_FINAL",assessments:[{grade:80,weight:100}],finalWeight:0,passingGrade:60}).status).toBe("INVALID_INPUT");
  });
});
