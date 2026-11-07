import {describe, expect, it} from "vitest";
import {validateForPublication} from "../../lib/academic/services/publish";
const components = [
  {component_type:"COMMITTEE",position:1,weight_percent:"40.00"},
  {component_type:"FINAL",position:1,weight_percent:"60.00"},
];
const sources = [{source_url:"https://example.edu.tr/test-fixture",verified_at:new Date("2026-01-01")}];
describe("publication validation", () => {
  it("accepts a structurally valid fictional rule", () => expect(validateForPublication("COMMITTEE","60.00",components,sources)).toEqual([]));
  it("rejects incorrect totals and missing sources", () => {
    expect(validateForPublication("COMMITTEE","60.00",[{...components[0],weight_percent:"39.99"},components[1]],[])).toEqual(expect.arrayContaining(["INVALID_WEIGHT_TOTAL","MISSING_VERIFIED_SOURCE"]));
  });
  it("rejects a different system and noncontiguous positions", () => {
    expect(validateForPublication("MIDTERM","60.00",components,sources)).toContain("UNSUPPORTED_COMPONENTS");
    expect(validateForPublication("COMMITTEE","60.00",[{...components[0],position:2},components[1]],sources)).toContain("INVALID_POSITIONS");
  });
});
