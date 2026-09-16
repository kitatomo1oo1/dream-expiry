import type { DataSet, DreamLine, Discovery, Person, LifeEvent } from "../types";
import { evaluateOccupation } from "./routeEvaluator";

export function getDreamLine(ds: DataSet, occupationId: string): DreamLine | null {
  return ds.dreamLines.find((d) => d.occupation_id === occupationId) ?? null;
}

export function getPersonsForOccupation(ds: DataSet, occupationId: string): Person[] {
  return ds.persons.filter((p) => p.occupation_id === occupationId);
}

export function getLifeEventsForPerson(ds: DataSet, personId: string): LifeEvent[] {
  return ds.lifeEvents
    .filter((e) => e.person_id === personId)
    .slice()
    .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
}

/**
 * 年齢スライダーを previousAge → currentAge に動かした際に「何が変わったか」を発見として返す。
 * Step 単位で Status が変化し、かつ該当ルールに discovery_text がある場合のみ発見として採用する
 * (事実と一致しない場合は文言を作らない)。
 */
export function computeDiscoveries(
  ds: DataSet,
  occupationId: string,
  previousAge: number | null,
  currentAge: number,
  referenceDate: Date = new Date()
): Discovery[] {
  if (previousAge === null || previousAge === currentAge) return [];

  const prevEval = evaluateOccupation(ds, occupationId, previousAge, referenceDate);
  const currEval = evaluateOccupation(ds, occupationId, currentAge, referenceDate);
  const discoveries: Discovery[] = [];

  for (const currRoute of currEval.routes) {
    const prevRoute = prevEval.routes.find((r) => r.route_id === currRoute.route_id);
    for (const currStep of currRoute.steps) {
      const prevStep = prevRoute?.steps.find((s) => s.step_id === currStep.step_id);
      if (!prevStep || prevStep.status === currStep.status) continue;
      const text = currStep.matched_rule?.discovery_text;
      if (!text) continue;
      discoveries.push({
        rule_id: currStep.matched_rule!.id,
        step_id: currStep.step_id,
        route_id: currRoute.route_id,
        status: currStep.status,
        expiry_type: currStep.expiry_type,
        text,
      });
    }
  }
  return discoveries;
}

/**
 * 年齢スライダーを一度も動かしていない初回表示時、この夢に年齢による関門が
 * そもそも存在しないなら(=どのStepもNO_UPPER_DEADLINE_FOUND)、スライダーを
 * 動かしても何も起きないという「空振り」体験にせず、その事実自体を発見として渡す。
 */
export function computeInitialInsight(
  ds: DataSet,
  occupationId: string,
  age: number,
  referenceDate: Date = new Date()
): Discovery[] {
  const evaluation = evaluateOccupation(ds, occupationId, age, referenceDate);
  const allSteps = evaluation.routes.flatMap((route) => route.steps);
  const hasNoAgeGateAtAll = allSteps.length > 0 && allSteps.every((step) => step.expiry_type === "NO_UPPER_DEADLINE_FOUND");
  if (!hasNoAgeGateAtAll) return [];
  return [
    {
      rule_id: "",
      step_id: "",
      route_id: "",
      status: evaluation.status,
      expiry_type: "NO_UPPER_DEADLINE_FOUND",
      text: "この夢には、年齢による関門が見つかりません。年齢を動かしても、この判定は変わりません。",
    },
  ];
}
