import { describe, it, expect } from "vitest";
import { ageMatches } from "../src/engine/ageEvaluator";

describe("ageMatches", () => {
  it("lt: 境界未満のみ真", () => {
    expect(ageMatches({ kind: "lt", age: 20 }, 19)).toBe(true);
    expect(ageMatches({ kind: "lt", age: 20 }, 20)).toBe(false);
  });

  it("lte: 境界を含む", () => {
    expect(ageMatches({ kind: "lte", age: 20 }, 20)).toBe(true);
    expect(ageMatches({ kind: "lte", age: 20 }, 21)).toBe(false);
  });

  it("gte: 境界を含む", () => {
    expect(ageMatches({ kind: "gte", age: 20 }, 20)).toBe(true);
    expect(ageMatches({ kind: "gte", age: 20 }, 19)).toBe(false);
  });

  it("gt: 境界超過のみ真", () => {
    expect(ageMatches({ kind: "gt", age: 20 }, 21)).toBe(true);
    expect(ageMatches({ kind: "gt", age: 20 }, 20)).toBe(false);
  });

  it("between: 両端を含む", () => {
    expect(ageMatches({ kind: "between", min: 15, max: 19 }, 15)).toBe(true);
    expect(ageMatches({ kind: "between", min: 15, max: 19 }, 19)).toBe(true);
    expect(ageMatches({ kind: "between", min: 15, max: 19 }, 14)).toBe(false);
    expect(ageMatches({ kind: "between", min: 15, max: 19 }, 20)).toBe(false);
  });

  it("any: 常に真", () => {
    expect(ageMatches({ kind: "any" }, 0)).toBe(true);
    expect(ageMatches({ kind: "any" }, 130)).toBe(true);
  });
});
