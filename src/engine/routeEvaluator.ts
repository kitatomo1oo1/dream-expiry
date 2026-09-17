import type { DataSet, JourneyBeat, JourneyStory, OccupationEvaluation, RouteEvaluation, StepEvaluation, Status } from "../types";
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

const MAX_AGE_SCAN = 99;

/**
 * 「この夢の賞味期限は何歳か」を、標準ルート単体のStatusから計算する。
 * 代替ルートの有無は考慮しない(代替ルートが別にあることはUIで別途伝える。
 * ここで言う賞味期限は「標準ルートが閉じる年齢」という意味)。
 * ages[T..MAX_AGE_SCAN] が全てROUTE_CLOSEDになる最小のTを返す。
 * そのようなTが存在しない(=標準ルートが年齢で閉じることが確認できない)場合はnull。
 */
export function computeStandardRouteExpiryAge(
  ds: DataSet,
  occupationId: string,
  referenceDate: Date = new Date()
): number | null {
  const occupation = ds.occupations.find((o) => o.id === occupationId);
  if (!occupation) throw new Error(`Unknown occupation: ${occupationId}`);
  const standardRouteId = occupation.route_ids
    .map((id) => findRoute(ds, id))
    .find((r) => r.is_standard)?.id;
  if (!standardRouteId) return null;

  const statuses: Status[] = [];
  for (let age = 0; age <= MAX_AGE_SCAN; age++) {
    statuses.push(evaluateRoute(ds, standardRouteId, age, referenceDate).status);
  }

  for (let t = 0; t <= MAX_AGE_SCAN; t++) {
    if (statuses.slice(t).every((s) => s === "ROUTE_CLOSED")) {
      return t;
    }
  }
  return null;
}

/**
 * ひとつのルート(Stepの列)を startAge から順に辿り、各Stepに「挑めるようになる年齢」を
 * 特定して物語の一コマ(JourneyBeat)を積み上げる。あるStepがROUTE_CLOSEDならそこで
 * 道は途切れる(呼び出し側が代替ルートへ切り替える)。
 */
function narrateRouteSteps(
  ds: DataSet,
  stepIds: string[],
  startAge: number,
  referenceDate: Date
): { beats: JourneyBeat[]; ok: boolean } {
  const orderedSteps = stepIds
    .map((id) => findStep(ds, id))
    .sort((a, b) => a.order - b.order);

  const beats: JourneyBeat[] = [];
  let age = startAge;
  for (const step of orderedSteps) {
    let evaluation = evaluateStep(ds, step.id, age, referenceDate);
    while (evaluation.status === "FUTURE" && age < MAX_AGE_SCAN) {
      age += 1;
      evaluation = evaluateStep(ds, step.id, age, referenceDate);
    }
    if (evaluation.status === "ROUTE_CLOSED" || evaluation.status === "FUTURE") {
      return { beats, ok: false };
    }
    beats.push({ age, step_name: step.name, status: evaluation.status });
  }
  return { beats, ok: true };
}

/**
 * startAge からこの夢を目指した場合の「始点からDREAM LINEまでの道筋」を物語の
 * コマとして返す。ユーザー要望: 「賞味期限内であるからには、夢をかなえる道筋がある」
 * ——つまり単発のStatus表示ではなく、標準ルートが途中で閉じるなら代替ルートへ
 * 自動的に切り替えて、最後まで辿り着けるかどうかを一連の流れとして示す。
 */
export function computeJourneyStory(
  ds: DataSet,
  occupationId: string,
  startAge: number,
  referenceDate: Date = new Date()
): JourneyStory {
  const occupation = ds.occupations.find((o) => o.id === occupationId);
  if (!occupation) throw new Error(`Unknown occupation: ${occupationId}`);

  const routes = occupation.route_ids.map((id) => findRoute(ds, id));
  const standard = routes.find((r) => r.is_standard);
  const alternatives = routes.filter((r) => !r.is_standard);

  if (!standard) {
    return { beats: [], reachable: false, route_name: null, used_alternative: false, standard_beats_count: 0 };
  }

  const standardResult = narrateRouteSteps(ds, standard.step_ids, startAge, referenceDate);
  if (standardResult.ok) {
    return {
      beats: standardResult.beats,
      reachable: true,
      route_name: standard.name,
      used_alternative: false,
      standard_beats_count: standardResult.beats.length,
    };
  }

  for (const alt of alternatives) {
    const altResult = narrateRouteSteps(ds, alt.step_ids, startAge, referenceDate);
    if (altResult.ok) {
      return {
        beats: [...standardResult.beats, ...altResult.beats],
        reachable: true,
        route_name: alt.name,
        used_alternative: true,
        standard_beats_count: standardResult.beats.length,
      };
    }
  }

  return {
    beats: standardResult.beats,
    reachable: false,
    route_name: null,
    used_alternative: false,
    standard_beats_count: standardResult.beats.length,
  };
}
