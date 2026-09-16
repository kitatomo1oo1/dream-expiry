/**
 * スキーマ定義。data/rule_constants.json の statuses / expiry_types / invariants と一致させること。
 * Dream → Occupation → Route → RouteStep → Rule → DreamLine → Person → LifeEvent
 */

export type Status =
  | "OPEN"
  | "FUTURE"
  | "CONDITIONAL"
  | "ROUTE_CLOSED"
  | "ALTERNATIVE_AVAILABLE"
  | "UNKNOWN";

export type ExpiryType =
  | "HARD"
  | "ROUTE"
  | "CONDITIONAL"
  | "DYNAMIC"
  | "NO_UPPER_DEADLINE_FOUND"
  | "UNKNOWN";

export type Confidence = "high" | "medium" | "low" | "unknown";

/** dream_line_seed.json の state 値。DREAM LINE 定義そのものの確証度合いを表す（年齢ルールの確証度とは別軸）。 */
export type DreamLineState =
  | "SEED_VERIFIED"
  | "SEED_VERIFIED_2026"
  | "CYCLE_SCOPED"
  | "ROUTE_SCOPED"
  | "DEFINITIONAL"
  | "DYNAMIC"
  | "NEEDS_PRIMARY_FINALIZATION";

export interface Source {
  id: string;
  title: string;
  publisher?: string;
  url?: string;
  /** 出典そのものが発行/更新された日 (ISO 8601) */
  source_date?: string;
  /** 実装者がこの出典を確認した日 (ISO 8601) */
  verified_at?: string;
  /** この出典が有効な制度年度・サイクル (例: "2026年度") */
  applicable_cycle?: string;
  confidence: Confidence;
  note?: string;
}

export type AgeCondition =
  | { kind: "lt"; age: number }
  | { kind: "lte"; age: number }
  | { kind: "gte"; age: number }
  | { kind: "gt"; age: number }
  | { kind: "between"; min: number; max: number } // 両端含む
  | { kind: "any" };

export interface Rule {
  id: string;
  step_id: string;
  description: string;
  age_condition: AgeCondition;
  status: Status;
  expiry_type: ExpiryType;
  /** このルール自体が制度として有効になった日 */
  valid_from?: string;
  /** このルール自体が失効した日 (恒久ルールなら省略) */
  valid_until?: string;
  applicable_cycle?: string;
  source_ids: string[];
  /** 年齢スライダーでこのルールが新たに適用された際に表示する発見テキスト */
  discovery_text?: string;
}

export interface RouteStep {
  id: string;
  route_id: string;
  order: number;
  name: string;
  description: string;
  rule_ids: string[];
}

export interface Route {
  id: string;
  occupation_id: string;
  name: string;
  is_standard: boolean;
  step_ids: string[];
}

export interface DreamLine {
  occupation_id: string;
  description: string;
  state: DreamLineState;
  source_ids: string[];
}

export interface Occupation {
  id: string;
  dream_id: string;
  name: string;
  level: "A" | "B" | "UNKNOWN";
  route_ids: string[];
}

export interface Dream {
  id: string;
  name: string;
  occupation_ids: string[];
  /** 代表10夢としてE2E完成済みか */
  is_representative: boolean;
}

export type LifeEventType =
  | "DREAM_START"
  | "ENTRY"
  | "TRAINING"
  | "DREAM_LINE"
  | "MILESTONE"
  | "SETBACK"
  | "RETIREMENT"
  | "CAREER_CHANGE"
  | "COMEBACK";

export interface Person {
  id: string;
  name: string;
  occupation_id: string;
  summary?: string;
  source_ids: string[];
}

export interface LifeEvent {
  id: string;
  person_id: string;
  type: LifeEventType;
  date?: string;
  date_precision?: "day" | "month" | "year" | "unknown";
  description: string;
  source_ids: string[];
}

export interface RuleConstants {
  statuses: Status[];
  expiry_types: ExpiryType[];
  invariants: string[];
}

/** ルールエンジンがひとつの Step について下す評価結果 */
export interface StepEvaluation {
  step_id: string;
  status: Status;
  expiry_type: ExpiryType;
  matched_rule: Rule | null;
}

export interface RouteEvaluation {
  route_id: string;
  is_standard: boolean;
  status: Status;
  steps: StepEvaluation[];
}

export interface OccupationEvaluation {
  occupation_id: string;
  age: number;
  status: Status;
  routes: RouteEvaluation[];
  /** 標準ルート閉鎖時に代替として有効なルート（あれば） */
  alternative_route: RouteEvaluation | null;
}

export interface Discovery {
  rule_id: string;
  step_id: string;
  route_id: string;
  status: Status;
  expiry_type: ExpiryType;
  text: string;
}

/** 正規化済みデータセット全体。data/*.json を読み込んだ後の形。 */
export interface DataSet {
  dreams: Dream[];
  occupations: Occupation[];
  routes: Route[];
  steps: RouteStep[];
  rules: Rule[];
  dreamLines: DreamLine[];
  sources: Source[];
  persons: Person[];
  lifeEvents: LifeEvent[];
  ruleConstants: RuleConstants;
}
