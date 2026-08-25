import {GradeCalculator} from "@/components/tools/grade-calculator";

/**
 * Backwards-compatible wrapper for callers that still import the original
 * committee minimum-final form component.
 */
export function CommitteeMinimumFinalForm() {
  return <GradeCalculator toolKey="committeeMinimumFinal" />;
}
