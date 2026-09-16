import type { AgeCondition } from "../types";

/** 年齢が AgeCondition を満たすかどうかを判定する。between は両端を含む。 */
export function ageMatches(condition: AgeCondition, age: number): boolean {
  switch (condition.kind) {
    case "lt":
      return age < condition.age;
    case "lte":
      return age <= condition.age;
    case "gte":
      return age >= condition.age;
    case "gt":
      return age > condition.age;
    case "between":
      return age >= condition.min && age <= condition.max;
    case "any":
      return true;
  }
}
