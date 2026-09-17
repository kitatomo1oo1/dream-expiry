import { describe, it, expect } from "vitest";
import { loadDataSet } from "../src/data/loader";
import { computeDiscoveries, getDreamLine, getPersonsForOccupation, getLifeEventsForPerson } from "../src/engine/dreamLineEngine";

const ds = loadDataSet();
const REF = new Date("2026-09-17");

describe("computeDiscoveries", () => {
  it("年齢を19→20に動かすとJRA騎手の標準ルートが閉じたことを発見する", () => {
    const discoveries = computeDiscoveries(ds, "jra_jockey", 19, 20, REF);
    expect(discoveries.length).toBeGreaterThan(0);
    expect(discoveries[0].status).toBe("ROUTE_CLOSED");
    expect(discoveries[0].text).toBe("この入口は閉じました");
  });

  it("年齢を23→24に動かすと力士の代替ルートの発見テキストが出る", () => {
    const discoveries = computeDiscoveries(ds, "sumo_wrestler", 23, 24, REF);
    const altDiscovery = discoveries.find((d) => d.status === "ALTERNATIVE_AVAILABLE");
    expect(altDiscovery?.text).toBe("ただし別の入口があります");
  });

  it("年齢が変わらなければ発見は空", () => {
    expect(computeDiscoveries(ds, "doctor", 30, 30, REF)).toEqual([]);
  });

  it("初期状態(previousAgeがnull)では発見は空", () => {
    expect(computeDiscoveries(ds, "doctor", null, 30, REF)).toEqual([]);
  });
});

describe("DreamLine と AFTER データ", () => {
  it("全代表11夢にDREAM LINEの定義が存在する", () => {
    const representativeIds = [
      "doctor",
      "jra_jockey",
      "pro_boxer",
      "sumo_wrestler",
      "pro_footballer",
      "youtuber",
      "shogi_player",
      "takarazuka_performer",
      "manga_artist",
      "actor",
      "pro_baseball",
    ];
    for (const id of representativeIds) {
      const dreamLine = getDreamLine(ds, id);
      expect(dreamLine, `${id} のDREAM LINEが見つからない`).not.toBeNull();
      expect(dreamLine!.description.length).toBeGreaterThan(0);
    }
  });

  it("今泉健司のライフイベントはSETBACKからCOMEBACKへの順で並ぶ(標準ルート閉鎖後の代替ルート実例)", () => {
    const events = getLifeEventsForPerson(ds, "p_imaizumi_kenji");
    expect(events.map((e) => e.type)).toEqual(["SETBACK", "COMEBACK"]);
  });

  it("力士のAFTER実例には曙太郎が含まれる", () => {
    const persons = getPersonsForOccupation(ds, "sumo_wrestler");
    expect(persons.some((p) => p.id === "p_akebono")).toBe(true);
  });
});
