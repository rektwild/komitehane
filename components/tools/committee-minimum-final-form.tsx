"use client";

import {useState} from "react";
import {CalculatorIcon} from "lucide-react";
import {useTranslations} from "next-intl";

import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {
  Field,
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CommitteeRow = {
  grade: string;
  weight: string;
};

const MAX_COMMITTEE_COUNT = 10;

function createCommitteeRows(count: number): CommitteeRow[] {
  return Array.from({length: count}, () => ({grade: "", weight: ""}));
}

export function CommitteeMinimumFinalForm() {
  const t = useTranslations("Tools.committeeMinimumFinalForm");
  const [passingGrade, setPassingGrade] = useState("");
  const [committeeCount, setCommitteeCount] = useState("1");
  const [committeeRows, setCommitteeRows] = useState<CommitteeRow[]>(() =>
    createCommitteeRows(1),
  );

  function handleCommitteeCountChange(value: string | null) {
    const nextCount = Number(value);

    if (!Number.isInteger(nextCount) || nextCount < 1 || nextCount > MAX_COMMITTEE_COUNT) {
      return;
    }

    setCommitteeCount(String(nextCount));
    setCommitteeRows((currentRows) =>
      Array.from(
        {length: nextCount},
        (_, index) => currentRows[index] ?? {grade: "", weight: ""},
      ),
    );
  }

  function updateCommitteeRow(
    rowIndex: number,
    field: keyof CommitteeRow,
    value: string,
  ) {
    setCommitteeRows((currentRows) =>
      currentRows.map((row, index) =>
        index === rowIndex ? {...row, [field]: value} : row,
      ),
    );
  }

  return (
    <>
      <section
        aria-labelledby="calculation-information-title"
        className="flex flex-col gap-3"
      >
        <h2 id="calculation-information-title" className="text-base font-medium">
          {t("calculationInformationTitle")}
        </h2>
        <Card className="w-full">
          <CardContent>
            <form onSubmit={(event) => event.preventDefault()} noValidate>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="passing-grade">
                  {t("passingGrade")}
                </FieldLabel>
                <Input
                  id="passing-grade"
                  name="passing-grade"
                  type="number"
                  inputMode="decimal"
                  value={passingGrade}
                  onChange={(event) => setPassingGrade(event.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="committee-count">
                  {t("committeeCount")}
                </FieldLabel>
                <Select
                  value={committeeCount}
                  onValueChange={handleCommitteeCountChange}
                >
                  <SelectTrigger id="committee-count" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {Array.from({length: MAX_COMMITTEE_COUNT}, (_, index) => {
                        const value = String(index + 1);

                        return (
                          <SelectItem key={value} value={value}>
                            {value}
                          </SelectItem>
                        );
                      })}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <FieldGroup className="gap-4">
                {committeeRows.map((row, index) => {
                  const committeeNumber = index + 1;
                  const gradeId = `committee-${committeeNumber}-grade`;
                  const weightId = `committee-${committeeNumber}-weight`;

                  return (
                    <div
                      key={committeeNumber}
                      className="grid grid-cols-2 gap-4"
                    >
                      <Field>
                        <FieldLabel htmlFor={gradeId}>
                          {t("committeeGrade", {index: String(committeeNumber)})}
                        </FieldLabel>
                        <Input
                          id={gradeId}
                          name={`committees.${index}.grade`}
                          type="number"
                          inputMode="decimal"
                          value={row.grade}
                          onChange={(event) =>
                            updateCommitteeRow(index, "grade", event.target.value)
                          }
                        />
                      </Field>

                      <Field>
                        <FieldLabel htmlFor={weightId}>
                          {t("committeeWeight", {index: String(committeeNumber)})}
                        </FieldLabel>
                        <InputGroup>
                          <InputGroupInput
                            id={weightId}
                            name={`committees.${index}.weight`}
                            type="number"
                            inputMode="decimal"
                            value={row.weight}
                            onChange={(event) =>
                              updateCommitteeRow(index, "weight", event.target.value)
                            }
                          />
                          <InputGroupAddon align="inline-end">
                            <InputGroupText aria-hidden="true">%</InputGroupText>
                          </InputGroupAddon>
                        </InputGroup>
                      </Field>
                    </div>
                  );
                })}

                <Field>
                  <FieldLabel htmlFor="final-weight">
                    {t("finalWeight")}
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      id="final-weight"
                      name="final-weight"
                      value={t("pendingValue")}
                      readOnly
                      aria-readonly="true"
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupText aria-hidden="true">%</InputGroupText>
                    </InputGroupAddon>
                  </InputGroup>
                </Field>
              </FieldGroup>
            </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </section>

      <div className="flex justify-end">
        <Button type="button" size="xl" variant="calculate">
          {t("calculate")}
          <CalculatorIcon aria-hidden="true" data-icon="inline-end" />
        </Button>
      </div>

      <section
        aria-labelledby="calculation-result-title"
        className="flex flex-col gap-3"
      >
        <h2 id="calculation-result-title" className="text-base font-medium">
          {t("resultTitle")}
        </h2>
        <Card className="w-full">
          <CardContent aria-live="polite">—</CardContent>
        </Card>
      </section>

      <section
        aria-labelledby="committee-grade-calculation-title"
        className="flex flex-col gap-3"
      >
        <h2
          id="committee-grade-calculation-title"
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
                <h3 className="font-bold">{t("minimumFinalTitle")}</h3>
                <p>{t("minimumFinalIntroduction")}</p>
                <blockquote className="space-y-2 border-l-4 border-border bg-muted/50 px-4 py-3 text-center">
                  <p className="font-mono text-xs leading-5 sm:text-sm">
                    <strong>{t("minimumFinalFormula")}</strong>
                  </p>
                </blockquote>
                <p>{t("minimumFinalContributionIntroduction")}</p>
                <blockquote className="border-l-4 border-border bg-muted/50 px-4 py-3 text-center">
                  <p className="font-mono text-xs leading-5 sm:text-sm">
                    <strong>{t("minimumFinalContributionFormula")}</strong>
                  </p>
                </blockquote>
                <p>
                  {t("minimumFinalExamplePrefix")}{" "}
                  <span className="font-mono">
                    {t("minimumFinalExampleCalculation")}
                  </span>{" "}
                  <strong>{t("minimumFinalExampleResult")}</strong>{" "}
                  {t("minimumFinalExampleSuffix")}
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </section>

      <section
        aria-labelledby="frequently-asked-questions-title"
        className="flex flex-col gap-3"
      >
        <h2
          id="frequently-asked-questions-title"
          className="text-base font-medium"
        >
          {t("faqTitle")}
        </h2>
        <Card className="w-full">
          <CardContent>
            <dl className="space-y-4 text-sm leading-6">
              <div className="space-y-1">
                <dt className="font-bold">{t("faqCommitteeGradeQuestion")}</dt>
                <dd>{t("faqCommitteeGradeAnswer")}</dd>
              </div>

              <div className="space-y-1">
                <dt className="font-bold">{t("faqMinimumFinalQuestion")}</dt>
                <dd>{t("faqMinimumFinalAnswer")}</dd>
              </div>

              <div className="space-y-1">
                <dt className="font-bold">
                  {t("faqMidtermCommitteeDifferenceQuestion")}
                </dt>
                <dd>{t("faqMidtermCommitteeDifferenceAnswer")}</dd>
              </div>

              <div className="space-y-1">
                <dt className="font-bold">{t("faqPassingGradeQuestion")}</dt>
                <dd>{t("faqPassingGradeAnswer")}</dd>
              </div>

              <div className="space-y-1">
                <dt className="font-bold">
                  {t("faqRequiredFinalGradeQuestion")}
                </dt>
                <dd>{t("faqRequiredFinalGradeAnswer")}</dd>
              </div>

              <div className="space-y-1">
                <dt className="font-bold">{t("faqStorageQuestion")}</dt>
                <dd>{t("faqStorageAnswer")}</dd>
              </div>

              <div className="space-y-1">
                <dt className="font-bold">{t("faqFreeQuestion")}</dt>
                <dd>{t("faqFreeAnswer")}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
