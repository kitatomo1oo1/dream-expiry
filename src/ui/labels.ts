import type { Status, ExpiryType, LifeEventType, DreamLineState } from "../types";

/** UI表示用の日本語ラベル。禁止事項(偽成功率・難易度点・人生ランキング)に該当しない、事実の状態説明のみを行う。 */

export function statusLabel(status: Status): string {
  switch (status) {
    case "OPEN":
      return "開いている";
    case "FUTURE":
      return "まだ先";
    case "CONDITIONAL":
      return "条件あり";
    case "ROUTE_CLOSED":
      return "閉じている";
    case "ALTERNATIVE_AVAILABLE":
      return "別の入口がある";
    case "UNKNOWN":
      return "未確認";
  }
}

export function expiryLabel(expiry: ExpiryType): string {
  switch (expiry) {
    case "HARD":
      return "厳格な期限";
    case "ROUTE":
      return "ルート固有の期限";
    case "CONDITIONAL":
      return "条件付きの期限";
    case "DYNAMIC":
      return "変動する基準";
    case "NO_UPPER_DEADLINE_FOUND":
      return "年齢による正式な上限が見つからない";
    case "UNKNOWN":
      return "期限は未確認";
  }
}

export function lifeEventTypeLabel(type: LifeEventType): string {
  switch (type) {
    case "DREAM_START":
      return "夢のはじまり";
    case "ENTRY":
      return "参入";
    case "TRAINING":
      return "修行・育成";
    case "DREAM_LINE":
      return "DREAM LINE";
    case "MILESTONE":
      return "節目";
    case "SETBACK":
      return "挫折";
    case "RETIREMENT":
      return "引退";
    case "CAREER_CHANGE":
      return "転身";
    case "COMEBACK":
      return "復帰";
  }
}

export function dreamLineStateLabel(state: DreamLineState): string {
  switch (state) {
    case "SEED_VERIFIED":
    case "SEED_VERIFIED_2026":
      return "一次資料で確認済み";
    case "CYCLE_SCOPED":
      return "年度・サイクルにより数値が変わる";
    case "ROUTE_SCOPED":
      return "特定ルートに固有の定義";
    case "DEFINITIONAL":
      return "免許・制度を伴わない定義的な地点";
    case "DYNAMIC":
      return "基準が将来変わりうる";
    case "NEEDS_PRIMARY_FINALIZATION":
      return "一次資料での最終確認が未完了";
  }
}
