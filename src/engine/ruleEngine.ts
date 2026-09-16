import type { Rule, Status } from "../types";
import { ageMatches } from "./ageEvaluator";

/** 複数ルールが同時に該当した場合に、どちらを優先するかの順位(数値が小さいほど優先)。 */
export const STATUS_PRIORITY: Record<Status, number> = {
  ROUTE_CLOSED: 0,
  CONDITIONAL: 1,
  FUTURE: 2,
  ALTERNATIVE_AVAILABLE: 3,
  OPEN: 4,
  UNKNOWN: 5,
};

function isDateWithinValidity(rule: Rule, referenceDate: Date): boolean {
  if (rule.valid_from && referenceDate < new Date(rule.valid_from)) return false;
  if (rule.valid_until && referenceDate > new Date(rule.valid_until)) return false;
  return true;
}

/**
 * 与えられたルール群から、年齢とサイクル有効期間(valid_from/valid_until)の両方に
 * 合致するルールを選ぶ。複数該当時は最も制約が強いステータスを優先する
 * (例: CONDITIONAL と OPEN が同時に該当したら CONDITIONAL を採用)。
 * 一件も合致しなければ null (呼び出し側で UNKNOWN として扱う=欠落を0/falseにしない)。
 */
export function selectApplicableRule(rules: Rule[], age: number, referenceDate: Date): Rule | null {
  const candidates = rules.filter(
    (rule) => ageMatches(rule.age_condition, age) && isDateWithinValidity(rule, referenceDate)
  );
  if (candidates.length === 0) return null;
  return candidates.reduce((best, current) =>
    STATUS_PRIORITY[current.status] < STATUS_PRIORITY[best.status] ? current : best
  );
}
