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
