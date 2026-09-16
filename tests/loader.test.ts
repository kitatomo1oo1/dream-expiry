import { describe, it, expect } from "vitest";
import { loadDataSet } from "../src/data/loader";

describe("loadDataSet", () => {
  it("参照整合性エラーなく読み込める", () => {
    expect(() => loadDataSet()).not.toThrow();
  });

  it("代表10夢すべてに occupation と route が存在する", () => {
    const ds = loadDataSet();
    const representative = ds.dreams.filter((d) => d.is_representative);
    expect(representative).toHaveLength(10);
    for (const dream of representative) {
      for (const occId of dream.occupation_ids) {
        const occ = ds.occupations.find((o) => o.id === occId);
        expect(occ).toBeDefined();
        expect(occ!.route_ids.length).toBeGreaterThan(0);
      }
    }
  });

  it("launch_dreams.json から level を正しく結合する", () => {
    const ds = loadDataSet();
    const doctor = ds.occupations.find((o) => o.id === "doctor");
    const manga = ds.occupations.find((o) => o.id === "manga_artist");
    expect(doctor?.level).toBe("A");
    expect(manga?.level).toBe("B");
  });

  it("dream_line_seed.json の state を書き換えずに引き継ぐ", () => {
    const ds = loadDataSet();
    const youtuberLine = ds.dreamLines.find((d) => d.occupation_id === "youtuber");
    expect(youtuberLine?.state).toBe("DYNAMIC");
    const takarazukaLine = ds.dreamLines.find((d) => d.occupation_id === "takarazuka_performer");
    expect(takarazukaLine?.state).toBe("ROUTE_SCOPED");
  });
});
