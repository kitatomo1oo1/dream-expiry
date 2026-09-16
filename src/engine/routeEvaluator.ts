import type { DataSet, OccupationEvaluation, RouteEvaluation, StepEvaluation, Status } from "../types";
import { selectApplicableRule, STATUS_PRIORITY } from "./ruleEngine";

function findStep(ds: DataSet, stepId: string) {
  const step = ds.steps.find((s) => s.id === stepId);
  if (!step) throw new Error(`Unknown step: ${stepId}`);
  return step;
}

function findRoute(ds: DataSet, routeId: string) {
  const route = ds.routes.find((r) => r.id === routeId);
  if (!route) throw new Error(`Unknown route: ${routeId}`);
  return route;
}

export function evaluateStep(ds: DataSet, stepId: string, age: number, referenceDate: Date): StepEvaluation {
  const step = findStep(ds, stepId);
  const rules = step.rule_ids.map((id) => {
    const rule = ds.rules.find((r) => r.id === id);
    if (!rule) throw new Error(`Unknown rule: ${id}`);
    return rule;
  });
  const matched = selectApplicableRule(rules, age, referenceDate);
  return {
    step_id: stepId,
    status: matched?.status ?? "UNKNOWN",
    expiry_type: matched?.expiry_type ?? "UNKNOWN",
    matched_rule: matched,
  };
}

/** Step 評価群のうち最も制約が強い(優先度の数値が低い) Status を Route 全体の Status とする。 */
function combineStepStatuses(steps: StepEvaluation[]): Status {
  if (steps.length === 0) return "UNKNOWN";
  return steps.reduce<Status>(
    (worst, s) => (STATUS_PRIORITY[s.status] < STATUS_PRIORITY[worst] ? s.status : worst),
    steps[0].status
  );
}

export function evaluateRoute(ds: DataSet, routeId: string, age: number, referenceDate: Date): RouteEvaluation {
  const route = findRoute(ds, routeId);
  const steps = route.step_ids.map((stepId) => evaluateStep(ds, stepId, age, referenceDate));
  return {
    route_id: routeId,
    is_standard: route.is_standard,
    status: combineStepStatuses(steps),
    steps,
  };
}

const ALT_ACCEPTABLE: ReadonlySet<Status> = new Set(["ALTERNATIVE_AVAILABLE", "OPEN", "CONDITIONAL"]);

/**
 * Occupation 全体を評価する。標準ルートが ROUTE_CLOSED でも、代替ルートが
 * 有効ならば ALTERNATIVE_AVAILABLE を返す — ROUTE_CLOSED ≠ dream_impossible という
 * 不変条件をエンジンのレベルで保証する。
 */
export function evaluateOccupation(
  ds: DataSet,
  occupationId: string,
  age: number,
  referenceDate: Date = new Date()
): OccupationEvaluation {
  const occupation = ds.occupations.find((o) => o.id === occupationId);
  if (!occupation) throw new Error(`Unknown occupation: ${occupationId}`);

  const routes = occupation.route_ids.map((routeId) => evaluateRoute(ds, routeId, age, referenceDate));
  const standard = routes.find((r) => r.is_standard) ?? null;
  const alternatives = routes.filter((r) => !r.is_standard);

  let status: Status;
  let alternative_route: RouteEvaluation | null = null;

  if (!standard) {
    status = "UNKNOWN";
  } else if (standard.status === "ROUTE_CLOSED") {
    const openAlternative = alternatives.find((a) => ALT_ACCEPTABLE.has(a.status));
    if (openAlternative) {
      status = "ALTERNATIVE_AVAILABLE";
      alternative_route = openAlternative;
    } else {
      status = "ROUTE_CLOSED";
    }
  } else {
    status = standard.status;
  }

  return { occupation_id: occupationId, age, status, routes, alternative_route };
}
