import {calculate} from "@/lib/academic/calculations/engine";

export const MIN_ASSESSMENT_COUNT = 1;
export const MAX_ASSESSMENT_COUNT = 10;
export const MIN_SCORE = 0;
export const MAX_SCORE = 100;
export const MIN_WEIGHT = 0;
export const MAX_WEIGHT = 100;

export type AssessmentInput = {
  grade: string;
  weight: string;
};

export type Assessment = {
  grade: number;
  weight: number;
};

export type ValidationIssueCode =
  | "count"
  | "required"
  | "invalidNumber"
  | "gradeRange"
  | "weightRange"
  | "passingGradeRange"
  | "finalGradeRange"
  | "totalWeightEmpty"
  | "totalWeightTooHigh"
  | "finalWeightZero"
  | "totalWeightMismatch";

export type ValidationIssue = {
  field: string;
  code: ValidationIssueCode;
};

type ValidatedAssessmentData = {
  rows: Assessment[];
  totalWeight: number;
  finalWeight: number;
  currentContribution: number;
};

export type InvalidCalculationResult = {
  status: "INVALID_INPUT";
  errors: ValidationIssue[];
};

export type CourseGradeCalculationResult =
  | InvalidCalculationResult
  | {
      status: "CALCULATED";
      value: number;
      totalWeight: number;
      finalWeight: number;
      currentContribution: number;
    };

export type MinimumFinalCalculationResult =
  | InvalidCalculationResult
  | {
      status: "ALREADY_PASSING";
      value: 0;
      totalWeight: number;
      finalWeight: number;
      currentContribution: number;
    }
  | {
      status: "CALCULATED";
      value: number;
      totalWeight: number;
      finalWeight: number;
      currentContribution: number;
    }
  | {
      status: "IMPOSSIBLE";
      value: number;
      totalWeight: number;
      finalWeight: number;
      currentContribution: number;
    };

/**
 * Parses both Turkish decimal commas and English decimal points without
 * accepting partial or non-finite numeric values.
 */
export function parseLocalizedNumber(value: string): number | null {
  const normalized = value.trim().replace(",", ".");

  if (!normalized || !/^-?\d+(?:\.\d{1,2})?$/.test(normalized)) {
    return null;
  }

  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : null;
}

export function getTotalWeight(rows: readonly Assessment[]): number {
  return rows.reduce((total, row) => total + row.weight, 0);
}

export function getFinalWeight(rows: readonly Assessment[]): number {
  return 100 - getTotalWeight(rows);
}

export function getCurrentContribution(rows: readonly Assessment[]): number {
  return rows.reduce(
    (total, row) => total + (row.grade * row.weight) / 100,
    0,
  );
}

function validateNumberField({
  value,
  field,
  rangeCode,
}: {
  value: string;
  field: string;
  rangeCode: "gradeRange" | "weightRange" | "passingGradeRange" | "finalGradeRange";
}): {value: number; issues: ValidationIssue[]} {
  if (!value.trim()) {
    return {value: Number.NaN, issues: [{field, code: "required"}]};
  }

  const parsed = parseLocalizedNumber(value);

  if (parsed === null) {
    return {value: Number.NaN, issues: [{field, code: "invalidNumber"}]};
  }

  const isWeight = rangeCode === "weightRange";
  const isInRange = isWeight
    ? parsed >= MIN_WEIGHT && parsed <= MAX_WEIGHT
    : parsed >= MIN_SCORE && parsed <= MAX_SCORE;

  if (!isInRange) {
    return {value: parsed, issues: [{field, code: rangeCode}]};
  }

  return {value: parsed, issues: []};
}

export function validateAssessments(
  rows: readonly AssessmentInput[],
  finalWeightInput?: string,
): {valid: true; data: ValidatedAssessmentData} | {valid: false; errors: ValidationIssue[]} {
  const errors: ValidationIssue[] = [];

  if (
    rows.length < MIN_ASSESSMENT_COUNT ||
    rows.length > MAX_ASSESSMENT_COUNT
  ) {
    errors.push({field: "assessmentCount", code: "count"});
  }

  const parsedRows = rows.map((row, index) => {
    const grade = validateNumberField({
      value: row.grade,
      field: `assessment-${index}-grade`,
      rangeCode: "gradeRange",
    });
    const weight = validateNumberField({
      value: row.weight,
      field: `assessment-${index}-weight`,
      rangeCode: "weightRange",
    });

    errors.push(...grade.issues, ...weight.issues);

    return {grade: grade.value, weight: weight.value};
  });

  if (errors.length > 0) {
    return {valid: false, errors};
  }

  const totalUnits = parsedRows.reduce((total, row) => total + Math.round(row.weight * 100), 0);
  const totalWeight = totalUnits / 100;
  const finalField = finalWeightInput === undefined
    ? {value: (10000 - totalUnits) / 100, issues: [] as ValidationIssue[]}
    : validateNumberField({value: finalWeightInput, field: "finalWeight", rangeCode: "weightRange"});
  errors.push(...finalField.issues);
  const finalWeight = finalField.value;
  if (Number.isFinite(finalWeight) && finalWeight <= 0) errors.push({field:"finalWeight",code:"finalWeightZero"});
  if (Number.isFinite(finalWeight) && totalUnits + Math.round(finalWeight * 100) !== 10000) errors.push({field:"totalWeight",code:"totalWeightMismatch"});

  if (errors.length > 0) {
    return {valid: false, errors};
  }

  return {
    valid: true,
    data: {
      rows: parsedRows,
      totalWeight,
      finalWeight,
      currentContribution: getCurrentContribution(parsedRows),
    },
  };
}

export function calculateCourseGrade(
  rows: readonly AssessmentInput[],
  finalGrade: string,
  finalWeightInput?: string,
): CourseGradeCalculationResult {
  const assessments = validateAssessments(rows, finalWeightInput);

  if (!assessments.valid) {
    return {status: "INVALID_INPUT", errors: assessments.errors};
  }

  const parsedFinalGrade = validateNumberField({
    value: finalGrade,
    field: "finalGrade",
    rangeCode: "finalGradeRange",
  });

  if (parsedFinalGrade.issues.length > 0) {
    return {status: "INVALID_INPUT", errors: parsedFinalGrade.issues};
  }

  const {currentContribution, finalWeight, totalWeight} = assessments.data;
  const computed = calculate({mode:"COURSE_GRADE", assessments:rows, finalWeight, finalGrade});
  if (computed.status === "INVALID_INPUT") return {status:"INVALID_INPUT",errors:[{field:"finalWeight",code:"totalWeightMismatch"}]};
  const value = computed.value;

  return {
    status: "CALCULATED",
    value,
    totalWeight,
    finalWeight,
    currentContribution,
  };
}

export function calculateMinimumFinal(
  rows: readonly AssessmentInput[],
  passingGrade: string,
  finalWeightInput?: string,
): MinimumFinalCalculationResult {
  const assessments = validateAssessments(rows, finalWeightInput);

  if (!assessments.valid) {
    return {status: "INVALID_INPUT", errors: assessments.errors};
  }

  const parsedPassingGrade = validateNumberField({
    value: passingGrade,
    field: "passingGrade",
    rangeCode: "passingGradeRange",
  });

  if (parsedPassingGrade.issues.length > 0) {
    return {status: "INVALID_INPUT", errors: parsedPassingGrade.issues};
  }

  const {currentContribution, finalWeight, totalWeight} = assessments.data;

  if (finalWeight <= 0) {
    return {
      status: "INVALID_INPUT",
      errors: [{field: "finalWeight", code: "finalWeightZero"}],
    };
  }

  const computed = calculate({mode:"MINIMUM_FINAL", assessments:rows, finalWeight, passingGrade});
  if (computed.status === "INVALID_INPUT") return {status:"INVALID_INPUT",errors:[{field:"finalWeight",code:"totalWeightMismatch"}]};
  if (computed.status === "TARGET_ALREADY_MET") return {status:"ALREADY_PASSING",value:0,totalWeight,finalWeight,currentContribution};
  const result = {value:computed.displayValue,totalWeight,finalWeight,currentContribution};
  return computed.status === "IMPOSSIBLE_WITH_MAX_100" ? {status:"IMPOSSIBLE",...result} : {status:"CALCULATED",...result};
}
