/** The engine accepts decimal strings or numbers with at most two decimal places.
 * Weights and scores are converted to integer hundredths before arithmetic. */
export type Decimal = string | number;
export type CalculationInput = {
  mode: "COURSE_GRADE" | "MINIMUM_FINAL";
  assessments: {grade: Decimal; weight: Decimal}[];
  finalWeight: Decimal;
  finalGrade?: Decimal;
  passingGrade?: Decimal;
};
export type CalculationResult =
  | {status: "INVALID_INPUT"; errors: string[]}
  | {status: "CALCULATED" | "TARGET_ALREADY_MET" | "IMPOSSIBLE_WITH_MAX_100"; value: number; displayValue: number; currentContribution: number};

function hundredths(value: unknown): number | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const s = String(value).trim().replace(",", ".");
  if (!/^\d{1,3}(?:\.\d{1,2})?$/.test(s)) return null;
  const [whole, fraction = ""] = s.split(".");
  const n = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return n <= 10000 ? n : null;
}

export function calculate(input: CalculationInput): CalculationResult {
  if (!input || !Array.isArray(input.assessments) || input.assessments.length < 1 || input.assessments.length > 10 || !["COURSE_GRADE", "MINIMUM_FINAL"].includes(input.mode)) {
    return {status:"INVALID_INPUT",errors:["INVALID_ASSESSMENTS_OR_MODE"]};
  }
  const rows = input.assessments.map(row => ({grade: hundredths(row?.grade), weight: hundredths(row?.weight)}));
  const finalWeight = hundredths(input.finalWeight);
  const target = input.mode === "COURSE_GRADE" ? hundredths(input.finalGrade) : hundredths(input.passingGrade);
  if (rows.some(r => r.grade === null || r.weight === null) || finalWeight === null || finalWeight === 0 || target === null) {
    return {status:"INVALID_INPUT",errors:["INVALID_NUMBER"]};
  }
  const totalWeight = rows.reduce((sum,r) => sum + r.weight!, finalWeight);
  if (totalWeight !== 10000) return {status:"INVALID_INPUT",errors:["WEIGHT_TOTAL_MUST_EQUAL_100"]};
  const weighted = rows.reduce((sum,r) => sum + r.grade! * r.weight!, 0);
  const currentContribution = weighted / 1_000_000;
  if (input.mode === "COURSE_GRADE") {
    const value = (weighted + target * finalWeight) / 1_000_000;
    return {status:"CALCULATED",value,displayValue:Math.round(value * 100) / 100,currentContribution};
  }
  const numerator = target * 10000 - weighted;
  if (numerator <= 0) return {status:"TARGET_ALREADY_MET",value:0,displayValue:0,currentContribution};
  const value = numerator / finalWeight / 100;
  const displayValue = Math.ceil(numerator / finalWeight) / 100;
  return {status: numerator > finalWeight * 10000 ? "IMPOSSIBLE_WITH_MAX_100" : "CALCULATED",value,displayValue,currentContribution};
}
