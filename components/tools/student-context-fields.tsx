"use client";

import {useCallback, useSyncExternalStore} from "react";
import {useTranslations} from "next-intl";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {Field, FieldError, FieldLabel} from "@/components/ui/field";
import {Input} from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {MEDICAL_UNIVERSITIES} from "@/lib/universities";

const STUDENT_CONTEXT_STORAGE_VERSION = 1;
const STUDENT_CONTEXT_STORAGE_KEY = `komitehane:tools:student-context:v${STUDENT_CONTEXT_STORAGE_VERSION}`;

const classYearValues = ["prep", "1", "2", "3", "4", "5", "6"] as const;

type StoredStudentContextState = {
  version: number;
  university: string;
  department: string;
  classYear: string;
};

export type StudentContextValidation = {
  department?: boolean;
  classYear?: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function createEmptyStudentContext(): StoredStudentContextState {
  return {
    version: STUDENT_CONTEXT_STORAGE_VERSION,
    university: "",
    department: "",
    classYear: "",
  };
}

function parseStoredStudentContext(
  rawValue: string | null,
): StoredStudentContextState {
  if (!rawValue) return createEmptyStudentContext();

  try {
    const parsed: unknown = JSON.parse(rawValue);

    if (!isRecord(parsed) || parsed.version !== STUDENT_CONTEXT_STORAGE_VERSION) {
      return createEmptyStudentContext();
    }

    const storedClassYear =
      typeof parsed.classYear === "string" ? parsed.classYear : "";
    const classYear = classYearValues.includes(
      storedClassYear as (typeof classYearValues)[number],
    )
      ? storedClassYear
      : "";

    const storedUniversity =
      typeof parsed.university === "string" ? parsed.university : "";
    const university = (
      MEDICAL_UNIVERSITIES as readonly string[]
    ).includes(storedUniversity)
      ? storedUniversity
      : "";
    const department =
      typeof parsed.department === "string" ? parsed.department : "";

    return {
      version: STUDENT_CONTEXT_STORAGE_VERSION,
      university,
      department,
      classYear,
    };
  } catch {
    return createEmptyStudentContext();
  }
}

type StorageSnapshot = {
  rawValue: string | null;
  state: StoredStudentContextState;
};

const serverStoredStudentContext = createEmptyStudentContext();
const storageSnapshots = new Map<string, StorageSnapshot>();
const storageListeners = new Map<string, Set<() => void>>();

function getStorageSnapshot(key: string): StoredStudentContextState {
  if (typeof window === "undefined") return serverStoredStudentContext;

  try {
    const rawValue = window.localStorage.getItem(key);
    const cachedSnapshot = storageSnapshots.get(key);

    if (cachedSnapshot?.rawValue === rawValue) {
      return cachedSnapshot.state;
    }

    const state = parseStoredStudentContext(rawValue);
    storageSnapshots.set(key, {rawValue, state});

    return state;
  } catch {
    return (
      storageSnapshots.get(key)?.state ?? serverStoredStudentContext
    );
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

function updateStoredStudentContext(
  key: string,
  updater: (
    state: StoredStudentContextState,
  ) => StoredStudentContextState,
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

function normalizeTurkish(value: string) {
  return value.toLocaleLowerCase("tr");
}

function getServerStorageSnapshot() {
  return serverStoredStudentContext;
}

export function useStudentContext() {
  const subscribe = useCallback(
    (listener: () => void) =>
      subscribeToStorage(STUDENT_CONTEXT_STORAGE_KEY, listener),
    [],
  );
  const getSnapshot = useCallback(
    () => getStorageSnapshot(STUDENT_CONTEXT_STORAGE_KEY),
    [],
  );

  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerStorageSnapshot,
  );
}

export function StudentContextFields({
  onContextChange,
  validation,
}: {
  onContextChange?: () => void;
  validation?: StudentContextValidation;
}) {
  const t = useTranslations("Tools.studentContext");

  const {university, department, classYear} = useStudentContext();
  const hasUniversity = university !== "";
  const hasDepartment = department.trim() !== "";
  const departmentHasError = Boolean(validation?.department);
  const classYearHasError = Boolean(validation?.classYear);

  const handleUniversityChange = useCallback((value: string | null) => {
    onContextChange?.();
    updateStoredStudentContext(STUDENT_CONTEXT_STORAGE_KEY, (currentState) => ({
      ...currentState,
      university: value ?? "",
      department: "",
      classYear: "",
    }));
  }, [onContextChange]);

  const handleDepartmentChange = useCallback(
    (value: string) => {
      onContextChange?.();
      updateStoredStudentContext(
        STUDENT_CONTEXT_STORAGE_KEY,
        (currentState) => ({
          ...currentState,
          department: value,
          classYear: "",
        }),
      );
    },
    [onContextChange],
  );

  const handleClassYearChange = useCallback((value: string | null) => {
    onContextChange?.();
    updateStoredStudentContext(STUDENT_CONTEXT_STORAGE_KEY, (currentState) => ({
      ...currentState,
      classYear: value ?? "",
    }));
  }, [onContextChange]);

  const filterUniversity = useCallback(
    (itemValue: string, query: string) =>
      query.trim() === ""
        ? true
        : normalizeTurkish(itemValue).includes(normalizeTurkish(query.trim())),
    [],
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field>
        <FieldLabel htmlFor="student-context-university">
          {t("university")}
        </FieldLabel>
        <Combobox
          items={MEDICAL_UNIVERSITIES}
          value={university === "" ? null : university}
          onValueChange={handleUniversityChange}
          filter={filterUniversity}
        >
          <ComboboxInput
            id="student-context-university"
            name="university"
            className="w-full"
            placeholder={t("universityPlaceholder")}
            showClear
          />
          <ComboboxContent>
            <ComboboxList>
              {(itemValue: string) => (
                <ComboboxItem key={itemValue} value={itemValue}>
                  {itemValue}
                </ComboboxItem>
              )}
            </ComboboxList>
            <ComboboxEmpty>{t("universityNoResults")}</ComboboxEmpty>
          </ComboboxContent>
        </Combobox>
      </Field>

      {hasUniversity ? (
        <Field data-invalid={departmentHasError}>
          <FieldLabel htmlFor="student-context-department">
            {t("department")}
          </FieldLabel>
          <Input
            id="student-context-department"
            name="department"
            value={department}
            placeholder={t("departmentPlaceholder")}
            aria-invalid={departmentHasError}
            aria-describedby={
              departmentHasError
                ? "student-context-department-error"
                : undefined
            }
            onChange={(event) => handleDepartmentChange(event.target.value)}
          />
          {departmentHasError ? (
            <FieldError id="student-context-department-error">
              {t("validation.departmentRequired")}
            </FieldError>
          ) : null}
        </Field>
      ) : null}

      {hasUniversity && hasDepartment ? (
        <Field data-invalid={classYearHasError}>
          <FieldLabel htmlFor="student-context-class">
            {t("class")}
          </FieldLabel>
          <Select
            value={classYear === "" ? null : classYear}
            onValueChange={handleClassYearChange}
          >
            <SelectTrigger
              id="student-context-class"
              className="w-full"
              aria-invalid={classYearHasError}
              aria-describedby={
                classYearHasError ? "student-context-class-error" : undefined
              }
            >
              <SelectValue placeholder={t("classPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {classYearValues.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value === "prep"
                      ? t("classes.prep")
                      : t("classes.year", {index: value})}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {classYearHasError ? (
            <FieldError id="student-context-class-error">
              {t("validation.classRequired")}
            </FieldError>
          ) : null}
        </Field>
      ) : null}
    </div>
  );
}
