import { describe, it, expect } from "vitest";
import { loadDataSet } from "../src/data/loader";
import { evaluateOccupation } from "../src/engine/routeEvaluator";

const ds = loadDataSet();
const REF = new Date("2026-09-17");

function statusOf(occupationId: string, age: number) {
  return evaluateOccupation(ds, occupationId, age, REF).status;
}

describe("JRA騎手 — ENGINE.md必須境界 (14 FUTURE / 15,19 CONDITIONAL / 20 school route closed)", () => {
  it("14歳以下はFUTURE", () => {
    expect(statusOf("jra_jockey", 0)).toBe("FUTURE");
    expect(statusOf("jra_jockey", 14)).toBe("FUTURE");
  });
  it("15〜19歳はCONDITIONAL", () => {
    expect(statusOf("jra_jockey", 15)).toBe("CONDITIONAL");
    expect(statusOf("jra_jockey", 19)).toBe("CONDITIONAL");
  });
  it("20歳以上は標準ルートROUTE_CLOSED(代替ルート未定義のためそのままROUTE_CLOSED)", () => {
    expect(statusOf("jra_jockey", 20)).toBe("ROUTE_CLOSED");
    expect(statusOf("jra_jockey", 40)).toBe("ROUTE_CLOSED");
  });
});

describe("プロボクサー — ENGINE.md必須境界 (16試験/試合分離, 17-34 conditional, 35 newcomer closed)", () => {
  it("16歳未満はFUTURE", () => {
    expect(statusOf("pro_boxer", 15)).toBe("FUTURE");
  });
  it("16歳は試験のみ可(CONDITIONAL)", () => {
    expect(statusOf("pro_boxer", 16)).toBe("CONDITIONAL");
  });
  it("17〜34歳はCONDITIONAL", () => {
    expect(statusOf("pro_boxer", 17)).toBe("CONDITIONAL");
    expect(statusOf("pro_boxer", 34)).toBe("CONDITIONAL");
  });
  it("35歳以上は新規ライセンス取得がROUTE_CLOSED", () => {
    expect(statusOf("pro_boxer", 35)).toBe("ROUTE_CLOSED");
  });
});

describe("力士 — ENGINE.md必須境界 (22 standard candidate / 24 no exception closed / 24 alternative)", () => {
  it("22歳以下はOPEN", () => {
    expect(statusOf("sumo_wrestler", 22)).toBe("OPEN");
  });
  it("23歳はENGINE.mdに明記がないためUNKNOWN(false/0にフォールバックしない)", () => {
    const status = statusOf("sumo_wrestler", 23);
    expect(status).toBe("UNKNOWN");
    expect(status).not.toBe(false);
    expect(status).not.toBe(0);
  });
  it("24歳以上は標準ルートが閉じるが、資格保持者向け代替ルートによりALTERNATIVE_AVAILABLE(ROUTE_CLOSED≠dream_impossible)", () => {
    const evaluation = evaluateOccupation(ds, "sumo_wrestler", 24, REF);
    expect(evaluation.status).toBe("ALTERNATIVE_AVAILABLE");
    expect(evaluation.alternative_route).not.toBeNull();
    const standardRoute = evaluation.routes.find((r) => r.is_standard);
    expect(standardRoute?.status).toBe("ROUTE_CLOSED");
  });
});

describe("プロ棋士 — 標準ルート閉鎖後もプロ編入試験という代替ルートが存在する", () => {
  it("25歳以下は標準ルートOPEN", () => {
    expect(statusOf("shogi_player", 25)).toBe("OPEN");
  });
  it("26〜29歳はCONDITIONAL(三段リーグ特例)", () => {
    expect(statusOf("shogi_player", 26)).toBe("CONDITIONAL");
    expect(statusOf("shogi_player", 29)).toBe("CONDITIONAL");
  });
  it("30歳以上は標準ルートが閉じるが、プロ編入試験によりALTERNATIVE_AVAILABLE", () => {
    const evaluation = evaluateOccupation(ds, "shogi_player", 41, REF);
    expect(evaluation.status).toBe("ALTERNATIVE_AVAILABLE");
    const standardRoute = evaluation.routes.find((r) => r.is_standard);
    expect(standardRoute?.status).toBe("ROUTE_CLOSED");
  });
});

describe("医師・漫画家・俳優 — 年齢による正式な上限が見つからない(NO_UPPER_DEADLINE_FOUND)", () => {
  it.each(["doctor", "manga_artist", "actor"])("%s はどの年齢でもOPEN", (occId) => {
    expect(statusOf(occId, 5)).toBe("OPEN");
    expect(statusOf(occId, 60)).toBe("OPEN");
    expect(statusOf(occId, 100)).toBe("OPEN");
  });

  it("NO_UPPER_DEADLINE_FOUND であることは「簡単」を意味しない(expiry_typeとstatusは別軸)", () => {
    const evaluation = evaluateOccupation(ds, "doctor", 30, REF);
    const step = evaluation.routes[0].steps[0];
    expect(step.expiry_type).toBe("NO_UPPER_DEADLINE_FOUND");
    expect(step.status).toBe("OPEN");
  });
});

describe("宝塚歌劇団員 — CYCLE_SCOPEDな受験資格年齢", () => {
  it("15歳未満はFUTURE", () => {
    expect(statusOf("takarazuka_performer", 10)).toBe("FUTURE");
  });
  it("15〜19歳はCONDITIONAL", () => {
    expect(statusOf("takarazuka_performer", 15)).toBe("CONDITIONAL");
    expect(statusOf("takarazuka_performer", 19)).toBe("CONDITIONAL");
  });
  it("20歳以上は標準ルートROUTE_CLOSED", () => {
    expect(statusOf("takarazuka_performer", 20)).toBe("ROUTE_CLOSED");
  });
});

describe("YouTuber — DYNAMICな年齢ゲート(収益受取のみ年齢依存)", () => {
  it("18歳未満は収益受取がCONDITIONAL(保護者名義アカウント必要)", () => {
    const evaluation = evaluateOccupation(ds, "youtuber", 16, REF);
    const payoutStep = evaluation.routes[0].steps.find((s) => s.step_id === "step_youtuber_monetization_payout");
    expect(payoutStep?.status).toBe("CONDITIONAL");
  });
  it("18歳以上は収益受取がOPEN", () => {
    const evaluation = evaluateOccupation(ds, "youtuber", 18, REF);
    const payoutStep = evaluation.routes[0].steps.find((s) => s.step_id === "step_youtuber_monetization_payout");
    expect(payoutStep?.status).toBe("OPEN");
  });
});

describe("プロサッカー選手 — 契約締結そのものに年齢上限はないが、育成年代からの入口は実質22歳前後で閉じる", () => {
  it("15歳未満はFUTURE", () => {
    expect(statusOf("pro_footballer", 14)).toBe("FUTURE");
  });
  it("15〜22歳は育成年代ルートも契約締結もOPEN", () => {
    expect(statusOf("pro_footballer", 15)).toBe("OPEN");
    expect(statusOf("pro_footballer", 22)).toBe("OPEN");
  });
  it("23歳以上はゼロから始める育成年代ルートがROUTE_CLOSEDになり、全体もROUTE_CLOSED(契約締結ステップ単体は年齢上限なしのまま)", () => {
    const evaluation = evaluateOccupation(ds, "pro_footballer", 58, REF);
    expect(evaluation.status).toBe("ROUTE_CLOSED");
    const youthStep = evaluation.routes[0].steps.find((s) => s.step_id === "step_football_youth_pathway");
    const contractStep = evaluation.routes[0].steps.find((s) => s.step_id === "step_football_contract");
    expect(youthStep?.status).toBe("ROUTE_CLOSED");
    expect(contractStep?.status).toBe("OPEN");
    expect(contractStep?.expiry_type).toBe("NO_UPPER_DEADLINE_FOUND");
  });
});
