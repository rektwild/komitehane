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
  | "finalWeightZero";

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

  if (!normalized || !/^-?\d+(?:\.\d*)?$/.test(normalized)) {
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
    ? parsed > MIN_WEIGHT && parsed <= MAX_WEIGHT
    : parsed >= MIN_SCORE && parsed <= MAX_SCORE;

  if (!isInRange) {
    return {value: parsed, issues: [{field, code: rangeCode}]};
  }

  return {value: parsed, issues: []};
}

export function validateAssessments(
  rows: readonly AssessmentInput[],
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

  const totalWeight = getTotalWeight(parsedRows);

  if (totalWeight <= MIN_WEIGHT) {
    errors.push({field: "totalWeight", code: "totalWeightEmpty"});
  }

  if (totalWeight >= MAX_WEIGHT) {
    errors.push({field: "totalWeight", code: "totalWeightTooHigh"});
  }

  const finalWeight = MAX_WEIGHT - totalWeight;

  if (finalWeight <= 0) {
    errors.push({field: "finalWeight", code: "finalWeightZero"});
  }

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
): CourseGradeCalculationResult {
  const assessments = validateAssessments(rows);

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
  const value =
    currentContribution + (parsedFinalGrade.value * finalWeight) / 100;

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
): MinimumFinalCalculationResult {
  const assessments = validateAssessments(rows);

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

  if (currentContribution >= parsedPassingGrade.value) {
    return {
      status: "ALREADY_PASSING",
      value: 0,
      totalWeight,
      finalWeight,
      currentContribution,
    };
  }

  const value =
    ((parsedPassingGrade.value - currentContribution) * 100) / finalWeight;

  if (!Number.isFinite(value)) {
    return {
      status: "INVALID_INPUT",
      errors: [{field: "finalWeight", code: "finalWeightZero"}],
    };
  }

  const result = {
    value,
    totalWeight,
    finalWeight,
    currentContribution,
  };

  return value > MAX_SCORE
    ? {status: "IMPOSSIBLE", ...result}
    : {status: "CALCULATED", ...result};
}
