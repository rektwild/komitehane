import {z} from "zod";
const decimal=z.union([z.string().max(8),z.number().finite()]);
const mode=z.enum(["COURSE_GRADE","MINIMUM_FINAL"]);
export const period=z.enum(["ANNUAL","FALL","SPRING"]);
export const uuid=z.uuid();
export const classYear=z.coerce.number().int().min(1).max(12);
export const manualCalculation=z.object({source:z.literal("CUSTOM"),mode,components:z.array(z.object({grade:decimal,weight:decimal}).strict()).min(1).max(10),finalWeight:decimal,finalGrade:decimal.optional(),passingGrade:decimal.optional()}).strict();
export const officialCalculation=z.object({ruleVersionId:uuid,mode,grades:z.array(decimal).min(1).max(10),finalGrade:decimal.optional(),includeHistorical:z.boolean().optional(),overrides:z.object({weights:z.array(decimal).min(1).max(10).optional(),finalWeight:decimal.optional(),passingGrade:decimal.optional()}).strict().optional()}).strict();
