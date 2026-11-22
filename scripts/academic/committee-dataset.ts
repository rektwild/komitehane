import {z} from "zod";
import {entityInput, universityInput} from "./seed-entities";
import {draftRulesFile} from "./seed-rules";

/** Normalized, reviewable committee import produced by convert-committee-export.ts. */
export const committeeDataset = z.object({
  meta: z.object({
    exportName: z.string().min(1).max(200),
    academicYearStart: z.number().int().min(1900).max(2200),
    generatedFrom: z.string().min(1).max(200),
    notes: z.array(z.string().max(1000)).max(20),
  }).strict(),
  universities: z.array(universityInput).max(1000),
  faculties: entityInput.shape.faculties,
  programs: entityInput.shape.programs,
  schemes: entityInput.shape.schemes,
  versions: draftRulesFile,
  excluded: z.array(z.object({scheme: z.string().min(1).max(300), reason: z.string().min(1).max(500)}).strict()).max(5000),
}).strict().superRefine((d, ctx) => {
  const ids = new Set<string>();
  const unique = (id: string, path: string) => {
    if (ids.has(id)) ctx.addIssue({code: "custom", message: `DUPLICATE_ID ${id}`, path: [path]});
    ids.add(id);
  };
  const universities = new Set(d.universities.map(x => x.id));
  const faculties = new Set(d.faculties.map(x => x.id));
  const programs = new Map(d.programs.map(x => [x.id, x]));
  const schemes = new Set(d.schemes.map(x => x.id));
  for (const x of d.universities) unique(x.id, "universities");
  for (const x of d.faculties) { unique(x.id, "faculties"); if (!universities.has(x.universityId)) ctx.addIssue({code: "custom", message: `UNKNOWN_UNIVERSITY ${x.id}`, path: ["faculties"]}); }
  for (const x of d.programs) { unique(x.id, "programs"); if (!faculties.has(x.facultyId)) ctx.addIssue({code: "custom", message: `UNKNOWN_FACULTY ${x.id}`, path: ["programs"]}); }
  for (const x of d.schemes) {
    unique(x.id, "schemes");
    const program = programs.get(x.programId);
    if (!program) ctx.addIssue({code: "custom", message: `UNKNOWN_PROGRAM ${x.id}`, path: ["schemes"]});
    else if (x.classYear > program.durationYears) ctx.addIssue({code: "custom", message: `CLASS_OUTSIDE_PROGRAM_DURATION ${x.id}`, path: ["schemes"]});
    if (x.system !== "COMMITTEE" || x.academicYearStart !== d.meta.academicYearStart) ctx.addIssue({code: "custom", message: `UNEXPECTED_SCHEME_SCOPE ${x.id}`, path: ["schemes"]});
  }
  for (const x of d.versions) { unique(x.id, "versions"); if (!schemes.has(x.schemeId)) ctx.addIssue({code: "custom", message: `UNKNOWN_SCHEME ${x.id}`, path: ["versions"]}); }
});
export type CommitteeDataset = z.infer<typeof committeeDataset>;
