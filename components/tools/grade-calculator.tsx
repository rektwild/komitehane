"use client";

import {
  useCallback,
  useMemo,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import {CalculatorIcon} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  StudentContextFields,
  useStudentContext,
  type StudentContextValidation,
} from "@/components/tools/student-context-fields";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import {Input} from "@/components/ui/input";
import {Separator} from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {ToolKey} from "@/lib/tools";
import {
  calculateCourseGrade,
  calculateMinimumFinal,
  getFinalWeight,
  MAX_ASSESSMENT_COUNT,
  parseLocalizedNumber,
  type AssessmentInput,
  type CourseGradeCalculationResult,
  type MinimumFinalCalculationResult,
  type ValidationIssue,
  type ValidationIssueCode,
} from "@/lib/tools/calculations";

const STORAGE_VERSION = 1;
const STORAGE_PREFIX = "komitehane:grade-calculator";
const faqKeys = ["one", "two", "three", "four", "five", "six"] as const;

const formNamespaces = {
  midtermGrade: "Tools.midtermGradeForm",
  committeeGrade: "Tools.committeeGradeForm",
  committeeMinimumFinal: "Tools.committeeMinimumFinalForm",
  midtermMinimumFinal: "Tools.midtermMinimumFinalForm",
} as const satisfies Record<ToolKey, string>;

type CalculatorResult =
  | CourseGradeCalculationResult
  | MinimumFinalCalculationResult;

type StoredCalculatorState = {
  version: number;
  assessmentCount: number;
  rows: AssessmentInput[];
  passingGrade: string;
  finalGrade: string;
};

type CalculationViewState = {
  storageKey: string;
  result: CalculatorResult | null;
  issues: ValidationIssue[];
};

function createAssessmentRows(): AssessmentInput[] {
  return Array.from({length: MAX_ASSESSMENT_COUNT}, () => ({
    grade: "",
    weight: "",
  }));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function createEmptyStoredState(): StoredCalculatorState {
  return {
    version: STORAGE_VERSION,
    assessmentCount: 1,
    rows: createAssessmentRows(),
    passingGrade: "",
    finalGrade: "",
  };
}

function parseStoredState(rawValue: string | null): StoredCalculatorState {
  if (!rawValue) return createEmptyStoredState();

  try {
    const parsed: unknown = JSON.parse(rawValue);

    if (!isRecord(parsed) || parsed.version !== STORAGE_VERSION) {
      return createEmptyStoredState();
    }

    const parsedCount = Number(parsed.assessmentCount);
    const assessmentCount = Number.isInteger(parsedCount)
      ? Math.min(MAX_ASSESSMENT_COUNT, Math.max(1, parsedCount))
      : 1;
    const storedRows = Array.isArray(parsed.rows) ? parsed.rows : [];
    const rows = createAssessmentRows().map((emptyRow, index) => {
      const storedRow = storedRows[index];

      if (!isRecord(storedRow)) return emptyRow;

      return {
        grade: typeof storedRow.grade === "string" ? storedRow.grade : "",
        weight: typeof storedRow.weight === "string" ? storedRow.weight : "",
      };
    });

    return {
      version: STORAGE_VERSION,
      assessmentCount,
      rows,
      passingGrade:
        typeof parsed.passingGrade === "string" ? parsed.passingGrade : "",
      finalGrade: typeof parsed.finalGrade === "string" ? parsed.finalGrade : "",
    };
  } catch {
    return createEmptyStoredState();
  }
}

function getStorageKey(toolKey: ToolKey) {
  return `${STORAGE_PREFIX}:${toolKey}:v${STORAGE_VERSION}`;
}

type StorageSnapshot = {
  rawValue: string | null;
  state: StoredCalculatorState;
};

const serverStoredState = createEmptyStoredState();
const storageSnapshots = new Map<string, StorageSnapshot>();
const storageListeners = new Map<string, Set<() => void>>();

function getServerStorageSnapshot() {
  return serverStoredState;
}

function getStorageSnapshot(key: string): StoredCalculatorState {
  if (typeof window === "undefined") return serverStoredState;

  try {
    const rawValue = window.localStorage.getItem(key);
    const cachedSnapshot = storageSnapshots.get(key);

    if (cachedSnapshot?.rawValue === rawValue) {
      return cachedSnapshot.state;
    }

    const state = parseStoredState(rawValue);
    storageSnapshots.set(key, {rawValue, state});

    return state;
  } catch {
    return storageSnapshots.get(key)?.state ?? serverStoredState;
  }
}

function subscribeToStorage(key: string, listener: () => void) {
  const listeners = storageListeners.get(key) ?? new Set<() => void>();
  listeners.add(listener);
  storageListeners.set(key, listeners);

  if (typeof window === "undefined") {
    return () => listeners.delete(listener);
  }

  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === key || event.key === null) listener();
  };

  window.addEventListener("storage", handleStorageChange);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorageChange);

    if (listeners.size === 0) storageListeners.delete(key);
  };
}

function updateStoredState(
  key: string,
  updater: (state: StoredCalculatorState) => StoredCalculatorState,
) {
  if (typeof window === "undefined") return;

  const currentState = getStorageSnapshot(key);
  const nextState = updater(currentState);

  try {
    const rawValue = JSON.stringify(nextState);
    window.localStorage.setItem(key, rawValue);
    storageSnapshots.set(key, {rawValue, state: nextState});
  } catch {
    storageSnapshots.set(key, {rawValue: null, state: nextState});
  }

  storageListeners.get(key)?.forEach((listener) => listener());
}

function useCalculatorState(storageKey: string) {
  const subscribe = useCallback(
    (listener: () => void) => subscribeToStorage(storageKey, listener),
    [storageKey],
  );
  const getSnapshot = useCallback(
    () => getStorageSnapshot(storageKey),
    [storageKey],
  );

  return useSyncExternalStore(subscribe, getSnapshot, getServerStorageSnapshot);
}

function getValidationMessage(
  code: ValidationIssueCode,
  t: ReturnType<typeof useTranslations>,
) {
  switch (code) {
    case "count":
      return t("validation.count");
    case "required":
      return t("validation.required");
    case "invalidNumber":
      return t("validation.invalidNumber");
    case "gradeRange":
      return t("validation.gradeRange");
    case "weightRange":
      return t("validation.weightRange");
    case "passingGradeRange":
      return t("validation.passingGradeRange");
    case "finalGradeRange":
      return t("validation.finalGradeRange");
    case "totalWeightEmpty":
      return t("validation.totalWeightEmpty");
    case "totalWeightTooHigh":
      return t("validation.totalWeightTooHigh");
    case "finalWeightZero":
      return t("validation.finalWeightZero");
  }
}

export function GradeCalculator({toolKey}: {toolKey: ToolKey}) {
  const locale = useLocale();
  const t = useTranslations(formNamespaces[toolKey]);
  const isMinimumFinal =
    toolKey === "committeeMinimumFinal" || toolKey === "midtermMinimumFinal";
  const storageKey = getStorageKey(toolKey);
  const storedState = useCalculatorState(storageKey);
  const studentContext = useStudentContext();
  const {assessmentCount, rows, passingGrade, finalGrade} = storedState;
  const [studentContextValidation, setStudentContextValidation] =
    useState<StudentContextValidation>({});
  const [calculation, setCalculation] = useState<CalculationViewState>(() => ({
    storageKey,
    result: null,
    issues: [],
  }));
  const result =
    calculation.storageKey === storageKey ? calculation.result : null;

  const visibleRows = rows.slice(0, assessmentCount);
  const issueByField = useMemo(
    () => {
      const issues =
        calculation.storageKey === storageKey ? calculation.issues : [];

      return new Map(issues.map((issue) => [issue.field, issue]));
    },
    [calculation, storageKey],
  );

  const finalWeight = useMemo(() => {
    const parsedRows = visibleRows.map((row) => {
      const weight = parseLocalizedNumber(row.weight);

      return weight === null ? null : {grade: 0, weight};
    });

    const completeRows = parsedRows.filter(
      (row): row is {grade: number; weight: number} => row !== null,
    );

    if (completeRows.length !== parsedRows.length) return null;

    const totalWeight = completeRows.reduce(
      (total, row) => total + row.weight,
      0,
    );
    const remainingWeight = getFinalWeight(completeRows);

    return totalWeight > 0 && totalWeight < 100 ? remainingWeight : null;
  }, [visibleRows]);

  const formatNumber = (value: number) =>
    new Intl.NumberFormat(locale, {
      maximumFractionDigits: 2,
    }).format(value);

  const getIssue = (field: string) => issueByField.get(field);

  const getIssueMessage = (issue: ValidationIssue | undefined) =>
    issue ? getValidationMessage(issue.code, t) : undefined;

  const clearCalculation = useCallback(() => {
    setCalculation({storageKey, result: null, issues: []});
  }, [storageKey]);

  const handleStudentContextChange = useCallback(() => {
    clearCalculation();
    setStudentContextValidation({});
  }, [clearCalculation]);

  function updateRow(
    rowIndex: number,
    field: keyof AssessmentInput,
    value: string,
  ) {
    clearCalculation();
    updateStoredState(storageKey, (currentState) => ({
      ...currentState,
      rows: currentState.rows.map((row, index) =>
        index === rowIndex ? {...row, [field]: value} : row,
      ),
    }));
  }

  function handleAssessmentCountChange(value: string | null) {
    const nextCount = Number(value);

    if (
      !Number.isInteger(nextCount) ||
      nextCount < 1 ||
      nextCount > MAX_ASSESSMENT_COUNT
    ) {
      return;
    }

    clearCalculation();
    updateStoredState(storageKey, (currentState) => ({
      ...currentState,
      assessmentCount: nextCount,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const hasUniversity = studentContext.university !== "";
    const hasDepartment = studentContext.department.trim() !== "";
    const hasClassYear = studentContext.classYear !== "";
    const missingStudentContext =
      hasUniversity && (!hasDepartment || !hasClassYear);

    if (missingStudentContext) {
      clearCalculation();
      setStudentContextValidation({
        department: !hasDepartment,
        classYear: hasDepartment && !hasClassYear,
      });
      return;
    }

    setStudentContextValidation({});

    const nextResult = isMinimumFinal
      ? calculateMinimumFinal(visibleRows, passingGrade)
      : calculateCourseGrade(visibleRows, finalGrade);

    setCalculation({
      storageKey,
      result: nextResult,
      issues: nextResult.status === "INVALID_INPUT" ? nextResult.errors : [],
    });
  }

  const assessmentCountIssue = getIssue("assessmentCount");
  const finalWeightIssue =
    getIssue("totalWeight") ?? getIssue("finalWeight");
  const passingGradeIssue = getIssue("passingGrade");
  const finalGradeIssue = getIssue("finalGrade");

  function renderResult() {
    if (!result) {
      return <span>{t("resultPending")}</span>;
    }

    if (result.status === "INVALID_INPUT") {
      return <FieldError>{t("resultInvalid")}</FieldError>;
    }

    if (result.status === "ALREADY_PASSING") {
      return (
        <div className="space-y-2">
          <p className="text-3xl font-bold tabular-nums sm:text-5xl">
            {formatNumber(result.value)}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("resultAlreadyPassing")}
          </p>
        </div>
      );
    }

    if (result.status === "IMPOSSIBLE") {
      return (
        <div className="space-y-2">
          <p className="text-3xl font-bold tabular-nums sm:text-5xl">
            {formatNumber(result.value)}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("resultImpossibleDescription")}
          </p>
        </div>
      );
    }

    return (
      <p className="text-3xl font-bold tabular-nums sm:text-5xl">
        {formatNumber(result.value)}
      </p>
    );
  }

  const assessmentCountField = (
    <Field data-invalid={Boolean(assessmentCountIssue)}>
      <FieldLabel htmlFor={`calculator-${toolKey}-count`}>
        {t("assessmentCount")}
      </FieldLabel>
      <Select
        value={String(assessmentCount)}
        onValueChange={handleAssessmentCountChange}
      >
        <SelectTrigger
          id={`calculator-${toolKey}-count`}
          className="w-full"
          aria-invalid={Boolean(assessmentCountIssue)}
          aria-describedby={
            assessmentCountIssue
              ? `calculator-${toolKey}-count-error`
              : undefined
          }
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {Array.from(
              {length: MAX_ASSESSMENT_COUNT},
              (_, index) => {
                const value = String(index + 1);

                return (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                );
              },
            )}
          </SelectGroup>
        </SelectContent>
      </Select>
      <FieldError
        id={`calculator-${toolKey}-count-error`}
      >
        {getIssueMessage(assessmentCountIssue)}
      </FieldError>
    </Field>
  );

  return (
    <>
      <form onSubmit={handleSubmit} noValidate>
        <section
          aria-labelledby={`calculator-${toolKey}-information-title`}
          className="flex flex-col gap-3"
        >
          <h2
            id={`calculator-${toolKey}-information-title`}
            className="text-base font-medium"
          >
            {t("calculationInformationTitle")}
          </h2>
          <Card className="w-full">
            <CardContent>
              <FieldGroup>
                <StudentContextFields
                  onContextChange={handleStudentContextChange}
                  validation={studentContextValidation}
                />
                {studentContext.university !== "" &&
                studentContext.department.trim() !== "" ? (
                  <Separator />
                ) : null}
                {isMinimumFinal ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field data-invalid={Boolean(passingGradeIssue)}>
                      <FieldLabel
                        htmlFor={`calculator-${toolKey}-passing-grade`}
                      >
                        {t("passingGrade")}
                      </FieldLabel>
                      <Input
                        id={`calculator-${toolKey}-passing-grade`}
                        name="passing-grade"
                        type="text"
                        inputMode="decimal"
                        value={passingGrade}
                        aria-invalid={Boolean(passingGradeIssue)}
                        aria-describedby={
                          passingGradeIssue
                            ? `calculator-${toolKey}-passing-grade-error`
                            : undefined
                        }
                        onChange={(event) => {
                          clearCalculation();
                          updateStoredState(storageKey, (currentState) => ({
                            ...currentState,
                            passingGrade: event.target.value,
                          }));
                        }}
                      />
                      <FieldError
                        id={`calculator-${toolKey}-passing-grade-error`}
                      >
                        {getIssueMessage(passingGradeIssue)}
                      </FieldError>
                    </Field>
                    {assessmentCountField}
                  </div>
                ) : (
                  assessmentCountField
                )}

                <FieldGroup className="gap-4">
                  {visibleRows.map((row, index) => {
                    const assessmentNumber = index + 1;
                    const gradeField = `assessment-${index}-grade`;
                    const weightField = `assessment-${index}-weight`;
                    const gradeIssue = getIssue(gradeField);
                    const weightIssue = getIssue(weightField);
                    const gradeId = `calculator-${toolKey}-${gradeField}`;
                    const weightId = `calculator-${toolKey}-${weightField}`;

                    return (
                      <div
                        key={assessmentNumber}
                        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
                      >
                        <Field data-invalid={Boolean(gradeIssue)}>
                          <FieldLabel htmlFor={gradeId}>
                            {t("assessmentGrade", {
                              index: String(assessmentNumber),
                            })}
                          </FieldLabel>
                          <Input
                            id={gradeId}
                            name={`assessments.${index}.grade`}
                            type="text"
                            inputMode="decimal"
                            value={row.grade}
                            aria-invalid={Boolean(gradeIssue)}
                            aria-describedby={
                              gradeIssue ? `${gradeId}-error` : undefined
                            }
                            onChange={(event) =>
                              updateRow(index, "grade", event.target.value)
                            }
                          />
                          <FieldError id={`${gradeId}-error`}>
                            {getIssueMessage(gradeIssue)}
                          </FieldError>
                        </Field>

                        <Field data-invalid={Boolean(weightIssue)}>
                          <FieldLabel htmlFor={weightId}>
                            {t("assessmentWeight", {
                              index: String(assessmentNumber),
                            })}
                          </FieldLabel>
                          <InputGroup>
                            <InputGroupInput
                              id={weightId}
                              name={`assessments.${index}.weight`}
                              type="text"
                              inputMode="decimal"
                              value={row.weight}
                              aria-invalid={Boolean(weightIssue)}
                              aria-describedby={
                                weightIssue ? `${weightId}-error` : undefined
                              }
                              onChange={(event) =>
                                updateRow(index, "weight", event.target.value)
                              }
                            />
                            <InputGroupAddon align="inline-end">
                              <InputGroupText aria-hidden="true">%</InputGroupText>
                            </InputGroupAddon>
                          </InputGroup>
                          <FieldError id={`${weightId}-error`}>
                            {getIssueMessage(weightIssue)}
                          </FieldError>
                        </Field>
                      </div>
                    );
                  })}

                  {!isMinimumFinal ? (
                    <Field data-invalid={Boolean(finalGradeIssue)}>
                      <FieldLabel htmlFor={`calculator-${toolKey}-final-grade`}>
                        {t("finalGrade")}
                      </FieldLabel>
                      <Input
                        id={`calculator-${toolKey}-final-grade`}
                        name="final-grade"
                        type="text"
                        inputMode="decimal"
                        value={finalGrade}
                        aria-invalid={Boolean(finalGradeIssue)}
                        aria-describedby={
                          finalGradeIssue
                            ? `calculator-${toolKey}-final-grade-error`
                            : undefined
                        }
                        onChange={(event) => {
                          clearCalculation();
                          updateStoredState(storageKey, (currentState) => ({
                            ...currentState,
                            finalGrade: event.target.value,
                          }));
                        }}
                      />
                      <FieldError
                        id={`calculator-${toolKey}-final-grade-error`}
                      >
                        {getIssueMessage(finalGradeIssue)}
                      </FieldError>
                    </Field>
                  ) : null}

                  <Field data-invalid={Boolean(finalWeightIssue)}>
                    <FieldLabel htmlFor={`calculator-${toolKey}-final-weight`}>
                      {t("finalWeight")}
                    </FieldLabel>
                    <InputGroup>
                      <InputGroupInput
                        id={`calculator-${toolKey}-final-weight`}
                        name="final-weight"
                        value={
                          finalWeight === null
                            ? t("pendingValue")
                            : formatNumber(finalWeight)
                        }
                        readOnly
                        aria-readonly="true"
                        aria-invalid={Boolean(finalWeightIssue)}
                        aria-describedby={
                          finalWeightIssue
                            ? `calculator-${toolKey}-final-weight-error`
                            : undefined
                        }
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupText aria-hidden="true">%</InputGroupText>
                      </InputGroupAddon>
                    </InputGroup>
                    <FieldError
                      id={`calculator-${toolKey}-final-weight-error`}
                    >
                      {getIssueMessage(finalWeightIssue)}
                    </FieldError>
                  </Field>
                </FieldGroup>
              </FieldGroup>
            </CardContent>
          </Card>
        </section>

        <div className="mt-6 flex justify-end">
          <Button type="submit" size="xl" variant="calculate">
            {t("calculate")}
            <CalculatorIcon
              aria-hidden="true"
              data-icon="inline-end"
              strokeWidth={2.5}
            />
          </Button>
        </div>
      </form>

      <section
        aria-labelledby={`calculator-${toolKey}-result-title`}
        className="flex flex-col gap-3"
      >
        <h2
          id={`calculator-${toolKey}-result-title`}
          className="text-base font-medium"
        >
          {t("resultTitle")}
        </h2>
        <Card className="w-full">
          <CardContent aria-live="polite" aria-atomic="true">
            {renderResult()}
          </CardContent>
        </Card>
      </section>

      <section
        aria-labelledby={`calculator-${toolKey}-how-it-works-title`}
        className="flex flex-col gap-3"
      >
        <h2
          id={`calculator-${toolKey}-how-it-works-title`}
          className="text-base font-medium"
        >
          {t("howItWorksTitle")}
        </h2>
        <Card className="w-full">
          <CardContent>
            <div className="space-y-4 text-sm leading-6">
              <p>{t("howItWorksIntroduction")}</p>

              <section className="space-y-2">
                <h3 className="font-bold">{t("systemTitle")}</h3>
                <p>{t("systemDescription")}</p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold">{t("formulaTitle")}</h3>
                <p>{t("formulaIntroduction")}</p>
                <blockquote className="border-l-4 border-border bg-muted/50 px-4 py-3 text-center">
                  <p className="font-mono text-xs leading-5 sm:text-sm">
                    <strong>{t("formula")}</strong>
                  </p>
                </blockquote>
                <p>{t("contributionIntroduction")}</p>
                <blockquote className="border-l-4 border-border bg-muted/50 px-4 py-3 text-center">
                  <p className="font-mono text-xs leading-5 sm:text-sm">
                    <strong>{t("contributionFormula")}</strong>
                  </p>
                </blockquote>
                <p>{t("example")}</p>
              </section>
            </div>
          </CardContent>
        </Card>
      </section>

      <section
        aria-labelledby={`calculator-${toolKey}-faq-title`}
        className="flex flex-col gap-3"
      >
        <h2
          id={`calculator-${toolKey}-faq-title`}
          className="text-base font-medium"
        >
          {t("faqTitle")}
        </h2>
        <Card className="w-full">
          <CardContent>
            <dl className="space-y-4 text-sm leading-6">
              {faqKeys.map((key) => (
                <div key={key} className="space-y-1">
                  <dt className="font-bold">{t(`faq.${key}.question`)}</dt>
                  <dd>{t(`faq.${key}.answer`)}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
